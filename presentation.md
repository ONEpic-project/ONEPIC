# ONEPIC 발표 자료

## 개요
- 목적: 모바일로 상품 이미지를 스캔해 즉시 상품 정보를 제공
- 핵심: YOLOv8 탐지 + DB 매핑 + 간단한 OCR로 정확도/경험 강화

## 문제/기회
- 오프라인 매장 제품 정보 탐색이 번거롭고 느림
- 간편한 스캔 경험으로 구매 전환/재고 안내/브랜드 노출 극대화

## 해결책 요약
- 모바일 앱(Expo/React Native)에서 사진 업로드 → FastAPI가 AI 추론 및 매핑 → 상품 정보 반환/표시
- 확장성: 모델 교체/고도화, 매핑 테이블 업데이트만으로 품목 확장

## 아키텍처
- 클라이언트: `product-scanner` (Expo/React Native)
- 서버: `backend/app` (FastAPI)
  - 엔드포인트: `/api/ai/analyze`, `/api/products`, `/`
- AI: YOLOv8(탐지), EasyOCR(보조 텍스트), 추후 분류모델 연결 가능
- 데이터베이스: MySQL + SQLAlchemy ORM

## 주요 컴포넌트/경로
- 앱 진입/네비: [product-scanner/App.js](product-scanner/App.js)
- AI 엔드포인트: [backend/app/routers/ai.py](backend/app/routers/ai.py)
- 상품 엔드포인트: [backend/app/routers/products.py](backend/app/routers/products.py)
- AI 서비스: [backend/app/services/ai_service.py](backend/app/services/ai_service.py)
- DB 세션: [backend/app/core/dependencies.py](backend/app/core/dependencies.py)
- ORM/엔진: [backend/app/database/database.py](backend/app/database/database.py)
- 모델 가중치: [backend/app/services/model_files/best.pt](backend/app/services/model_files/best.pt)

## 데이터 플로우
1) 앱이 사진을 `POST /api/ai/analyze`로 업로드 (multipart `file`)
2) 서버가 YOLO 추론 → 박스/클래스 도출 → `AIProductMapping`으로 상품 매핑
3) `Product`/`Brand`에서 상세 조회, `RecognitionLog` 저장
4) 박스 그려진 결과이미지(Base64) + 상품 리스트 응답 → 앱 표시

## API 요약
- `POST /api/ai/analyze`
  - 요청: multipart `file`
  - 응답: `{ num_detections, detections[], image_base64 }`
    - `detections[i]`: `{ class_id, product_id, product_name, brand_name, price, yolo_confidence, class_confidence, ocr_text, bbox }
- `GET /api/products?category_id=optional`
  - 응답: 상품 목록(ORM 직렬화)
- `GET /` → `{ message: "ONEPIC Backend Running!" }`

## 데모 시나리오 (라이브)
1) 백엔드 기동 후 브라우저에서 `/api/products/test` 또는 `/api/products/view` 확인
2) 모바일 앱에서 샘플 이미지 업로드 → 분석 결과/상품 정보 표시
3) 정확도/속도/사용성을 짧게 코멘트

## 실행 방법 (요약)
- Backend (FastAPI):
```bash
# 의존성 설치
pip install -r backend/requirements.txt

# 서버 실행 (개발)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```
- Mobile (Expo/React Native):
```bash
# 의존성 설치
cd product-scanner
npm install

# 실행
npm run start
# 또는 플랫폼별
npm run android
npm run ios
```

## 모델/데이터
- YOLO 가중치: 서비스 기본 경로 사용 `backend/app/services/model_files/best.pt`
- OCR: EasyOCR(`ko`, `en`) CPU 모드
- 매핑: `AIProductMapping`으로 클래스→상품 연결(정확도 향상 포인트)

## 성능/운영 고려사항
- GPU 사용 시 `torch.cuda.is_available()`에 따라 자동 선택(서버 스펙 고려)
- DB 연결 문자열/자격 증명은 환경변수로 이전 권장
- 추론 병렬 처리/큐잉, 이미지 리사이즈 정책으로 처리량 개선

## 로드맵(예시)
- 분류모델(EfficientNet 등) 병합 및 신뢰도 융합
- 사용자 피드백 루프(정답 선택 → 매핑 개선)
- 인증/사용자 이력, 즐겨찾기/추천 기능
- 레이턴시 최적화/모델 경량화/온디바이스 옵션 검토
