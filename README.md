# AI 기반 스마트 상품 스캔 앱
## AI · 딥러닝 시스템 아키텍처 및 기술 설계 문서

---

## 1. 프로젝트 개요

본 프로젝트는 사용자가 마트에서 상품을 하나 집어 스마트폰 앱으로 촬영하면,
AI가 자동으로 상품을 인식하고 장바구니에 추가하는 **AI 기반 스마트 상품 스캔 애플리케이션**을 구현하는 것을 목표로 한다.

본 프로젝트는 완전 무인매장이나 도난 방지를 목표로 하지 않으며,
학생 팀이 현실적으로 구현 가능한 수준의 **2단계 AI 인식 시스템**을 중심으로 설계되었다.

---

## 2. 전체 시스템 구조 개요

본 시스템은 **YOLO 기반 객체 탐지 모델**과
**추가 딥러닝 분류 모델**을 결합한 2-stage 구조로 구성된다.

```text
[모바일 앱]
   ↓ (이미지 촬영)
[FastAPI 서버]
   ↓
[YOLOv8 객체 탐지] + ocr , mobile  
   ↓
[상품 영역 Crop]
   ↓
[추가 딥러닝 분류 모델]
   ↓
[최종 상품 결정]
   ↓
[MySQL 장바구니 저장]
```


```
mobilenet - 
yolo 객체 탐지 - mobilenet 추론 - +(OCR 판단)

객체 탐지(단일모델) - 추론 OCR ml, 상표

정확한 이미지 촬영 유도
텍스트 블럭 찾아내게 해서 OCR로 - 이런 경우 재 라벨링

글자 인식 관건

단일 모델 + OCR 유도
후 리스트

상용화 시 고도화로.

프로세스가 말이 되게

객체 탐지 후 리스트에서 선택이라도 하게

텍스트 인식 모델 + 객체 탐지 모델

전체 뼈대 구현 우선 - 안되더라도 진행

ppt - system flowchart 추가 꼭 꼬꼬 꼮꼮 (일반인에게 이해 시키기)
일반인에게 판매 목적처럼

발표자료 - 개발일지 WBS
```

상용화시 제품 학습에 대한 어려움 - 수십만개의 제품. (사업화 시 개선사항으로 추가 해야함) - OCR로 텍스트 읽고 하던지 나중에 큰 사업이    될시에 개선사항을 생각해야함 - 미래 방향성 - 당장이 아닌 사업화 

gpt api


## 3. 전체 아키텍쳐 구조


```mermaid
graph TB
    subgraph Client["📱 클라이언트"]
        APP["React Native App<br/>(Expo 54 / RN 0.81.5)<br/>Android & iOS"]
    end

    subgraph OAuth["🔐 외부 OAuth 서비스"]
        GOOGLE["Google OAuth 2.0<br/>accounts.google.com"]
        KAKAO["Kakao OAuth<br/>kauth.kakao.com"]
    end

    subgraph EC2["☁️ AWS EC2 (3.37.14.89)"]
        NGINX["Nginx<br/>Reverse Proxy<br/>Port 80 / 443<br/>SSL 종단 · 정적 파일 서빙"]

        subgraph DOCKER["🐳 Docker Container (python:3.12-slim, Memory 1500MB)"]
            subgraph VENV["🐍 Python Virtual Env"]
                FASTAPI["FastAPI + Uvicorn<br/>Port 8000 · Workers 1"]

                subgraph ROUTERS["API Routers"]
                    R_AUTH["/api/auth/*<br/>회원가입 · 로그인"]
                    R_KAKAO["/api/auth/kakao<br/>Kakao OAuth"]
                    R_GOOGLE["/api/auth/google<br/>Google OAuth"]
                    R_AI["/api/ai/detect<br/>AI 상품 인식"]
                    R_PRODUCTS["/api/products<br/>상품 조회"]
                    R_CART["/api/cart/*<br/>장바구니 관리"]
                    R_RECEIPT["/api/receipts/*<br/>영수증 관리"]
                    R_HEALTH["/health/db<br/>DB 상태 확인"]
                end

                subgraph SERVICES["Services Layer"]
                    S_AI["ai_service.py"]
                    S_CART["cart_service.py"]
                    S_PRODUCT["product_service.py"]
                    S_RECEIPT["receipt_service.py"]
                end

                subgraph AI["🤖 AI Pipeline"]
                    YOLO["Stage 1: YOLOv8<br/>best.pt<br/>Object Detection<br/>352px · conf=0.20"]
                    MOBILENET["Stage 2: MobileNetV3<br/>mobilenetv3_best.pt<br/>Classification<br/>34 classes"]
                    OCR["Stage 3: PaddleOCR<br/>한국어 텍스트 인식"]
                end

                ORM["SQLAlchemy ORM<br/>Models & Schemas"]
                STATIC["Static Files<br/>/app/static/products/"]
            end
        end

        ENV[".env 파일<br/>DB_USER · DB_PASSWORD<br/>DB_HOST · DB_PORT · DB_NAME"]
    end

    subgraph RDS["🗄️ AWS RDS (MySQL · utf8mb4)"]
        direction LR
        T_USER["users"]
        T_PRODUCT["products"]
        T_CART["carts"]
        T_CARTITEM["cart_items"]
        T_RECEIPT["receipts"]
        T_RECEIPTITEM["receipt_items"]
        T_CATEGORY["categories"]
        T_BRAND["brands"]
        T_AIMAP["ai_product_mapping"]
        T_LOG["recognition_logs"]
    end

    APP -- "HTTPS" --> NGINX
    APP -- "OAuth WebView" --> GOOGLE
    APP -- "OAuth WebView" --> KAKAO
    NGINX -- "HTTP :8000" --> FASTAPI
    FASTAPI --> ROUTERS
    ROUTERS --> SERVICES
    S_AI --> AI
    YOLO --> MOBILENET --> OCR
    SERVICES --> ORM
    ORM -- "TCP :3306" --> RDS
    ENV -- "환경변수 주입" --> FASTAPI
```

