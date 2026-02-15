"""
Transcription service using Whisper (local) or Deepgram (API)
"""
import asyncio
import httpx
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class TranscriptionService:
    def __init__(self):
        self.use_deepgram = bool(settings.deepgram_api_key)
        
        if not self.use_deepgram:
            # Load Whisper model locally
            try:
                import whisper
                self.whisper_model = whisper.load_model(settings.whisper_model)
                logger.info(f"Whisper model '{settings.whisper_model}' loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load Whisper model: {e}")
                self.whisper_model = None
    
    async def transcribe_audio(
        self, 
        audio_path: str,
        language: str = "pt"
    ) -> Dict[str, Any]:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio/video file
            language: Language code (pt, en, es, etc.)
            
        Returns:
            Dict with 'text' and 'segments' (word-level timestamps)
        """
        if self.use_deepgram:
            return await self._transcribe_deepgram(audio_path, language)
        else:
            return await self._transcribe_whisper(audio_path, language)
    
    async def _transcribe_deepgram(
        self, 
        audio_path: str,
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using Deepgram API"""
        try:
            url = "https://api.deepgram.com/v1/listen"
            
            # Deepgram parameters
            params = {
                "language": language,
                "punctuate": "true",
                "utterances": "true",
                "diarize": "false",
                "smart_format": "true"
            }
            
            headers = {
                "Authorization": f"Token {settings.deepgram_api_key}",
            }
            
            # Read audio file
            with open(audio_path, "rb") as audio_file:
                audio_data = audio_file.read()
            
            # Make API request
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    url,
                    params=params,
                    headers=headers,
                    content=audio_data
                )
                response.raise_for_status()
                result = response.json()
            
            # Extract transcript and segments
            transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]
            words = result["results"]["channels"][0]["alternatives"][0].get("words", [])
            
            # Convert to our format
            segments = [
                {
                    "start": word["start"],
                    "end": word["end"],
                    "text": word["word"]
                }
                for word in words
            ]
            
            logger.info(f"Deepgram transcription completed: {len(segments)} words")
            
            return {
                "text": transcript,
                "segments": segments,
                "language": language,
                "provider": "deepgram"
            }
            
        except Exception as e:
            logger.error(f"Deepgram transcription failed: {e}", exc_info=True)
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def _transcribe_whisper(
        self, 
        audio_path: str,
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using local Whisper model"""
        if not self.whisper_model:
            raise Exception("Whisper model not loaded")
        
        try:
            # Run Whisper in thread pool (CPU-intensive)
            def _transcribe():
                return self.whisper_model.transcribe(
                    audio_path,
                    language=language,
                    word_timestamps=True
                )
            
            result = await asyncio.to_thread(_transcribe)
            
            # Extract segments with word-level timestamps
            segments = []
            for segment in result.get("segments", []):
                for word in segment.get("words", []):
                    segments.append({
                        "start": word["start"],
                        "end": word["end"],
                        "text": word["word"]
                    })
            
            logger.info(f"Whisper transcription completed: {len(segments)} words")
            
            return {
                "text": result["text"],
                "segments": segments,
                "language": result.get("language", language),
                "provider": "whisper"
            }
            
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}", exc_info=True)
            raise Exception(f"Transcription failed: {str(e)}")

# Singleton instance
transcription_service = TranscriptionService()
