# ONEPIC 파일/디렉터리 역할 요약

## 루트
- [best.pt](best.pt): 최신 YOLO 모델 가중치(전역 배치). 사용 여부는 서비스 코드 기준 `services/model_files/best.pt` 우선.
- [classes_order.txt](classes_order.txt): 클래스 인덱스/이름 매핑 정의 참고용.
- [efficientnet_snack.pt](efficientnet_snack.pt): 스낵 분류 EfficientNet 가중치(미사용/예비).
- [ONEPIC.erd](ONEPIC.erd): DB 스키마 ERD 다이어그램.
- [README.md](README.md): 기본 프로젝트 문서.
- [ai_old/](ai_old): 과거/예비 AI 자산(모델, 클래스 라벨, 실험 기록).

## backend
- [backend/requirements.txt](backend/requirements.txt): 백엔드 파이썬 의존성 목록.
- [backend/app/main.py](backend/app/main.py): FastAPI 앱 인스턴스, 라우터 등록(`/api/ai`, `/api/products`).

### 데이터베이스/코어
- [backend/app/database/database.py](backend/app/database/database.py): SQLAlchemy `engine`, `SessionLocal`, `Base` 설정(MySQL 연결 문자열 포함).
- [backend/app/core/dependencies.py](backend/app/core/dependencies.py): `get_db()` 의존성 주입(세션 수명 관리).

### 모델(ORM)
- [backend/app/models/product.py](backend/app/models/product.py): `Product` 테이블 모델(브랜드/카테고리 관계, 가격/바코드 등 속성).
- [backend/app/models/category.py](backend/app/models/category.py): `Category` 테이블 모델.
- [backend/app/models/brand.py](backend/app/models/brand.py): `Brand` 테이블 모델.
- [backend/app/models/recognition_log.py](backend/app/models/recognition_log.py): 인식 로그 저장(`product_id`, `confidence`, `created_at`).
- [backend/app/models/ai_product_mapping.py](backend/app/models/ai_product_mapping.py): AI `class_id` ↔︎ 실제 `product_id` 매핑.

### 라우터(API)
- [backend/app/routers/ai.py](backend/app/routers/ai.py): `POST /api/ai/analyze` 이미지 업로드 → AI 분석 결과 반환.
- [backend/app/routers/products.py](backend/app/routers/products.py): `GET /api/products` 상품 조회(카테고리 필터), `/test` 헬스체크, `/view` 임시 데모 페이지.

### 서비스/AI
- [backend/app/services/ai_service.py](backend/app/services/ai_service.py):
  - YOLO 추론 → 바운딩박스/클래스 도출, EasyOCR 보조 텍스트 추출.
  - `AIProductMapping`/`Product`로 DB 매핑, `RecognitionLog` 저장.
  - 시각화된 결과 이미지를 Base64로 포함하여 응답 구성.
- [backend/app/services/model_files/best.pt](backend/app/services/model_files/best.pt): 서비스에서 로드하는 YOLO 가중치(실사용 경로).

## product-scanner (모바일 앱)
- [product-scanner/package.json](product-scanner/package.json): Expo/React Native 앱 스크립트/의존성.
- [product-scanner/App.js](product-scanner/App.js): 네비게이션 스택 구성(로그인 → 홈/스캔 등).
- [product-scanner/screens/LoginScreen.js](product-scanner/screens/LoginScreen.js): 로그인 화면.
- [product-scanner/screens/SignupScreen.js](product-scanner/screens/SignupScreen.js): 회원가입 화면.
- [product-scanner/screens/SignupCompleteScreen.js](product-scanner/screens/SignupCompleteScreen.js): 가입 완료 화면.
- [product-scanner/screens/FindAccountScreen.js](product-scanner/screens/FindAccountScreen.js): 계정 찾기 화면.
- [product-scanner/screens/Home.js](product-scanner/screens/Home.js): 홈 화면.
- [product-scanner/screens/ScanScreen.js](product-scanner/screens/ScanScreen.js): 카메라/이미지 업로드로 백엔드 AI 분석 호출.
