from ultralytics import YOLO
import cv2
import os
import easyocr

# =====================================================
# 경로 설정
# =====================================================
BASE = r"C:/Users/junseo/Desktop/vscode/onepic/ONEPIC"

TEST_IMG_DIR = os.path.join(BASE, "dataset", "images", "test")
CROP_DIR = os.path.join(BASE, "dataset", "crops_from_test")
VIS_DIR = os.path.join(BASE, "dataset", "visualized_test")
CLASS_FILE = os.path.join(BASE, "classes.txt")

os.makedirs(CROP_DIR, exist_ok=True)
os.makedirs(VIS_DIR, exist_ok=True)

# =====================================================
# 클래스 이름 로드 (class_id → 실제 이름)
# =====================================================
with open(CLASS_FILE, "r", encoding="utf-8") as f:
    CLASS_NAMES = [line.strip() for line in f if line.strip()]

# =====================================================
# best.pt 자동 탐색
# =====================================================
MODEL_PATH = None
for root, dirs, files in os.walk(os.path.join(BASE, "runs", "detect")):
    if "best.pt" in files:
        MODEL_PATH = os.path.join(root, "best.pt")
        break

if MODEL_PATH is None:
    raise FileNotFoundError("best.pt 못 찾음")

print("✅ 사용 모델:", MODEL_PATH)

# =====================================================
# YOLO / OCR 로드
# =====================================================
model = YOLO(MODEL_PATH)
reader = easyocr.Reader(['en', 'ko'])

# =====================================================
# 테스트 이미지 추론
# =====================================================
for img_name in os.listdir(TEST_IMG_DIR):
    if not img_name.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    img_path = os.path.join(TEST_IMG_DIR, img_name)
    image = cv2.imread(img_path)
    if image is None:
        continue

    vis_img = image.copy()
    results = model(image)[0]

    print(f"\n📸 {img_name}")

    if results.boxes is None or len(results.boxes) == 0:
        cv2.imwrite(os.path.join(VIS_DIR, img_name), vis_img)
        continue

    for i, box in enumerate(results.boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        class_id = int(box.cls[0])
        conf = float(box.conf[0])

        class_name = (
            CLASS_NAMES[class_id]
            if class_id < len(CLASS_NAMES)
            else f"Unknown({class_id})"
        )

        # ---------------- crop ----------------
        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        cv2.imwrite(
            os.path.join(CROP_DIR, f"{os.path.splitext(img_name)[0]}_{i}.jpg"),
            crop
        )

        # ---------------- OCR ----------------
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        texts = reader.readtext(gray)
        ocr_text = " / ".join([t[1] for t in texts]) if texts else "OCR 없음"

        print(f"  ▶ {class_name} ({conf:.2f})")
        print(f"     OCR: {ocr_text}")

        # ---------------- 시각화 ----------------
        # 박스
        cv2.rectangle(vis_img, (x1, y1), (x2, y2), (0, 255, 0), 3)

        # 텍스트 배경
        label = f"{class_name} ({conf:.2f})"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)

        tx, ty = x1 + 5, y1 + 25
        cv2.rectangle(
            vis_img,
            (tx - 5, ty - th - 5),
            (tx + tw + 5, ty + 5),
            (0, 0, 0),
            -1
        )

        # 클래스 이름 (확실히 보이게 흰색)
        cv2.putText(
            vis_img,
            label,
            (tx, ty),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2
        )

        # OCR 텍스트
        ocr_y = min(y2 + 30, vis_img.shape[0] - 10)
        cv2.rectangle(
            vis_img,
            (x1, ocr_y - 20),
            (x1 + 400, ocr_y + 5),
            (0, 0, 0),
            -1
        )
        cv2.putText(
            vis_img,
            ocr_text[:40],
            (x1 + 5, ocr_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 255),
            2
        )

    cv2.imwrite(os.path.join(VIS_DIR, img_name), vis_img)

print("\n✅ YOLO + 클래스명 + OCR 시각화 테스트 완료")
print("📂 결과:", VIS_DIR)