---

## 모바일 앱 화면 구조

```mermaid
graph TD
    SPLASH["SplashScreen"]
    LOGIN["LoginScreen"]
    SIGNUP["SignupScreen"]
    SIGNUP_DONE["SignupCompleteScreen"]
    FIND["FindAccountScreen"]
    HOME["HomeScreen"]
    SCAN["ScanScreen<br/>📷 카메라 + AI 인식"]
    CART["CartScreen"]
    PAYMENT["PaymentScreen"]
    PAID["PaidScreen"]
    MYPAGE["MyPageScreen"]
    RECEIPT["ReceiptScreen"]
    RECEIPT_DETAIL["ReceiptDetailScreen"]

    GOOGLE_LOGIN["GoogleLogin.js<br/>(WebView)"]
    KAKAO_LOGIN["KakaoLogin.js<br/>(WebView)"]

    SPLASH --> LOGIN
    LOGIN --> HOME
    LOGIN --> SIGNUP --> SIGNUP_DONE --> HOME
    LOGIN --> FIND
    LOGIN --> GOOGLE_LOGIN --> HOME
    LOGIN --> KAKAO_LOGIN --> HOME

    HOME --> SCAN --> CART --> PAYMENT --> PAID
    HOME --> MYPAGE
    HOME --> RECEIPT --> RECEIPT_DETAIL
```

---

### 인증 흐름

```mermaid
sequenceDiagram
    participant APP as 📱 React Native App
    participant NGINX as Nginx
    participant API as FastAPI
    participant OAUTH as Google / Kakao
    participant DB as AWS RDS

    rect rgb(220, 240, 255)
        Note over APP,DB: 로컬 로그인
        APP->>NGINX: POST /api/auth/login
        NGINX->>API: Proxy
        API->>DB: 유저 조회
        DB-->>API: 유저 정보
        API-->>APP: JWT Token (60분)
        APP->>APP: AsyncStorage 저장
    end

    rect rgb(220, 255, 220)
        Note over APP,DB: SNS 로그인 (Google / Kakao)
        APP->>OAUTH: WebView OAuth 요청
        OAUTH-->>APP: Authorization Code
        APP->>NGINX: POST /api/auth/google (또는 kakao)
        NGINX->>API: Proxy
        API->>OAUTH: Code → Access Token 교환
        OAUTH-->>API: 유저 정보
        API->>DB: 신규 유저 생성 or 기존 유저 조회
        DB-->>API: 유저 정보
        API-->>APP: JWT Token
    end
```

---

### AI 인식 파이프라인

