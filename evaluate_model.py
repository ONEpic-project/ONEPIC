"""
모델 성능 평가 스크립트
- YOLO, EfficientNet 개별 성능 측정
- 백엔드 코드와 독립적으로 동작
"""

import torch
import torch.nn as nn
import numpy as np
import cv2
import os
import json
import time
from pathlib import Path
from collections import defaultdict
from ultralytics import YOLO
import timm

# ======================== 설정 ========================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"사용 디바이스: {DEVICE}")

# 모델 경로
YOLO_MODEL_PATH = "best.pt"
EFFICIENTNET_MODEL_PATH = "efficientnet_snack.pt"
CLASSES_FILE = "classes_order.txt"

# 테스트 데이터 경로
TEST_IMAGES_DIR = "test_images"
LABELS_FILE = "test_images/labels.json"  # 선택사항

# 결과 저장 경로
RESULTS_DIR = "evaluation_results"
os.makedirs(RESULTS_DIR, exist_ok=True)


# ======================== 클래스 로드 ========================
def load_classes():
    """classes_order.txt에서 클래스 이름 로드"""
    if not os.path.exists(CLASSES_FILE):
        print(f"[경고] {CLASSES_FILE} 파일이 없습니다. 인덱스만 사용합니다.")
        return {}
    
    with open(CLASSES_FILE, 'r', encoding='utf-8') as f:
        classes = [line.strip() for line in f if line.strip()]
    
    return {i: name for i, name in enumerate(classes)}


# ======================== EfficientNet 정의 ========================
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


# ======================== 모델 로드 ========================
def load_yolo_model():
    """YOLO 모델 로드"""
    if not os.path.exists(YOLO_MODEL_PATH):
        raise FileNotFoundError(f"YOLO 모델을 찾을 수 없습니다: {YOLO_MODEL_PATH}")
    
    model = YOLO(YOLO_MODEL_PATH)
    print(f"✅ YOLO 모델 로드 완료: {YOLO_MODEL_PATH}")
    return model


def load_efficientnet_model():
    """EfficientNet 모델 로드"""
    if not os.path.exists(EFFICIENTNET_MODEL_PATH):
        print(f"[경고] EfficientNet 모델을 찾을 수 없습니다: {EFFICIENTNET_MODEL_PATH}")
        return None
    
    # 클래스 개수 확인
    classes = load_classes()
    num_classes = len(classes) if classes else 35
    
    model = EfficientNetClassifier(num_classes=num_classes)
    
    # 체크포인트 로드
    ckpt = torch.load(EFFICIENTNET_MODEL_PATH, map_location=DEVICE)
    
    # state_dict 처리 (여러 형식 지원)
    if 'model' in ckpt:
        raw_state_dict = ckpt['model']
        state_dict = {f"model.{k}": v for k, v in raw_state_dict.items()}
    else:
        state_dict = ckpt
    
    model.load_state_dict(state_dict, strict=False)
    model.to(DEVICE)
    model.eval()
    
    print(f"✅ EfficientNet 모델 로드 완료: {EFFICIENTNET_MODEL_PATH}")
    return model


# ======================== 전처리 ========================
def preprocess_for_efficientnet(img):
    """EfficientNet용 전처리"""
    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img / 255.0
    img = np.transpose(img, (2, 0, 1))
    img = torch.tensor(img, dtype=torch.float32).unsqueeze(0)
    return img.to(DEVICE)


# ======================== 평가 함수 ========================
def evaluate_yolo(model, test_images, labels_dict=None):
    """YOLO 모델 평가"""
    results = {
        'total': 0,
        'detected': 0,
        'correct': 0,
        'inference_times': [],
        'predictions': []
    }
    
    for img_path in test_images:
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        
        results['total'] += 1
        
        # 추론
        start_time = time.time()
        detections = model(img)[0]
        inference_time = time.time() - start_time
        results['inference_times'].append(inference_time)
        
        # 결과 처리
        if detections.boxes is not None and len(detections.boxes) > 0:
            results['detected'] += 1
            
            # 가장 높은 confidence의 탐지 결과
            box = detections.boxes[0]
            pred_class = int(box.cls[0])
            confidence = float(box.conf[0])
            
            # 정답 확인
            true_label = labels_dict.get(img_path.name) if labels_dict else None
            is_correct = (pred_class == true_label) if true_label is not None else None
            
            if is_correct:
                results['correct'] += 1
            
            results['predictions'].append({
                'image': img_path.name,
                'predicted': pred_class,
                'confidence': confidence,
                'true_label': true_label,
                'correct': is_correct
            })
    
    return results


