# AI 추론 + DB 매핑 + 결과 생성

import torch
import torch.nn as nn
import numpy as np
import cv2
import os
import base64
import easyocr
import timm

from ultralytics import YOLO
from PIL import Image

from app.models.product import Product
from app.models.recognition_log import RecognitionLog
from app.models.ai_product_mapping import AIProductMapping

# 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model_files")

YOLO_MODEL_PATH = os.path.join(MODEL_DIR, "best.pt")
CLS_MODEL_PATH = os.path.join(MODEL_DIR, "yolo+effi.pt")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# yolov8n 모델 로딩(탐지)
yolo_model = YOLO(YOLO_MODEL_PATH)

# EfficientNet 로딩 (분류)
class EfficientNetClassifier(nn.Module):
    def __init__(self, num_classes=35):
        super().__init__()
        self.model = timm.create_model(
            "efficientnet_lite0",
            pretrained=False,
            num_classes=num_classes
        )

    def forward(self, x):
        return self.model(x)


cls_model = EfficientNetClassifier(num_classes=35)

# checkpoint 로딩
ckpt = torch.load(CLS_MODEL_PATH, map_location=DEVICE)
raw_state_dict = ckpt["model"]

# prefix 맞추기
state_dict = {f"model.{k}": v for k, v in raw_state_dict.items()}
cls_model.load_state_dict(state_dict)

cls_model.to(DEVICE)
cls_model.eval()


# OCR 로딩(보조)
reader = easyocr.Reader(['ko', 'en'], gpu=False)



# 유틸 함수
def image_to_base64(img):
    success, encoded_image = cv2.imencode(".jpg", img)
    if not success:
        raise ValueError("이미지 인코딩 실패")
    return base64.b64encode(encoded_image.tobytes()).decode("utf-8")


def preprocess_crop(img):
    img = cv2.resize(img, (224, 224))
    img = img[:, :, ::-1]          # BGR → RGB
    img = img / 255.0
    img = np.transpose(img, (2, 0, 1))
    img = torch.tensor(img, dtype=torch.float32).unsqueeze(0)
    return img.to(DEVICE)


def run_ocr(crop_img):
    results = reader.readtext(crop_img)
    texts = [text for (_, text, conf) in results if conf > 0.5]
    return " ".join(texts)

# 메인 분석 함수
def analyze_image(image_bytes: bytes, db):
    # bytes → OpenCV 이미지
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("이미지 디코딩 실패")

    img_draw = img.copy()
    detections = []

    # YOLO 추론
    results = yolo_model(img)[0]

    if results.boxes is None:
        return {
            "num_detections": 0,
            "detections": [],
            "image_base64": image_to_base64(img_draw)
        }

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        yolo_conf = float(box.conf[0])

        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        # 1. EfficientNet 분류 (메인)
        input_tensor = preprocess_crop(crop)
        with torch.no_grad():
            outputs = cls_model(input_tensor)
            cls_id = torch.argmax(outputs, dim=1).item()
            cls_conf = torch.softmax(outputs, dim=1)[0][cls_id].item()

        # 2. OCR (보조)
        ocr_text = run_ocr(crop)

        # DB 매핑
        mapping = db.query(AIProductMapping)\
            .filter(
                AIProductMapping.class_id == cls_id,
                AIProductMapping.is_active == 1
            )\
            .first()

        product = None
        product_id = None

        if mapping:
            product_id = mapping.product_id
            product = db.query(Product)\
                .filter(Product.product_id == product_id)\
                .first()


        # 결과 저장
        brand_name = None
        if product and product.brand:
            brand_name = product.brand.name

        detections.append({
            "class_id": cls_id,
            "product_id": product.product_id if product else None,
            "product_name": product.name if product else None,
            "brand_name": brand_name,          # ⭐️ 추가
            "price": product.price if product else None,
            "yolo_confidence": round(yolo_conf, 4),
            "class_confidence": round(cls_conf, 4),
            "ocr_text": ocr_text,
            "bbox": {
                "x1": x1, "y1": y1,
                "x2": x2, "y2": y2
            }
        })


        # 시각화
        label = f"{cls_id} | Y:{yolo_conf:.2f} C:{cls_conf:.2f}"
        if ocr_text:
            label += f" | {ocr_text[:15]}"

        cv2.rectangle(img_draw, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            img_draw,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

        # 로그 저장
        if product_id:
            log = RecognitionLog(
                product_id=product_id,
                confidence=cls_conf
            )
            db.add(log)

    db.commit()

    return {
        "num_detections": len(detections),
        "detections": detections,
        "image_base64": image_to_base64(img_draw)
    }