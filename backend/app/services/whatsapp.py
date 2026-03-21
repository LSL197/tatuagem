import httpx
from app.config import settings


async def send_message(phone: str, text: str) -> dict:
    if not settings.whatsapp_token or not settings.whatsapp_phone_id:
        return {"status": "skipped", "reason": "WhatsApp não configurado"}
    url = f"https://graph.facebook.com/v18.0/{settings.whatsapp_phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone.replace("+", "").replace(" ", "").replace("-", ""),
        "type": "text",
        "text": {"body": text},
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
        )
    return response.json()
