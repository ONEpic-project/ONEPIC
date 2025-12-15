import torch
import numpy as np
import cv2
import os
import base64
from io import BytesIO
from PIL import Image


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_files", "best.pt")


# YOLOv5 모델 로드 (GitHub repo 기반)
model = torch.hub.load(
    'ultralytics/yolov5',  # 깃허브 repo
    'custom',              # custom 모델 불러오기
    path=MODEL_PATH,       # best.pt 경로
    # source='local'         # 로컬 weight 사용
)

def image_to_base64(img):
    """OpenCV 이미지 → base64 문자열"""
    success, encoded_image = cv2.imencode(".jpg", img)
    if not success:
        raise ValueError("이미지 인코딩 실패!")
    return base64.b64encode(encoded_image.tobytes()).decode("utf-8")


def analyze_image(image_bytes: bytes):
    # bytes → numpy → opencv image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 원본 이미지 복사 (bbox 그릴 버전)
    img_draw = img.copy()

    # YOLO 추론
    results = model(img)

    detections = []

    for *xyxy, conf, cls in results.xyxy[0].tolist():
        x1, y1, x2, y2 = map(int, xyxy)
        confidence = float(conf)
        class_id = int(cls)

        # bbox 정보 저장
        detections.append({
            "class_id": class_id,
            "confidence": confidence,
            "bbox": {
                "x1": x1, "y1": y1,
                "x2": x2, "y2": y2
            }
        })

        # -----------------------------
        #   🔥 이미지 위에 bbox 그리기
        # -----------------------------
        cv2.rectangle(img_draw, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(
            img_draw,
            f"ID:{class_id} {confidence:.2f}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

    # 결과 이미지를 base64로 변환
    img_base64 = image_to_base64(img_draw)

    return {
        "num_detections": len(detections),
        "detections": detections,
        "image_base64": img_base64
    }