from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import numpy as np
import io
import base64
import logging

# === Setup ===
app = FastAPI(title="Chinese OCR (Text Only)", version="1.0.0")

# Enable CORS (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Logging config ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("ocr")

# === Initialize OCR ===
ocr = RapidOCR()

@app.get("/ocr/health")
def health():
    return {"ok": True}

# === OCR from file ===
@app.post("/ocr")
@app.post("/ocr/")  # also allow trailing slash
async def ocr_image(file: UploadFile = File(...)) -> dict:
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file.")
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image.")

    np_img = np.array(image)
    result, _ = ocr(np_img)
    lines: List[str] = [item[1] for item in (result or [])]

    # 🟢 Debug log
    logger.info(f"OCR request: file={file.filename}, total_lines={len(lines)}")
    for i, text in enumerate(lines):
        logger.info(f"  [{i+1:02d}] {text}")

    return {"lines": lines, "count": len(lines)}

# === OCR from base64 ===
@app.post("/ocr/base64")
@app.post("/ocr/base64/")  # allow trailing slash
async def ocr_image_base64(payload: dict) -> dict:
    b64 = payload.get("imageBase64")
    if not b64:
        raise HTTPException(status_code=400, detail="imageBase64 is required.")

    if "," in b64:
        b64 = b64.split(",", 1)[1]

    try:
        binary = base64.b64decode(b64, validate=True)
        image = Image.open(io.BytesIO(binary)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image.")

    np_img = np.array(image)
    result, _ = ocr(np_img)
    lines: List[str] = [item[1] for item in (result or [])]

    # 🟢 Debug log
    logger.info(f"OCR request (base64): total_lines={len(lines)}")
    for i, text in enumerate(lines):
        logger.info(f"  [{i+1:02d}] {text}")

    return {"lines": lines, "count": len(lines)}
