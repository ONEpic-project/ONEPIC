import os

LABEL_ROOT = r"C:\Users\junseo\Desktop\vscode\onepic\ONEPIC\dataset\labels"

class_ids = set()
line_count = 0

for split in ["train", "val", "test"]:
    split_path = os.path.join(LABEL_ROOT, split)
    if not os.path.exists(split_path):
        continue

    for file in os.listdir(split_path):
        if not file.endswith(".txt"):
            continue

        with open(os.path.join(split_path, file), "r", encoding="utf-8") as f:
            for line in f:
                if line.strip() == "":
                    continue
                cid = int(line.split()[0])
                class_ids.add(cid)
                line_count += 1

print("총 라벨 줄 수:", line_count)
print("사용된 class id 목록:", sorted(class_ids))
print("class id 범위:", min(class_ids), "~", max(class_ids))
print("총 클래스 개수:", len(class_ids))