```mermaid
sequenceDiagram
    participant APP as 📱 React Native App
    participant NGINX as Nginx
    participant AI as AI Service (FastAPI)
    participant DB as AWS RDS

    APP->>NGINX: POST /api/ai/detect (이미지 업로드)
    NGINX->>AI: Proxy

    rect rgb(255, 245, 220)
        Note over AI: Stage 1 - YOLOv8
        AI->>AI: Object Detection<br/>352px · conf=0.20 · iou=0.50<br/>바운딩 박스 검출
    end

    rect rgb(220, 255, 240)
        Note over AI: Stage 2 - MobileNetV3
        AI->>AI: Classification<br/>34개 클래스 분류
    end

    rect rgb(255, 220, 240)
        Note over AI: Stage 3 - PaddleOCR
        AI->>AI: 한국어 텍스트 인식<br/>바코드 / 상품명 추출
    end

    AI->>DB: ai_product_mapping 조회 (클래스 → 상품 매핑)
    DB-->>AI: 상품 정보
    AI->>DB: recognition_log 저장
    AI-->>APP: 인식된 상품 목록
    APP->>APP: 드로어(Drawer) 표시
```

---

### 장바구니 & 결제 흐름

```mermaid
sequenceDiagram
    participant APP as 📱 React Native App
    participant API as FastAPI
    participant DB as AWS RDS

    APP->>APP: 스캔 결과 로컬 상태 관리
    APP->>API: POST /api/cart/scan/sync (서버 동기화)
    API->>DB: Cart / CartItem 저장
    APP->>API: GET /api/cart/me
    DB-->>API: 장바구니 정보
    API-->>APP: CartResponse
    APP->>API: PATCH /api/cart/items/{id} (수량 변경)
    APP->>API: DELETE /api/cart/items/{id} (항목 삭제)
    APP->>API: POST /api/cart/checkout
    API->>DB: Cart status → CHECKED_OUT
    APP->>API: POST /api/receipts (영수증 생성)
    API->>DB: Receipt / ReceiptItem 저장
    API-->>APP: ReceiptResponse
    APP->>APP: PaidScreen 표시
```

---

### 데이터베이스 ERD

```mermaid
erDiagram
    users {
        int user_id PK
        string login_id
        string password
        string username
        string phone
        string sns_type
        string sns_id
        datetime created_at
    }
    categories {
        int category_id PK
        string name
    }
    brands {
        int brand_id PK
        string name
    }
    products {
        int product_id PK
        string name
        string barcode
        int price
        string image_url
        int category_id FK
        int brand_id FK
    }
    carts {
        int cart_id PK
        int user_id FK
        string status
        datetime created_at
        datetime updated_at
    }
    cart_items {
        int cart_item_id PK
        int cart_id FK
        int product_id FK
        int quantity
    }
    receipts {
        int receipt_id PK
        int user_id FK
        int total_amount
        string payment_method
        datetime created_at
    }
    receipt_items {
        int receipt_item_id PK
        int receipt_id FK
        int product_id FK
        int quantity
        int price
    }
    ai_product_mapping {
        int mapping_id PK
        string ai_class_label
        int product_id FK
    }
    recognition_logs {
        int log_id PK
        int product_id FK
        float confidence
        datetime created_at
    }

    users ||--o{ carts : "has"
    users ||--o{ receipts : "has"
    carts ||--o{ cart_items : "contains"
    receipts ||--o{ receipt_items : "contains"
    products ||--o{ cart_items : "in"
    products ||--o{ receipt_items : "in"
    products }o--|| categories : "belongs to"
    products }o--|| brands : "belongs to"
    products ||--o{ ai_product_mapping : "mapped"
    products ||--o{ recognition_logs : "logged"
```

---

### 인프라 구성 요약

| 구성 요소 | 기술 스택 | 비고 |
|-----------|-----------|------|
| 모바일 앱 | React Native 0.81.5 / Expo 54 | Android + iOS |
| 리버스 프록시 | Nginx | SSL 종단, 정적 파일 서빙 |
| 백엔드 API | FastAPI + Uvicorn | Port 8000 |
| 컨테이너 | Docker (python:3.12-slim) | 메모리 1500MB 제한 |
| 가상환경 | Python venv (Docker 레이어 내) | requirements.txt 기반 |
| 데이터베이스 | AWS RDS MySQL | utf8mb4, pool_recycle=1800s |
| AI 모델 | YOLOv8 + MobileNetV3 + PaddleOCR | 컨테이너 내 로컬 저장 |
| 인증 | JWT (HS256, 60분) | python-jose |
| OAuth | Google OAuth 2.0 + Kakao OAuth | WebView 방식 |
| 호스팅 | AWS EC2 (3.37.14.89) | 단일 서버 |
| 환경변수 | .env 파일 | DB 접속 정보 (git 제외) |

### 포트 매핑

```
Internet :80/:443 → Nginx → Docker :8000 (FastAPI) → AWS RDS :3306 (MySQL)
```

