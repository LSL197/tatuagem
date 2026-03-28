import httpx
import tempfile
import os
from app.config import settings


async def transcribe_whatsapp_audio(media_id: str, whatsapp_token: str) -> str:
    """
    Dado um media_id de uma mensagem de áudio do WhatsApp Cloud API,
    baixa o arquivo e transcreve via OpenAI Whisper.
    Retorna o texto transcrito ou string vazia em caso de falha.
    """
    # Passo 1: obter a URL de download a partir do media_id
    media_url_endpoint = f"https://graph.facebook.com/v18.0/{media_id}"
    headers = {"Authorization": f"Bearer {whatsapp_token}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Busca metadados da mídia (retorna url, mime_type, file_size)
        meta_response = await client.get(media_url_endpoint, headers=headers)
        if meta_response.status_code != 200:
            return ""
        media_info = meta_response.json()
        download_url = media_info.get("url", "")
        if not download_url:
            return ""

        # Passo 2: baixar o binário do áudio
        audio_response = await client.get(download_url, headers=headers)
        if audio_response.status_code != 200:
            return ""
        audio_bytes = audio_response.content

    # Passo 3: salvar temporariamente e enviar ao Whisper
    # WhatsApp envia áudio em formato ogg/opus — Whisper aceita ogg
    suffix = ".ogg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        from openai import OpenAI
        client_oai = OpenAI(api_key=settings.openai_api_key)
        with open(tmp_path, "rb") as audio_file:
            transcript = client_oai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="pt",  # força português para reduzir erros
            )
        return transcript.text.strip()
    except Exception:
        return ""
    finally:
        os.unlink(tmp_path)
