import cv2
import os
from ultralytics import YOLO
import easyocr

# ==============================
# 경로 설정
# ==============================
MODEL_PATH = r"C:/Users/junse/Desktop/vscode/team-project/ONEPIC/runs/detect/train3/weights/best.pt"
VAL_IMG_DIR = r"C:/Users/junse/Desktop/vscode/team-project/ONEPIC/dataset/images/val"
OUTPUT_DIR = r"C:/Users/junse/Desktop/vscode/team-project/ONEPIC/runs/val_ocr_results"
CLASSES_PATH = r"C:/Users/junse/Desktop/vscode/team-project/ONEPIC/classes.txt"

CONF_THRES = 0.4

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==============================
# 클래스 이름 로드
# ==============================
with open(CLASSES_PATH, "r", encoding="utf-8") as f:
    CLASS_NAMES = [line.strip() for line in f.readlines()]

# ==============================
# 모델 & OCR
# ==============================
model = YOLO(MODEL_PATH)
reader = easyocr.Reader(['en', 'ko'], gpu=False)

print("✅ VAL 이미지 테스트 시작")

# ==============================
# VAL 이미지 반복
# ==============================
for img_name in os.listdir(VAL_IMG_DIR):
    if not img_name.lower().endswith((".jpg", ".png", ".jpeg")):
        continue

    img_path = os.path.join(VAL_IMG_DIR, img_name)
    image = cv2.imread(img_path)

    if image is None:
        continue

    results = model(image, conf=CONF_THRES, verbose=False)

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])

            class_name = (
                CLASS_NAMES[cls_id]
                if cls_id < len(CLASS_NAMES)
                else f"class_{cls_id}"
            )

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # 박스
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                image,
                f"{class_name} {conf:.2f}",
                (x1, y1 - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

            # ==============================
            # OCR
            # ==============================
            crop = image[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

            ocr_results = reader.readtext(gray)

            for (_, text, ocr_conf) in ocr_results:
                if ocr_conf < 0.4:
                    continue

                cv2.putText(
                    image,
                    text,
                    (x1, y2 + 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 255),
                    2
                )

    save_path = os.path.join(OUTPUT_DIR, img_name)
    cv2.imwrite(save_path, image)
    print(f"📸 저장 완료: {img_name}")

print("🎉 VAL 테스트 종료")
