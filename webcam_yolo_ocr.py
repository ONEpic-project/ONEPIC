import cv2
import yaml
import re
from ultralytics import YOLO
import easyocr

# =========================
# 경로 설정 (네 경로 확인!!)
# =========================
MODEL_PATH = r"C:\Users\junse\Desktop\vscode\team-project\ONEPIC\runs\detect\train3\weights\best.pt"
DATASET_YAML = r"C:\Users\junse\Desktop\vscode\team-project\ONEPIC\dataset\dataset.yaml"

CONF_THRES = 0.4
OCR_CONF_THRES = 0.3

# =========================
# YOLO 모델 로드
# =========================
print("✅ YOLO 모델 로딩 중...")
model = YOLO(MODEL_PATH)

# =========================
# 클래스 이름 로드
# =========================
with open(DATASET_YAML, "r", encoding="utf-8") as f:
    data = yaml.safe_load(f)
    CLASS_NAMES = data["names"]

# =========================
# OCR 로드
# =========================
print("✅ OCR 모델 로딩 중...")
reader = easyocr.Reader(['ko', 'en'], gpu=False)

# =========================
# 텍스트 정규화
# =========================
def normalize(text):
    return re.sub(r'[^a-z0-9가-힣]', '', text.lower())

# =========================
# OCR 자동 매칭 (하드코딩 ❌)
# =========================
def auto_match(class_name, ocr_texts):
    cls_norm = normalize(class_name)
    for t in ocr_texts:
        t_norm = normalize(t)
        if t_norm and (t_norm in cls_norm or cls_norm in t_norm):
            return True
    return False

# =========================
# OCR 전처리
# =========================
def preprocess_for_ocr(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary = cv2.threshold(
        gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    return binary

# =========================
# 웹캠 시작
# =========================
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ 웹캠 열기 실패")
    exit()

print("🎥 웹캠 실행 중 (종료: Q 키)")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, conf=CONF_THRES, verbose=False)
    vis = frame.copy()

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = CLASS_NAMES[cls_id]
            conf = float(box.conf[0])

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # =========================
            # Crop
            # =========================
            pad = 8
            h, w, _ = frame.shape
            cx1 = max(0, x1 - pad)
            cy1 = max(0, y1 - pad)
            cx2 = min(w, x2 + pad)
            cy2 = min(h, y2 + pad)

            crop = frame[cy1:cy2, cx1:cx2]

            # =========================
            # OCR
            # =========================
            ocr_texts = []

            if crop.size > 0:
                ocr_input = preprocess_for_ocr(crop)
                ocr_results = reader.readtext(ocr_input)

                for _, text, ocr_conf in ocr_results:
                    if ocr_conf > OCR_CONF_THRES:
                        ocr_texts.append(text)

            matched = auto_match(cls_name, ocr_texts)

            # =========================
            # 시각화
            # =========================
            color = (0, 255, 0) if matched else (0, 165, 255)

            cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)

            label = f"{cls_name} ({conf:.2f})"
            cv2.putText(vis, label, (x1, y1 - 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            if ocr_texts:
                ocr_label = "OCR: " + ", ".join(ocr_texts[:3])
            else:
                ocr_label = "OCR: N/A"

            cv2.putText(vis, ocr_label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    cv2.imshow("ONEPIC | YOLO + OCR (STABLE)", vis)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
