import os
import cv2
import re
import time
import numpy as np
import torch
from paddleocr import PaddleOCR

from ultralytics import YOLO
from sqlalchemy.exc import SQLAlchemyError

from app.models.product import Product
from app.models.recognition_log import RecognitionLog
from app.models.ai_product_mapping import AIProductMapping
from app.models.product_attribute_value import ProductAttributeValue

from torchvision.models import mobilenet_v3_small, mobilenet_v3_large
import torch.nn as nn
import torch.nn.functional as F


# Path / Device
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model_files")

YOLO_MODEL_PATH = os.path.join(MODEL_DIR, "best.pt")
CLS_MODEL_PATH = os.path.join(MODEL_DIR, "mobilenetv3_best.pt")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# YOLO (Detection)
YOLO_IMGSZ = 352  # 해상도 조정 (416->352): 속도와 정확도 균형
YOLO_CONF = 0.20
YOLO_IOU = 0.50

yolo_model = YOLO(YOLO_MODEL_PATH)


# MobileNet (Classification)
NUM_CLASSES = 34
OCR_SKIP_CONF = 0.90  # 90% 이상이면 OCR 생략

def _load_state_dict_any(path: str, device: str):
    ckpt = torch.load(path, map_location=device)
    if isinstance(ckpt, dict) and "model_state" in ckpt:
        state_dict = ckpt["model_state"]
        img_size = int(ckpt.get("img_size", 224))
        arch = ckpt.get("arch", None)
        return state_dict, img_size, arch
    return ckpt, 224, None


def _infer_backbone_from_state_dict(state_dict: dict):
    """
    MobileNetV3 small vs large를 state_dict만으로 추정.
    - large: classifier.0.weight -> [1280, 960]
    - small: classifier.0.weight -> [1024, 576]
    """
    w = state_dict.get("classifier.0.weight", None)
    if w is None:
        return "small"  # 보수적으로 small
    out_features, in_features = w.shape
    if out_features == 1280 and in_features == 960:
        return "large"
    if out_features == 1024 and in_features == 576:
        return "small"
    return "small"


state_dict, IMG_SIZE, arch_hint = _load_state_dict_any(CLS_MODEL_PATH, DEVICE)
backbone = arch_hint or _infer_backbone_from_state_dict(state_dict)

if backbone == "large":
    cls_model = mobilenet_v3_large(weights=None)
else:
    cls_model = mobilenet_v3_small(weights=None)

cls_model.classifier[3] = nn.Linear(
    cls_model.classifier[3].in_features,
    NUM_CLASSES
)

cls_model.load_state_dict(state_dict, strict=True)
cls_model.to(DEVICE)
cls_model.eval()

# Warm-up (cold start 완화)
with torch.no_grad():
    _dummy = torch.zeros(1, 3, IMG_SIZE, IMG_SIZE).to(DEVICE)
    cls_model(_dummy)


# OCR - PaddleOCR 기본값 사용 (자동 캐시 다운로드로 안정성 확보)
OCR_DEVICE = "gpu" if torch.cuda.is_available() else "cpu"

ocr = PaddleOCR(
    use_angle_cls=True,         # 각도 분류 켜기 - 이미지 회전 자동 보정
    lang='korean',
    device=OCR_DEVICE,
    det_limit_side_len=224,     # 탐지 이미지 크기 (192->224): 정확도 복구
    rec_batch_num=1             # 배치 크기 1 (단일 이미지 처리에 최적)
)


# Utils
def normalize(text: str) -> str:
    return text.lower().replace(" ", "") if text else ""


def safe_crop(img, x1, y1, x2, y2):
    h, w = img.shape[:2]
    x1, x2 = max(0, x1), min(w, x2)
    y1, y2 = max(0, y1), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return None
    return img[y1:y2, x1:x2]


