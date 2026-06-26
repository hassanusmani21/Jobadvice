#!/usr/bin/env python3

from __future__ import annotations

import argparse
import io
import re
import sys
import wave
import warnings
from dataclasses import dataclass
from typing import Iterable

import numpy as np
from kokoro import KPipeline

warnings.filterwarnings("ignore")

SAMPLE_RATE = 24000
MAX_SEGMENT_LENGTH = 240
VOICE_CONFIG = {
    "en": {
        "lang_code": "a",
        "speed": 0.97,
        "voice": "af_heart",
    },
    "hi": {
        "lang_code": "h",
        "speed": 0.94,
        "voice": "hf_alpha",
    },
}
SENTENCE_PATTERN = re.compile(r"[^.!?]+[.!?]+|[^.!?]+$", re.UNICODE)


@dataclass(frozen=True)
class KokoroVoice:
    key: str
    lang_code: str
    voice: str
    speed: float


def resolve_voice(locale: str) -> KokoroVoice:
    normalized_locale = locale.strip().lower()
    if normalized_locale.startswith("hi"):
        config = VOICE_CONFIG["hi"]
        return KokoroVoice("hi", config["lang_code"], config["voice"], config["speed"])

    if normalized_locale.startswith("en"):
        config = VOICE_CONFIG["en"]
        return KokoroVoice("en", config["lang_code"], config["voice"], config["speed"])

    raise ValueError(f"unsupported_locale:{locale}")


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def split_long_sentence(sentence: str, max_length: int) -> list[str]:
    chunks: list[str] = []
    words = [word for word in sentence.split(" ") if word]
    current_chunk = ""

    for word in words:
        next_chunk = f"{current_chunk} {word}".strip()
        if len(next_chunk) > max_length and current_chunk:
            chunks.append(current_chunk)
            current_chunk = word
            continue

        current_chunk = next_chunk

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def chunk_text(text: str, max_length: int = MAX_SEGMENT_LENGTH) -> list[str]:
    normalized_text = normalize_text(text)
    if not normalized_text:
        return []

    sentences = [
        sentence.strip()
        for sentence in SENTENCE_PATTERN.findall(normalized_text)
        if sentence.strip()
    ]
    if not sentences:
        return [normalized_text]

    chunks: list[str] = []
    current_chunk = ""

    for sentence in sentences:
        if len(sentence) > max_length:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
            chunks.extend(split_long_sentence(sentence, max_length))
            continue

        next_chunk = f"{current_chunk} {sentence}".strip()
        if len(next_chunk) > max_length and current_chunk:
            chunks.append(current_chunk)
            current_chunk = sentence
            continue

        current_chunk = next_chunk

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def concatenate_audio(segments: Iterable[np.ndarray]) -> np.ndarray:
    audio_segments = [segment for segment in segments if segment.size > 0]
    if not audio_segments:
        return np.zeros(1, dtype=np.float32)

    silence = np.zeros(int(SAMPLE_RATE * 0.12), dtype=np.float32)
    combined: list[np.ndarray] = []

    for index, segment in enumerate(audio_segments):
        combined.append(segment.astype(np.float32, copy=False))
        if index < len(audio_segments) - 1:
            combined.append(silence)

    return np.concatenate(combined)


def synthesize_audio(text: str, locale: str) -> np.ndarray:
    voice = resolve_voice(locale)
    pipeline = KPipeline(
        lang_code=voice.lang_code,
        repo_id="hexgrad/Kokoro-82M",
    )
    segments = chunk_text(text)
    audio_segments: list[np.ndarray] = []

    for segment in segments:
        for _, _, audio in pipeline(
            segment,
            voice=voice.voice,
            speed=voice.speed,
            split_pattern=r"\n+",
        ):
            if audio is None:
                continue

            if hasattr(audio, "detach"):
                audio_segments.append(audio.detach().cpu().numpy())
            elif hasattr(audio, "numpy"):
                audio_segments.append(audio.numpy())
            else:
                audio_segments.append(np.asarray(audio))

    return concatenate_audio(audio_segments)


def encode_wav(audio: np.ndarray) -> bytes:
    pcm_audio = np.clip(audio, -1, 1)
    pcm_bytes = (pcm_audio * 32767).astype(np.int16).tobytes()
    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(pcm_bytes)

    return buffer.getvalue()


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--locale", default="en-IN")
    parser.add_argument("--text", required=True)
    return parser


def main() -> int:
    parser = build_argument_parser()
    args = parser.parse_args()

    try:
        normalized_text = normalize_text(args.text)
        if not normalized_text:
            raise ValueError("missing_text")

        audio = synthesize_audio(normalized_text, args.locale)
        sys.stdout.buffer.write(encode_wav(audio))
        return 0
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2
    except Exception as error:  # pragma: no cover - runtime safeguard
        print(f"kokoro_generation_failed:{error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
