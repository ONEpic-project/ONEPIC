from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.product import Product

router = APIRouter()

def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(Product.product_id == product_id).first()

# ✅ 실제 DB 연동 API (추가)
@router.get("/")
def get_products(
    category_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    return query.all()

# ✅ 연결 테스트용 (유지)
@router.get("/test")
def product_test():
    return {"message": "Product router OK"}

# ✅ 임시 HTML 테스트 페이지
@router.get("/view", response_class=HTMLResponse)
def product_view():
    html = """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8" />
        <title>ONEPIC AI Demo</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background: #f5f5f5;
            }
            h1 {
                margin-bottom: 20px;
            }
            .box {
                background: #fff;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
                max-width: 700px;
            }
            button {
                padding: 10px 16px;
                font-size: 15px;
                cursor: pointer;
            }
            ul {
                list-style: none;
                padding: 0;
            }
            li {
                background: #fafafa;
                margin-bottom: 10px;
                padding: 12px;
                border-radius: 6px;
            }
            img {
                max-width: 100%;
                margin-top: 10px;
                border-radius: 8px;
            }
            .confidence {
                color: #666;
                font-size: 13px;
            }
        </style>
    </head>
    <body>

        <h1>🧠 ONEPIC - AI 상품 인식 데모</h1>

        <div class="box">
            <h3>1️⃣ 상품 이미지 업로드</h3>
            <input type="file" id="imageInput" />
            <br/><br/>
            <button onclick="analyze()">AI 분석 시작</button>
        </div>

        <div class="box">
            <h3>2️⃣ AI 분석 결과</h3>
            <div id="aiResult">아직 분석 전</div>
            <img id="resultImage" />
        </div>

        <div class="box">
            <h3>3️⃣ DB 상품 결과</h3>
            <ul id="productList"></ul>
        </div>

        <script>
            async function analyze() {
                const fileInput = document.getElementById("imageInput");
                if (!fileInput.files.length) {
                    alert("이미지를 선택하세요!");
                    return;
                }

                const formData = new FormData();
                formData.append("file", fileInput.files[0]);

                // ✅ AI API만 호출
                const aiRes = await fetch("/api/ai/analyze", {
                    method: "POST",
                    body: formData
                });

                const aiData = await aiRes.json();

                const productList = document.getElementById("productList");
                const imgEl = document.getElementById("resultImage");
                productList.innerHTML = "";

                // bbox 이미지 표시
                imgEl.src = "data:image/jpeg;base64," + aiData.image_base64;

                // ✅ 여기서 products API 호출 ❌❌❌ 없음
                const products = aiData.matched_products;

                if (!products || products.length === 0) {
                    productList.innerHTML = "<li>매칭된 상품 없음</li>";
                    return;
                }

                products.forEach(p => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <strong>${p.name}</strong><br/>
                        가격: ${p.price}<br/>
                        confidence: ${p.confidence.toFixed(2)}
                    `;
                    productList.appendChild(li);
                });
            }
            </script>


    </body>
    </html>
    """
    return html
