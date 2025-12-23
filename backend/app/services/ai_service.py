import os
import cv2
import re
import time
import numpy as np
import torch
import easyocr

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
YOLO_IMGSZ = 416
YOLO_CONF = 0.20
YOLO_IOU = 0.50

yolo_model = YOLO(YOLO_MODEL_PATH)


# MobileNet (Classification)
NUM_CLASSES = 34
OCR_SKIP_CONF = 0.85

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


# OCR
OCR_GPU = False
reader = easyocr.Reader(["ko", "en"], gpu=OCR_GPU)


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
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    results = reader.readtext(rgb)
    texts = [t for (_, t, conf) in results if conf >= 0.5]
    return " ".join(texts) if texts else None


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
    results = yolo_model.predict(
        img,
        imgsz=YOLO_IMGSZ,
        conf=YOLO_CONF,
        iou=YOLO_IOU,
        verbose=False
    )[0]

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
    cls_id, cls_conf = classify_with_mobilenet(crop)

    # 4) OCR 조건부
    ocr_text = None
    if cls_conf <= OCR_SKIP_CONF:
        ocr_text = run_ocr(crop)

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
        f"elapsed={(t1 - t0):.3f}s"
    )

    return {
        "num_detections": 1,
        "detections": [
            {
                "product_id": product.product_id,
                "product_name": product.name,
                "brand_name": db_brand,
                "price": product.price,
                "flavor": db_flavor,
                "size": final_size,
                "confidence": round(final_conf, 4),
                "ocr_text": ocr_text,
            }
        ],
    }
