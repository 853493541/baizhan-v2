# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import numpy as np
import io
import base64

app = FastAPI(title="Chinese OCR (Text Only)", version="1.0.0")

# Allow everything during development; tighten in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OCR once (downloads models on first run; caches afterwards)
ocr = RapidOCR()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)) -> dict:
    """
    Upload an image file (png/jpg/webp/etc). Returns plain text lines.
    """
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file.")
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image.")

    np_img = np.array(image)
    result, _ = ocr(np_img)  # result: [ [box, text, score], ... ]
    lines: List[str] = [item[1] for item in (result or [])]
    return {"lines": lines, "count": len(lines)}

@app.post("/ocr/base64")
async def ocr_image_base64(payload: dict) -> dict:
    """
    Accepts: { "imageBase64": "data:image/png;base64,..." or raw base64 }
    Returns plain text lines.
    """
    b64 = payload.get("imageBase64")
    if not b64:
        raise HTTPException(status_code=400, detail="imageBase64 is required.")

    # Strip data URL prefix if present
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
    return {"lines": lines, "count": len(lines)}