def preprocess_bgr(img_bgr: np.ndarray) -> torch.Tensor:
    if img_bgr is None or img_bgr.size == 0:
        raise ValueError("빈 이미지")
    img = cv2.resize(img_bgr, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_LINEAR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    img = np.transpose(img, (2, 0, 1))
    return torch.from_numpy(img).unsqueeze(0).to(DEVICE)


def classify_with_mobilenet(img_bgr: np.ndarray):
    x = preprocess_bgr(img_bgr)
    with torch.no_grad():
        logits = cls_model(x)
        probs = F.softmax(logits, dim=1)
        cls_id = int(torch.argmax(probs, dim=1).item())
        cls_conf = float(probs[0, cls_id].item())
    return cls_id, cls_conf


def run_ocr(img_bgr: np.ndarray):
    if img_bgr is None or img_bgr.size == 0:
        return None
    try:
        # OCR 입력 이미지를 과도하게 크게 넣으면 느려지므로, 긴 변을 400px로 제한
        h, w = img_bgr.shape[:2]
        max_side = max(h, w)
        if max_side > 400:
            scale = 400 / max_side
            new_w, new_h = int(w * scale), int(h * scale)
            img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

        results = ocr.ocr(img_bgr)
        texts = []
        if results and len(results) > 0:
            result_dict = results[0]
            if isinstance(result_dict, dict):
                rec_texts = result_dict.get('rec_texts', [])
                rec_scores = result_dict.get('rec_scores', [])
                
                # 용량/브랜드 키워드
                brand_keywords = ['백설', '청정원', '오뚜기', '대상', '샘표', '사조', '동원', '풀무원', '해찬들', 'CJ']
                
                for text, score in zip(rec_texts, rec_scores):
                    if score >= 0.5:
                        # 용량 정보 (숫자 포함)
                        if any(c.isdigit() for c in text):
                            # ml, l, g, kg 등 단위가 있거나 숫자만 있는 경우
                            if any(unit in text.lower() for unit in ['ml', 'l', 'g', 'kg', '개', '입']) or text.replace('.', '').isdigit():
                                texts.append(text)
                        # 브랜드 키워드
                        elif any(brand in text for brand in brand_keywords):
                            texts.append(text)
                            
        result = " ".join(texts) if texts else None
        print(f"[OCR DEBUG] filtered_text='{result}'")
        return result
    except Exception as e:
        print(f"[OCR ERROR] {e}")
        return None


def extract_size_from_ocr(text: str):
    if not text:
        return None

    t = normalize(text)

    m = re.search(r'(\d+(?:\.\d+)?)(ml|l|g|kg)', t)
    if m:
        return m.group(1) + m.group(2)

    nums = re.findall(r'\d{2,4}', t)
    if not nums:
        return None

    candidates = []
    for s in nums:
        try:
            v = int(s)
            if 80 <= v <= 3000:
                candidates.append(v)
        except:
            pass

    if not candidates:
        return None

    preferred = {300, 350, 400, 450, 500, 550, 700, 750, 800, 900, 930, 950, 1000, 1200, 1500, 1800, 2000}
    scored = []
    for v in candidates:
        score = 0
        if v in preferred:
            score += 3
        if v >= 300:
            score += 1
        scored.append((score, v))

    scored.sort(reverse=True)
    return f"{scored[0][1]}ml"


# Main Inference
def analyze_image(image_bytes: bytes, db):
    t0 = time.perf_counter()

    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("이미지 디코딩 실패")

    # 1) YOLO (imgsz=416) -> bbox 후보
    t_yolo = time.perf_counter()
    results = yolo_model.predict(
        img,
        imgsz=YOLO_IMGSZ,
        conf=YOLO_CONF,
        iou=YOLO_IOU,
        verbose=False
    )[0]
    t_yolo = time.perf_counter() - t_yolo

    boxes = results.boxes
    if boxes is None or len(boxes) == 0:
        return {"num_detections": 0, "detections": []}

    # conf 가장 높은 bbox 선택
    best_idx = int(torch.argmax(boxes.conf).item())
    box = boxes[best_idx]

    x1, y1, x2, y2 = map(int, box.xyxy[0])
    crop = safe_crop(img, x1, y1, x2, y2)
    if crop is None or crop.size == 0:
        return {"num_detections": 0, "detections": []}

    # 3) MobileNet 분류
    t_cls = time.perf_counter()
    cls_id, cls_conf = classify_with_mobilenet(crop)
    t_cls = time.perf_counter() - t_cls

    # 4) OCR: 신뢰도가 낮으면 실행
    t_ocr = 0.0
    ocr_text = None
    ocr_run = "skip" if cls_conf >= OCR_SKIP_CONF else "run"
    
    if cls_conf < OCR_SKIP_CONF:
        t_ocr = time.perf_counter()
        ocr_text = run_ocr(crop)
        t_ocr = time.perf_counter() - t_ocr

    # 5) DB 매핑 (cls_id 기준)
    product = None
    attrs = {}

    try:
        mapping = (
            db.query(AIProductMapping)
            .filter(AIProductMapping.class_id == cls_id)
            .first()
        )

        if mapping:
            product = (
                db.query(Product)
                .filter(Product.product_id == mapping.product_id)
                .first()
            )

            if product:
                rows = (
                    db.query(ProductAttributeValue)
                    .filter(ProductAttributeValue.product_id == product.product_id)
                    .all()
                )
                for r in rows:
                    attrs[r.attribute_id] = r.value

    except SQLAlchemyError as e:
        print("[DB ERROR]", e)

    if not product:
        # 디버그/운영 안정성을 위해 cls_id는 로그로 남김
        print(f"[NO MAPPING] cls_id={cls_id}, cls_conf={cls_conf:.4f}, ocr={'Y' if ocr_text else 'N'}")
        return {"num_detections": 0, "detections": []}

    # 성능 로깅
    total = time.perf_counter() - t0
    print(f"[PERF] yolo={t_yolo:.3f}s cls={t_cls:.3f}s ocr={t_ocr:.3f}s total={total:.3f}s")
    print(f"[AI] yolo_imgsz={YOLO_IMGSZ} cls_id={cls_id} cls_conf={cls_conf:.3f} ocr={ocr_run} ocr_text='{ocr_text}' elapsed={total:.3f}s")

    # 6) DB 기준 값
    FLAVOR_ATTR_ID = 1
    SIZE_ATTR_IDS = [2, 3, 4]

    db_flavor = attrs.get(FLAVOR_ATTR_ID)
    db_size = None
    for sid in SIZE_ATTR_IDS:
        if sid in attrs and attrs[sid]:
            db_size = attrs[sid]
            break

    db_brand = product.brand.name if getattr(product, "brand", None) else None

    # 7) OCR 기반 값(보조)
    ocr_size = extract_size_from_ocr(ocr_text)

    final_size = ocr_size or db_size
    final_conf = cls_conf

    if ocr_size and db_size and (normalize(ocr_size) not in normalize(db_size)):
        final_conf *= 0.3

    # 8) 로그
    try:
        db.add(
            RecognitionLog(
                product_id=product.product_id,
                confidence=final_conf,
            )
        )
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        print("[LOG ERROR]", e)

    # 디버그(필요 시)
    t1 = time.perf_counter()
    print(
        f"[AI] yolo_imgsz={YOLO_IMGSZ} cls_id={cls_id} cls_conf={cls_conf:.3f} "
        f"ocr={'skip' if cls_conf > OCR_SKIP_CONF else 'run'} "
        f"ocr_text='{ocr_text}' "
        f"elapsed={(t1 - t0):.3f}s"
    )

    # 상품명 + 맛 합치기
    display_name = (
        f"{product.name} {db_flavor}"
        if db_flavor
        else product.name
    )

    return {
        "result": {
            "product_id": product.product_id,
            "image_url": f"/static/products/{product.product_id}.jpg",
            "name": display_name,      # 상품명 + 맛
            "brand": db_brand,         # 브랜드
            "size": final_size,        # 용량
            "price": product.price,    # 가격
            "confidence": round(final_conf, 4),
        }
    }
