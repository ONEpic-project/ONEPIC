import os
import tarfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# PP-OCRv3 모바일 det (빠름)
MODELS = [
    {
        "name": "ch_PP-OCRv3_det_infer",
        "url": "https://paddleocr.bj.bcebos.com/PP-OCRv3/chinese/ch_PP-OCRv3_det_infer.tar",
    },
]


def download_and_extract(url: str, target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)
    tar_path = target_dir / Path(url).name
    if not tar_path.exists():
        print(f"[DOWNLOAD] {url}")
        urllib.request.urlretrieve(url, tar_path)
    else:
        print(f"[SKIP] already exists: {tar_path}")

    print(f"[EXTRACT] {tar_path}")
    with tarfile.open(tar_path, "r") as tar:
        tar.extractall(path=target_dir)
    print(f"[DONE] {tar_path.stem}")


def main():
    for m in MODELS:
        url = m["url"]
        download_and_extract(url, ROOT)


if __name__ == "__main__":
    main()
