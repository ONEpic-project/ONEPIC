from fastapi import APIRouter, File, UploadFile
from app.services.ai_service import run_yolo5_inference

router = APIRouter()

@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    img_bytes = await file.read()
    result = run_yolo5_inference(img_bytes)
    return {"result": result}

# 임시 페이지 추가 (미리보기용)
from fastapi.responses import HTMLResponse

@router.get("/preview", response_class=HTMLResponse)
def preview_page():
    return """
    <html>
        <body>
            <h2>YOLO Detection Preview</h2>

            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" name="file" id="fileInput" />
                <button type="button" onclick="send()">Upload</button>
            </form>

            <h3>Result Image:</h3>
            <img id="resultImg" width="500" />

            <script>
                async function send() {
                    const fileInput = document.getElementById("fileInput");
                    const formData = new FormData();
                    formData.append("file", fileInput.files[0]);

                    const res = await fetch("/api/ai/detect", {
                        method: "POST",
                        body: formData
                    });

                    const data = await res.json();

                    // base64 이미지 표시
                    document.getElementById("resultImg").src =
                        "data:image/png;base64," + data.result.image_base64;
                }
            </script>
        </body>
    </html>
    """
