from ultralytics import YOLO

def main():
    model = YOLO("yolov8n.pt")

    model.train(
        data=r"C:/Users/junseo/Desktop/vscode/onepic/ONEPIC/dataset/dataset.yaml",
        imgsz=640,
        epochs=100,
        batch=4,
        device=0,
        workers=0   # ← Windows 안정화 핵심
    )

if __name__ == "__main__":
    main()
