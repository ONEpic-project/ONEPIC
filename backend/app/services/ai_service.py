# ai 추론 + DB 기록 처리 + 결과 반환 담당

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


# ======================================================
# Path / Device
# ======================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model_files")

YOLO_MODEL_PATH = os.path.join(MODEL_DIR, "best.pt")
CLS_MODEL_PATH = os.path.join(MODEL_DIR, "mobilenetv3_best.pt")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ======================================================
# YOLO (Detection)
# ======================================================
YOLO_IMGSZ = 352
YOLO_CONF = 0.20
YOLO_IOU = 0.50

yolo_model = YOLO(YOLO_MODEL_PATH)


# ======================================================
# MobileNet (Classification)
# ======================================================
NUM_CLASSES = 34
OCR_SKIP_CONF = 0.90


def _load_state_dict_any(path: str, device: str):
    ckpt = torch.load(path, map_location=device)
    if isinstance(ckpt, dict) and "model_state" in ckpt:
        return ckpt["model_state"], int(ckpt.get("img_size", 224)), ckpt.get("arch")
    return ckpt, 224, None


def _infer_backbone(state_dict: dict):
    w = state_dict.get("classifier.0.weight")
    if w is None:
        return "small"
    if w.shape == (1280, 960):
        return "large"
    if w.shape == (1024, 576):
        return "small"
    return "small"


state_dict, IMG_SIZE, arch_hint = _load_state_dict_any(CLS_MODEL_PATH, DEVICE)
backbone = arch_hint or _infer_backbone(state_dict)

cls_model = (
    mobilenet_v3_large(weights=None)
    if backbone == "large"
    else mobilenet_v3_small(weights=None)
)

cls_model.classifier[3] = nn.Linear(
    cls_model.classifier[3].in_features,
    NUM_CLASSES
)

cls_model.load_state_dict(state_dict, strict=True)
cls_model.to(DEVICE)
cls_model.eval()

# Warm-up
with torch.no_grad():
    cls_model(torch.zeros(1, 3, IMG_SIZE, IMG_SIZE).to(DEVICE))


# ======================================================
# OCR
# ======================================================
OCR_DEVICE = "gpu" if torch.cuda.is_available() else "cpu"

ocr = PaddleOCR(
    use_angle_cls=True,
    lang="korean",
    device=OCR_DEVICE,
    det_limit_side_len=224,
    rec_batch_num=1,
)


# ======================================================
# Utils
# ======================================================
def normalize(text: str) -> str:
    return text.lower().replace(" ", "") if text else ""


def safe_crop(img, x1, y1, x2, y2):
    h, w = img.shape[:2]
    x1, x2 = max(0, x1), min(w, x2)
    y1, y2 = max(0, y1), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return None
    return img[y1:y2, x1:x2]


def preprocess_bgr(img):
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) / 255.0
    img = np.transpose(img, (2, 0, 1))
    return torch.from_numpy(img).float().unsqueeze(0).to(DEVICE)


def classify(img):
    x = preprocess_bgr(img)
    with torch.no_grad():
        probs = F.softmax(cls_model(x), dim=1)
        cls_id = int(torch.argmax(probs))
        cls_conf = float(probs[0, cls_id])
    return cls_id, cls_conf


def run_ocr(img):
    try:
        result = ocr.ocr(img)
        if not result:
            return None
        texts = []
        for t, s in zip(result[0]["rec_texts"], result[0]["rec_scores"]):
            if s >= 0.5:
                texts.append(t)
        return " ".join(texts) if texts else None
    except Exception:
        return None


def extract_size(text):
    if not text:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)(ml|l|g|kg)", normalize(text))
    return m.group(0) if m else None


# ======================================================
# Main Inference
# ======================================================
def analyze_image(image_bytes: bytes, db):
    FAIL = {
        "product_id": None,
        "product_name": None,
        "brand_name": None,
        "image_url": None,
        "size": None,
        "price": None,
        "confidence": 0,
        "ocr_text": None,
    }

    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return FAIL

    results = yolo_model.predict(
        img, imgsz=YOLO_IMGSZ, conf=YOLO_CONF, iou=YOLO_IOU, verbose=False
    )[0]

    boxes = results.boxes
    if boxes is None or len(boxes) == 0:
        return FAIL

    box = boxes[int(torch.argmax(boxes.conf))]

    crop = safe_crop(img, *map(int, box.xyxy[0]))
    if crop is None:
        return FAIL

    cls_id, cls_conf = classify(crop)
    ocr_text = None

    if cls_conf < OCR_SKIP_CONF:
        ocr_text = run_ocr(crop)

    try:
        mapping = (
            db.query(AIProductMapping)
            .filter(AIProductMapping.class_id == cls_id)
            .first()
        )
        if not mapping:
            return FAIL

        product = (
            db.query(Product)
            .filter(Product.product_id == mapping.product_id)
            .first()
        )
        if not product:
            return FAIL
        
        # 맛(flavor) 조회
        FLAVOR_ATTR_ID = 1  # 맛 attribute_id
        flavor = None

        try:
            flavor_row = (
                db.query(ProductAttributeValue)
                .filter(
                    ProductAttributeValue.product_id == product.product_id,
                    ProductAttributeValue.attribute_id == FLAVOR_ATTR_ID,
                )
                .first()
            )
            if flavor_row:
                flavor = flavor_row.value
        except SQLAlchemyError:
            pass

    except SQLAlchemyError:
        return FAIL

    size = extract_size(ocr_text)
    display_name = f"{product.name} {flavor}" if flavor else product.name


    try:
        db.add(
            RecognitionLog(
                product_id=product.product_id,
                confidence=cls_conf,
            )
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()

    return {
        "product_id": product.product_id,
        "product_name": display_name,
        "brand_name": product.brand.name if product.brand else None,
        "image_url": f"/static/products/{product.product_id}.jpg",
        "size": size,
        "price": product.price,
        "confidence": round(cls_conf, 4),
        "ocr_text": ocr_text,
    }
