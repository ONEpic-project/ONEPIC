import os
import random
import shutil

SRC_ROOT = r"C:\Users\junseo\Desktop\vscode\onepic\ONEPIC\image_x5"
DST_ROOT = r"C:\Users\junseo\Desktop\vscode\onepic\ONEPIC\dataset"

IMG_EXT = (".jpg", ".png", ".jpeg")

# 출력 폴더 생성
for s in ["train", "val", "test"]:
    os.makedirs(os.path.join(DST_ROOT, "images", s), exist_ok=True)
    os.makedirs(os.path.join(DST_ROOT, "labels", s), exist_ok=True)

# image_x5 전체를 재귀 탐색
all_pairs = []

for root, dirs, files in os.walk(SRC_ROOT):
    images = [f for f in files if f.lower().endswith(IMG_EXT)]
    for img in images:
        base = img.rsplit(".", 1)[0]
        txt = base + ".txt"

        img_path = os.path.join(root, img)
        txt_path = os.path.join(root, txt)

        if os.path.exists(txt_path):
            all_pairs.append((img_path, txt_path))

print(f"총 이미지 수: {len(all_pairs)}")

# 섞고 7:2:1 분리
random.shuffle(all_pairs)

n = len(all_pairs)
train_end = int(n * 0.7)
val_end = int(n * 0.9)

splits = {
    "train": all_pairs[:train_end],
    "val": all_pairs[train_end:val_end],
    "test": all_pairs[val_end:]
}

# 복사 (파일명 충돌 방지용 prefix 추가)
for split, pairs in splits.items():
    for idx, (img_path, txt_path) in enumerate(pairs):
        fname = f"{split}_{idx}"

        img_ext = os.path.splitext(img_path)[1]
        shutil.copy(img_path,
                    os.path.join(DST_ROOT, "images", split, fname + img_ext))
        shutil.copy(txt_path,
                    os.path.join(DST_ROOT, "labels", split, fname + ".txt"))

print("✅ 모든 하위 폴더 포함 7:2:1 분리 완료")
