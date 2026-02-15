"""
Video processing service using FFmpeg
Handles: subtitle burning, video cutting, format conversion, silence removal
"""
import asyncio
import subprocess
import json
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class VideoProcessingService:
    def __init__(self):
        self.temp_path = Path(settings.temp_video_path)
        self.temp_path.mkdir(parents=True, exist_ok=True)
    
    async def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """
        Get video metadata using ffprobe
        
        Returns:
            Dict with duration, width, height, fps, codec, etc.
        """
        try:
            cmd = [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                video_path
            ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            data = json.loads(result.stdout)
            
            # Extract video stream info
            video_stream = next(
                (s for s in data["streams"] if s["codec_type"] == "video"),
                None
            )
            
            if not video_stream:
                raise Exception("No video stream found")
            
            # Extract audio stream info
            audio_stream = next(
                (s for s in data["streams"] if s["codec_type"] == "audio"),
                None
            )
            
            return {
                "duration": float(data["format"]["duration"]),
                "size": int(data["format"]["size"]),
                "width": int(video_stream["width"]),
                "height": int(video_stream["height"]),
                "fps": eval(video_stream["r_frame_rate"]),  # "30/1" -> 30.0
                "video_codec": video_stream["codec_name"],
                "audio_codec": audio_stream["codec_name"] if audio_stream else None,
                "bitrate": int(data["format"]["bit_rate"]),
            }
            
        except Exception as e:
            logger.error(f"Failed to get video info: {e}", exc_info=True)
            raise Exception(f"Video info extraction failed: {str(e)}")
    
    async def burn_subtitles(
        self,
        video_path: str,
        output_path: str,
        segments: List[Dict[str, Any]],
        style: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Burn subtitles into video using FFmpeg
        
        Args:
            video_path: Input video path
            output_path: Output video path
            segments: List of subtitle segments with start, end, text
            style: Subtitle style config (fontSize, color, position, etc.)
            
        Returns:
            Path to output video
        """
        try:
            # Default style
            default_style = {
                "fontSize": 32,
                "fontColor": "#FFFFFF",
                "backgroundColor": "#000000",
                "backgroundOpacity": 0.7,
                "position": "bottom",  # bottom, center, top
                "preset": "word-by-word"  # word-by-word, sentence, full
            }
            
            style = {**default_style, **(style or {})}
            
            # Create SRT subtitle file
            srt_path = self.temp_path / f"{Path(video_path).stem}_subtitles.srt"
            self._create_srt_file(srt_path, segments, style["preset"])
            
            # Build FFmpeg command
            # Position mapping
            position_map = {
                "top": "Alignment=2",  # Top center
                "center": "Alignment=5",  # Middle center
                "bottom": "Alignment=2"  # Bottom center (default)
            }
            
            # Convert hex color to BGR for FFmpeg
            font_color = style["fontColor"].lstrip("#")
            bg_color = style["backgroundColor"].lstrip("#")
            
            # FFmpeg subtitle filter
            subtitle_filter = (
                f"subtitles={srt_path}:force_style='"
                f"FontSize={style['fontSize']},"
                f"PrimaryColour=&H{font_color[::-1]}&,"  # BGR format
                f"BackColour=&H{bg_color[::-1]}&,"
                f"BorderStyle=4,"
                f"{position_map.get(style['position'], 'Alignment=2')}'"
            )
            
            cmd = [
                "ffmpeg",
                "-i", video_path,
                "-vf", subtitle_filter,
                "-c:a", "copy",  # Copy audio without re-encoding
                "-y",  # Overwrite output
                output_path
            ]
            
            logger.info(f"Burning subtitles with command: {' '.join(cmd)}")
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Subtitles burned successfully: {output_path}")
            
            # Clean up SRT file
            srt_path.unlink(missing_ok=True)
            
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg subtitle burning failed: {e.stderr}", exc_info=True)
            raise Exception(f"Subtitle burning failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Subtitle burning error: {e}", exc_info=True)
            raise Exception(f"Subtitle burning failed: {str(e)}")
    
    def _create_srt_file(
        self,
        srt_path: Path,
        segments: List[Dict[str, Any]],
        preset: str
    ):
        """Create SRT subtitle file from segments"""
        with open(srt_path, "w", encoding="utf-8") as f:
            if preset == "word-by-word":
                # One word per subtitle
                for i, segment in enumerate(segments, 1):
                    start = self._format_srt_time(segment["start"])
                    end = self._format_srt_time(segment["end"])
                    text = segment["text"].strip()
                    
                    f.write(f"{i}\n")
                    f.write(f"{start} --> {end}\n")
                    f.write(f"{text}\n\n")
            
            elif preset == "sentence":
                # Group words into sentences (simplified)
                # TODO: Implement proper sentence detection
                pass
            
            elif preset == "full":
                # All text at once
                if segments:
                    start = self._format_srt_time(segments[0]["start"])
                    end = self._format_srt_time(segments[-1]["end"])
                    text = " ".join(s["text"] for s in segments)
                    
                    f.write("1\n")
                    f.write(f"{start} --> {end}\n")
                    f.write(f"{text}\n\n")
    
    def _format_srt_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format (HH:MM:SS,mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    async def convert_format(
        self,
        input_path: str,
        output_path: str,
        target_format: str = "mp4"
    ) -> str:
        """
        Convert video to different format
        
        Args:
            input_path: Input video path
            output_path: Output video path
            target_format: Target format (mp4, webm, mov, etc.)
            
        Returns:
            Path to output video
        """
        try:
            cmd = [
                "ffmpeg",
                "-i", input_path,
                "-c:v", "libx264",  # H.264 codec
                "-c:a", "aac",  # AAC audio
                "-movflags", "+faststart",  # Enable streaming
                "-y",
                output_path
            ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Video converted to {target_format}: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e.stderr}", exc_info=True)
            raise Exception(f"Video conversion failed: {e.stderr}")
    
    async def extract_audio(
        self,
        video_path: str,
        output_path: str
    ) -> str:
        """
        Extract audio from video
        
        Returns:
            Path to audio file
        """
        try:
            cmd = [
                "ffmpeg",
                "-i", video_path,
                "-vn",  # No video
                "-acodec", "pcm_s16le",  # WAV format for Whisper
                "-ar", "16000",  # 16kHz sample rate
                "-ac", "1",  # Mono
                "-y",
                output_path
            ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Audio extracted: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg audio extraction failed: {e.stderr}", exc_info=True)
            raise Exception(f"Audio extraction failed: {e.stderr}")
    
    async def trim_video(
        self,
        video_path: str,
        output_path: str,
        start_time: float,
        end_time: float
    ) -> str:
        """
        Trim video to specific time range
        
        Args:
            video_path: Input video path
            output_path: Output video path
            start_time: Start time in seconds
            end_time: End time in seconds
            
        Returns:
            Path to trimmed video
        """
        try:
            duration = end_time - start_time
            
            cmd = [
                "ffmpeg",
                "-ss", str(start_time),
                "-i", video_path,
                "-t", str(duration),
                "-c", "copy",  # Copy without re-encoding (fast)
                "-y",
                output_path
            ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Video trimmed: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg trim failed: {e.stderr}", exc_info=True)
            raise Exception(f"Video trim failed: {e.stderr}")
    
    async def extract_metadata(self, video_path: str) -> Dict[str, Any]:
        """
        Extract video metadata (wrapper for get_video_info)
        """
        info = await self.get_video_info(video_path)
        return {
            "duration": info["duration"],
            "resolution": f"{info['width']}x{info['height']}",
            "codec": info["video_codec"],
            "fps": info["fps"],
            "sizeBytes": info["size"]
        }
    
    async def detect_silences(
        self,
        video_url: str,
        min_silence_duration: float = 1.0,
        silence_threshold: int = -30
    ) -> Dict[str, Any]:
        """
        Detect silences in video audio using FFmpeg silencedetect filter
        """
        import tempfile
        import urllib.request
        
        try:
            # Download video to temp file
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
                temp_path = tmp_file.name
                urllib.request.urlretrieve(video_url, temp_path)
            
            # Get video duration
            info = await self.get_video_info(temp_path)
            video_duration = info["duration"]
            
            # Run FFmpeg with silencedetect filter
            cmd = [
                "ffmpeg",
                "-i", temp_path,
                "-af", f"silencedetect=noise={silence_threshold}dB:d={min_silence_duration}",
                "-f", "null",
                "-"
            ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True
            )
            
            # Parse silence detection output
            silences = []
            lines = result.stderr.split("\n")
            
            silence_start = None
            for line in lines:
                if "silence_start:" in line:
                    silence_start = float(line.split("silence_start:")[1].strip())
                elif "silence_end:" in line and silence_start is not None:
                    parts = line.split("|")
                    silence_end = float(parts[0].split("silence_end:")[1].strip())
                    silence_duration = float(parts[1].split("silence_duration:")[1].strip())
                    
                    silences.append({
                        "start": silence_start,
                        "end": silence_end,
                        "duration": silence_duration
                    })
                    silence_start = None
            
            # Calculate total silence duration
            total_silence = sum(s["duration"] for s in silences)
            silence_percentage = (total_silence / video_duration * 100) if video_duration > 0 else 0
            
            # Clean up temp file
            Path(temp_path).unlink(missing_ok=True)
            
            return {
                "silences": silences,
                "totalSilenceDuration": total_silence,
                "videoDuration": video_duration,
                "silencePercentage": round(silence_percentage, 2)
            }
            
        except Exception as e:
            logger.error(f"Silence detection error: {e}", exc_info=True)
            raise
    
    async def process_video(
        self,
        video_url: str,
        video_id: str,
        subtitles: Optional[Dict[str, Any]] = None,
        trim: Optional[Dict[str, Any]] = None,
        silence_removal: Optional[Dict[str, Any]] = None,
        progress_callback = None
    ) -> Dict[str, Any]:
        """
        Process video with multiple operations: trim, silence removal, subtitles
        """
        import tempfile
        import urllib.request
        
        try:
            # Download video
            if progress_callback:
                progress_callback(10, "Baixando vídeo...")
            
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
                temp_input = tmp_file.name
                urllib.request.urlretrieve(video_url, temp_input)
            
            current_file = temp_input
            
            # Apply trim
            if trim:
                if progress_callback:
                    progress_callback(25, "Aplicando cortes...")
                
                trimmed_file = str(self.temp_path / f"{video_id}_trimmed.mp4")
                await self.trim_video(
                    current_file,
                    trimmed_file,
                    trim["start"],
                    trim["end"]
                )
                if current_file != temp_input:
                    Path(current_file).unlink(missing_ok=True)
                current_file = trimmed_file
            
            # Apply silence removal
            if silence_removal and silence_removal.get("enabled"):
                if progress_callback:
                    progress_callback(40, "Removendo silêncios...")
                
                # Build complex filter for removing silences
                silences = silence_removal.get("silences", [])
                if silences:
                    removed_file = str(self.temp_path / f"{video_id}_no_silence.mp4")
                    await self._remove_silences(current_file, removed_file, silences)
                    if current_file != temp_input:
                        Path(current_file).unlink(missing_ok=True)
                    current_file = removed_file
            
            # Apply subtitles
            if subtitles and subtitles.get("enabled"):
                if progress_callback:
                    progress_callback(60, "Aplicando legendas...")
                
                subtitled_file = str(self.temp_path / f"{video_id}_subtitled.mp4")
                await self.burn_subtitles(
                    current_file,
                    subtitled_file,
                    subtitles["segments"],
                    subtitles.get("style")
                )
                if current_file != temp_input:
                    Path(current_file).unlink(missing_ok=True)
                current_file = subtitled_file
            
            # Final output
            if progress_callback:
                progress_callback(80, "Finalizando vídeo...")
            
            output_file = str(self.temp_path / f"{video_id}_final.mp4")
            
            # Convert to MP4 if needed
            if not current_file.endswith(".mp4"):
                await self.convert_format(current_file, output_file, "mp4")
                Path(current_file).unlink(missing_ok=True)
            else:
                # Just rename/move
                Path(current_file).rename(output_file)
            
            # Get final video info
            info = await self.get_video_info(output_file)
            
            # Clean up temp input
            Path(temp_input).unlink(missing_ok=True)
            
            return {
                "output_path": output_file,
                "duration": info["duration"],
                "size": info["size"]
            }
            
        except Exception as e:
            logger.error(f"Video processing error: {e}", exc_info=True)
            raise
    
    async def _remove_silences(
        self,
        input_path: str,
        output_path: str,
        silences: List[Dict[str, Any]]
    ) -> str:
        """
        Remove silence segments from video
        """
        try:
            # Get video duration
            info = await self.get_video_info(input_path)
            duration = info["duration"]
            
            # Build segments to keep (inverse of silences)
            keep_segments = []
            last_end = 0
            
            for silence in sorted(silences, key=lambda x: x["start"]):
                if silence["start"] > last_end:
                    keep_segments.append((last_end, silence["start"]))
                last_end = silence["end"]
            
            # Add final segment
            if last_end < duration:
                keep_segments.append((last_end, duration))
            
            if not keep_segments:
                # No segments to keep, just copy
                Path(input_path).rename(output_path)
                return output_path
            
            # Create temp files for each segment
            segment_files = []
            for i, (start, end) in enumerate(keep_segments):
                segment_file = str(self.temp_path / f"segment_{i}.mp4")
                await self.trim_video(input_path, segment_file, start, end)
                segment_files.append(segment_file)
            
            # Concatenate segments
            if len(segment_files) == 1:
                Path(segment_files[0]).rename(output_path)
            else:
                # Create concat file
                concat_file = str(self.temp_path / "concat.txt")
                with open(concat_file, "w") as f:
                    for seg_file in segment_files:
                        f.write(f"file '{seg_file}'\n")
                
                # Concatenate
                cmd = [
                    "ffmpeg",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_file,
                    "-c", "copy",
                    "-y",
                    output_path
                ]
                
                await asyncio.to_thread(
                    subprocess.run,
                    cmd,
                    capture_output=True,
                    text=True,
                    check=True
                )
                
                # Clean up
                Path(concat_file).unlink(missing_ok=True)
                for seg_file in segment_files:
                    Path(seg_file).unlink(missing_ok=True)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Silence removal error: {e}", exc_info=True)
            raise

# Singleton instance
video_processing_service = VideoProcessingService()
