import os
import sys
import tarfile
import urllib.request
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# 한국어용: det은 범용 ch PP-OCRv4, rec은 korean PP-OCRv3
MODELS = [
    {
        "name": "ch_PP-OCRv4_det_infer",
        "url": "https://paddleocr.bj.bcebos.com/PP-OCRv4/chinese/ch_PP-OCRv4_det_infer.tar",
    },
    {
        "name": "korean_PP-OCRv3_rec_infer",
        "url": "https://paddleocr.bj.bcebos.com/PP-OCRv3/rec/korean_PP-OCRv3_rec_infer.tar",
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


def convert_to_onnx(model_dir: Path):
    pdmodel = model_dir / "inference.pdmodel"
    pdparams = model_dir / "inference.pdiparams"
    onnx_path = model_dir / "inference.onnx"
    if onnx_path.exists():
        print(f"[SKIP] ONNX already exists: {onnx_path}")
        return

    cmd = [
        sys.executable,
        "-m",
        "paddle2onnx.convert",
        "--model_dir",
        str(model_dir),
        "--model_filename",
        "inference.pdmodel",
        "--params_filename",
        "inference.pdiparams",
        "--save_file",
        str(onnx_path),
        "--opset_version",
        "16",
        "--enable_onnx_checker",
        "True",
    ]
    print(f"[CONVERT] {' '.join(cmd)}")
    subprocess.check_call(cmd)
    print(f"[DONE] {onnx_path}")


def main():
    for m in MODELS:
        url = m["url"]
        name = m["name"]
        download_and_extract(url, ROOT)
        convert_to_onnx(ROOT / name)


if __name__ == "__main__":
    main()
