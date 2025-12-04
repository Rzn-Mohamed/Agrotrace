from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services.storage import minio_service
from app.models.unet import detector
from app.core.config import settings
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class AnalysisRequest(BaseModel):
    image_key: str

class AnalysisResponse(BaseModel):
    original_image_key: str
    mask_key: str
    disease_probability: float
    disease_name: str
    status: str

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(request: AnalysisRequest):
    """
    Analyze an image stored in MinIO.
    """
    try:
        # 1. Download image from MinIO
        logger.info(f"Downloading image: {request.image_key}")
        image_data = minio_service.download_file(settings.MINIO_BUCKET_IMAGES, request.image_key)
        
        # 2. Run inference
        logger.info("Running inference...")
        mask_bytes, probability, disease_name = detector.predict(image_data)
        
        # 3. Upload result mask to MinIO
        mask_filename = f"mask_{uuid.uuid4()}.png"
        mask_key = minio_service.upload_file(
            settings.MINIO_BUCKET_RESULTS,
            mask_filename,
            mask_bytes,
            content_type="image/png"
        )
        
        return AnalysisResponse(
            original_image_key=request.image_key,
            mask_key=mask_key,
            disease_probability=probability,
            disease_name=disease_name,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-and-analyze", response_model=AnalysisResponse)
async def upload_and_analyze(file: UploadFile = File(...)):
    """
    Directly upload an image and analyze it.
    """
    try:
        contents = await file.read()
        
        # Upload original
        filename = f"upload_{uuid.uuid4()}_{file.filename}"
        image_key = minio_service.upload_file(
            settings.MINIO_BUCKET_IMAGES,
            filename,
            contents,
            content_type=file.content_type
        )
        
        # Run inference
        mask_bytes, probability, disease_name = detector.predict(contents)
        
        # Upload mask
        mask_filename = f"mask_{uuid.uuid4()}.png"
        mask_key = minio_service.upload_file(
            settings.MINIO_BUCKET_RESULTS,
            mask_filename,
            mask_bytes,
            content_type="image/png"
        )
        
        return AnalysisResponse(
            original_image_key=image_key,
            mask_key=mask_key,
            disease_probability=probability,
            disease_name=disease_name,
            status="success"
        )
    except Exception as e:
        logger.error(f"Upload and analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-mask")
async def download_mask(key: str):
    """
    Download mask image from MinIO for display in web interface.
    """
    from fastapi.responses import StreamingResponse
    import io
    
    try:
        # Extract bucket and object name from key
        parts = key.split('/', 1)
        if len(parts) == 2:
            bucket = parts[0]
            object_name = parts[1]
        else:
            bucket = settings.MINIO_BUCKET_RESULTS
            object_name = key
        
        mask_data = minio_service.download_file(bucket, object_name)
        return StreamingResponse(io.BytesIO(mask_data), media_type="image/png")
    except Exception as e:
        logger.error(f"Failed to download mask: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Mask not found: {str(e)}")
