import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)


async def upload_image(file: UploadFile) -> dict:
    contents = await file.read()
    result = cloudinary.uploader.upload(contents, folder="tatuagem")
    return {"url": result["secure_url"], "public_id": result["public_id"]}


def delete_image(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id)
