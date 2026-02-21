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
        """
        Initialize transcription service with Deepgram or Whisper

        Validates DEEPGRAM_API_KEY properly:
        - None, empty string, or "placeholder" are considered invalid
        - Falls back to Whisper if Deepgram key is invalid
        """
        self.deepgram_api_key = settings.deepgram_api_key
        self.use_deepgram = self._is_valid_api_key(self.deepgram_api_key)

        if self.use_deepgram:
            logger.info("Using Deepgram for transcription")
        else:
            logger.info("Using Whisper for transcription (Deepgram key invalid or not configured)")
            # Load Whisper model locally
            try:
                import whisper
                self.whisper_model = whisper.load_model(settings.whisper_model)
                logger.info(f"Whisper model '{settings.whisper_model}' loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load Whisper model: {e}")
                self.whisper_model = None

    def _is_valid_api_key(self, key: Optional[str]) -> bool:
        """
        Validate if API key is valid

        Args:
            key: API key to validate

        Returns:
            True if valid, False otherwise
        """
        if key is None:
            return False

        if key.strip() == "":
            return False

        if key.lower() == "placeholder":
            return False

        return True

    
    async def transcribe_audio(
        self, 
        audio_path: str,
        language: str = "pt"
    ) -> Dict[str, Any]:
        """
        Transcribe audio file to text with automatic fallback
        
        Tries Deepgram first (if configured), falls back to Whisper on failure.
        
        Args:
            audio_path: Path to audio/video file
            language: Language code (pt, en, es, etc.)
            
        Returns:
            Dict with 'text', 'segments', 'language', and 'provider'
        """
        # Try Deepgram first if configured
        if self.use_deepgram:
            try:
                logger.info(f"Attempting transcription with Deepgram: {audio_path}")
                result = await self._transcribe_deepgram(audio_path, language)
                logger.info(f"Deepgram transcription successful: {audio_path}")
                return result
                
            except Exception as e:
                logger.error(
                    f"Deepgram transcription failed: {str(e)}. "
                    f"Falling back to Whisper for {audio_path}"
                )
                # Continue to Whisper fallback
        
        # Use Whisper (direct or as fallback)
        logger.info(f"Using Whisper for transcription: {audio_path}")
        result = await self._transcribe_whisper(audio_path, language)
        logger.info(f"Whisper transcription successful: {audio_path}")
        return result
    
    async def transcribe_video(
        self,
        video_url: str,
        language: str = "pt"
    ) -> Dict[str, Any]:
        """
        Transcribe video by extracting audio and transcribing
        
        Args:
            video_url: URL or path to video file
            language: Language code
            
        Returns:
            Dict with transcription, segments, waveform, language, duration
        """
        import tempfile
        import urllib.request
        from app.services.video_processing import VideoProcessingService
        
        try:
            # Download video to temp file
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_video:
                video_path = tmp_video.name
                urllib.request.urlretrieve(video_url, video_path)
            
            # Extract audio
            video_service = VideoProcessingService()
            audio_path = video_path.replace(".mp4", ".wav")
            await video_service.extract_audio(video_path, audio_path)
            
            # Get video duration
            info = await video_service.get_video_info(video_path)
            duration = info["duration"]
            
            # Generate waveform data
            waveform = await self._generate_waveform(audio_path, duration)
            
            # Transcribe audio
            result = await self.transcribe_audio(audio_path, language)
            
            # Clean up temp files
            Path(video_path).unlink(missing_ok=True)
            Path(audio_path).unlink(missing_ok=True)
            
            return {
                "transcription": result["text"],
                "segments": result["segments"],
                "waveform": waveform,
                "language": result["language"],
                "duration": duration
            }
            
        except Exception as e:
            logger.error(f"Video transcription error: {e}", exc_info=True)
            raise
    
    async def _generate_waveform(self, audio_path: str, duration: float, samples: int = 100) -> list:
        """
        Generate waveform data for audio visualization
        
        Args:
            audio_path: Path to audio file
            duration: Duration in seconds
            samples: Number of waveform samples to generate
            
        Returns:
            List of amplitude values (0.0 to 1.0)
        """
        try:
            import subprocess
            import json
            
            # Use FFmpeg to extract audio stats
            cmd = [
                "ffmpeg",
                "-i", audio_path,
                "-af", f"astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
                "-f", "null",
                "-"
            ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True
            )
            
            # Parse RMS levels from output
            lines = result.stderr.split("\n")
            rms_values = []
            
            for line in lines:
                if "lavfi.astats.Overall.RMS_level" in line:
                    try:
                        value = float(line.split("=")[-1].strip())
                        # Convert dB to 0-1 range (approximate)
                        normalized = max(0, min(1, (value + 60) / 60))
                        rms_values.append(normalized)
                    except:
                        pass
            
            # Downsample to desired number of samples
            if len(rms_values) > samples:
                step = len(rms_values) / samples
                waveform = [rms_values[int(i * step)] for i in range(samples)]
            else:
                # Upsample or use as is
                waveform = rms_values + [0.0] * (samples - len(rms_values))
            
            return waveform[:samples]
            
        except Exception as e:
            logger.warning(f"Waveform generation failed: {e}")
            # Return dummy waveform
            import random
            return [random.random() * 0.5 for _ in range(samples)]
    
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