def evaluate_efficientnet(model, test_images, labels_dict=None):
    """EfficientNet 모델 평가"""
    if model is None:
        return None
    
    results = {
        'total': 0,
        'correct': 0,
        'inference_times': [],
        'predictions': []
    }
    
    for img_path in test_images:
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        
        results['total'] += 1
        
        # 전처리
        input_tensor = preprocess_for_efficientnet(img)
        
        # 추론
        start_time = time.time()
        with torch.no_grad():
            outputs = model(input_tensor)
            pred_class = torch.argmax(outputs, dim=1).item()
            confidence = torch.softmax(outputs, dim=1)[0][pred_class].item()
        inference_time = time.time() - start_time
        results['inference_times'].append(inference_time)
        
        # 정답 확인
        true_label = labels_dict.get(img_path.name) if labels_dict else None
        is_correct = (pred_class == true_label) if true_label is not None else None
        
        if is_correct:
            results['correct'] += 1
        
        results['predictions'].append({
            'image': img_path.name,
            'predicted': pred_class,
            'confidence': confidence,
            'true_label': true_label,
            'correct': is_correct
        })
    
    return results


# ======================== 결과 출력 ========================
def print_results(model_name, results):
    """결과 출력"""
    if results is None:
        print(f"\n❌ {model_name} 평가 불가")
        return
    
    print(f"\n{'='*50}")
    print(f"📊 {model_name} 평가 결과")
    print(f"{'='*50}")
    print(f"총 이미지 수: {results['total']}")
    
    if 'detected' in results:
        print(f"탐지 성공: {results['detected']} ({results['detected']/results['total']*100:.1f}%)")
    
    if results['total'] > 0:
        correct_count = results['correct']
        accuracy = correct_count / results['total'] * 100
        print(f"정확도: {correct_count}/{results['total']} ({accuracy:.2f}%)")
        
        avg_time = np.mean(results['inference_times'])
        print(f"평균 추론 시간: {avg_time*1000:.2f}ms")
        print(f"FPS: {1/avg_time:.2f}")


def save_results(yolo_results, efficientnet_results):
    """결과를 JSON으로 저장"""
    output = {
        'yolo': yolo_results,
        'efficientnet': efficientnet_results,
        'device': DEVICE,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    output_path = os.path.join(RESULTS_DIR, f"evaluation_{int(time.time())}.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 결과 저장: {output_path}")


# ======================== 메인 ========================
def main():
    print("🚀 모델 성능 평가 시작\n")
    
    # 클래스 로드
    classes = load_classes()
    print(f"클래스 수: {len(classes) if classes else '알 수 없음'}\n")
    
    # 테스트 이미지 로드
    test_images = list(Path(TEST_IMAGES_DIR).glob("*.jpg")) + \
                  list(Path(TEST_IMAGES_DIR).glob("*.png")) + \
                  list(Path(TEST_IMAGES_DIR).glob("*.jpeg"))
    
    if not test_images:
        print(f"❌ {TEST_IMAGES_DIR}에 테스트 이미지가 없습니다.")
        print(f"   이미지를 추가하고 다시 실행하세요.")
        return
    
    print(f"테스트 이미지 수: {len(test_images)}\n")
    
    # 라벨 로드 (선택사항)
    labels_dict = {}
    if os.path.exists(LABELS_FILE):
        with open(LABELS_FILE, 'r', encoding='utf-8') as f:
            labels_dict = json.load(f)
        print(f"✅ 라벨 파일 로드: {len(labels_dict)}개\n")
    else:
        print(f"ℹ️  라벨 파일 없음. 추론 결과만 표시됩니다.\n")
    
    # 모델 로드
    yolo_model = load_yolo_model()
    efficientnet_model = load_efficientnet_model()
    
    # 평가
    print("\n" + "="*50)
    print("🔍 YOLO 평가 중...")
    yolo_results = evaluate_yolo(yolo_model, test_images, labels_dict)
    print_results("YOLO", yolo_results)
    
    print("\n" + "="*50)
    print("🔍 EfficientNet 평가 중...")
    efficientnet_results = evaluate_efficientnet(efficientnet_model, test_images, labels_dict)
    print_results("EfficientNet", efficientnet_results)
    
    # 결과 저장
    save_results(yolo_results, efficientnet_results)
    
    print("\n✅ 평가 완료!")


if __name__ == "__main__":
    main()
