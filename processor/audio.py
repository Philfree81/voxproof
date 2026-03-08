"""
Acoustic feature extraction using OpenSMILE + Resemblyzer.
Extracts both eGeMAPS (88 features, for charts) and ComParE (6373 features, for session hash).
Resemblyzer d-vector (256 dim) is used for the stable voice identity hash.
Audio decoding via PyAV (bundled ffmpeg codecs — no system ffmpeg required).
"""

import hashlib
import io
import os
import tempfile
import numpy as np
import av
import opensmile
from resemblyzer import VoiceEncoder, preprocess_wav

_encoder: VoiceEncoder | None = None


def _get_encoder() -> VoiceEncoder:
    """Lazy singleton — loads the GE2E model once."""
    global _encoder
    if _encoder is None:
        _encoder = VoiceEncoder()
    return _encoder


def _decode_audio(audio_bytes: bytes) -> tuple[np.ndarray, int]:
    """
    Decode any audio format (webm, ogg, mp4, wav…) to a float32 numpy array
    using PyAV (bundled codecs, no system ffmpeg needed).
    Returns (signal, sample_rate) where signal shape is (channels, samples).
    """
    if not audio_bytes or len(audio_bytes) < 512:
        raise ValueError(f'Audio data too small ({len(audio_bytes) if audio_bytes else 0} bytes) — recording may be incomplete')

    # Write to a temp file: webm from MediaRecorder has no SeekHead at start,
    # so FFmpeg needs real file access to seek and parse the container correctly.
    tmp_fd, tmp_path = tempfile.mkstemp(suffix='.webm')
    try:
        with os.fdopen(tmp_fd, 'wb') as f:
            f.write(audio_bytes)

        try:
            container = av.open(tmp_path)
        except av.FFmpegError as e:
            raise ValueError(f'Cannot decode audio ({len(audio_bytes)} bytes): {e}')

        audio_streams = [s for s in container.streams if s.type == 'audio']
        if not audio_streams:
            container.close()
            raise ValueError('No audio stream found in the recording')

        stream = audio_streams[0]
        sample_rate = stream.codec_context.sample_rate

        frames = []
        for frame in container.decode(stream):
            arr = frame.to_ndarray()           # (channels, samples) float32 or int16
            if arr.dtype != np.float32:
                arr = arr.astype(np.float32) / np.iinfo(arr.dtype).max
            frames.append(arr)

        container.close()

        if not frames:
            raise ValueError('Audio decoded but contains no frames — recording too short')

        signal = np.concatenate(frames, axis=1)  # (channels, total_samples)

        if signal.shape[1] < sample_rate:
            raise ValueError(f'Recording too short: {signal.shape[1] / sample_rate:.1f}s (minimum 1s required)')

        return signal, sample_rate

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def extract_features(audio_bytes: bytes, filename: str) -> dict:
    """
    Extract eGeMAPS and ComParE features from a single audio file.
    Returns dict with 'egemaps' and 'compare' numpy arrays.
    """
    signal, sample_rate = _decode_audio(audio_bytes)

    # eGeMAPS — 88 interpretable features
    smile_egemaps = opensmile.Smile(
        feature_set=opensmile.FeatureSet.eGeMAPSv02,
        feature_level=opensmile.FeatureLevel.Functionals,
    )
    egemaps_df = smile_egemaps.process_signal(signal, sample_rate)
    egemaps = egemaps_df.values[0]  # shape (88,)

    # ComParE — 6373 features (for hash)
    smile_compare = opensmile.Smile(
        feature_set=opensmile.FeatureSet.ComParE_2016,
        feature_level=opensmile.FeatureLevel.Functionals,
    )
    compare_df = smile_compare.process_signal(signal, sample_rate)
    compare = compare_df.values[0]  # shape (6373,)

    return {
        'egemaps': egemaps,
        'compare': compare,
        'egemaps_columns': list(egemaps_df.columns),
    }


def compute_acoustic_hash(compare_features_list: list[np.ndarray]) -> str:
    """
    Compute a stable SHA-256 hash from 5 ComParE feature vectors.
    """
    combined = np.concatenate(compare_features_list)
    combined = np.nan_to_num(combined, nan=0.0, posinf=0.0, neginf=0.0)
    raw_bytes = combined.astype(np.float32).tobytes()
    return hashlib.sha256(raw_bytes).hexdigest()


def aggregate_egemaps(egemaps_list: list[np.ndarray]) -> np.ndarray:
    """Average eGeMAPS features across the 5 recordings."""
    stacked = np.stack(egemaps_list, axis=0)
    return np.nan_to_num(np.mean(stacked, axis=0), nan=0.0)


def compute_voice_hash(audio_bytes_list: list[bytes]) -> str:
    """
    Compute a stable, speaker-discriminative voice identity hash.

    Algorithm:
      1. Decode each audio to mono float32 via PyAV
      2. preprocess_wav: resample to 16kHz, normalize amplitude
      3. embed_utterance: GE2E neural net → d-vector (256 dim)
      4. Majority-vote sign per dimension across all recordings:
            bit_i = 1 if majority of recordings have emb[i] > 0, else 0
         → 256 bits stable across sessions of the same speaker
      5. SHA-256 of those 256 bits → 64-char hex hash

    Why majority vote over all 256 dims (not top-128 by |abs|):
      - High-|abs| dims are speaker-INDEPENDENT (population bias) → same for everyone
      - Discriminative speaker identity lives in ALL 256 dims, including small ones
      - Majority vote over 5 recordings suppresses per-session noise
    """
    encoder = _get_encoder()
    embeddings = []

    for audio_bytes in audio_bytes_list:
        signal, sr = _decode_audio(audio_bytes)
        mono = signal.mean(axis=0)  # (samples,) float32 mono
        wav = preprocess_wav(mono, source_sr=sr)
        emb = encoder.embed_utterance(wav)  # (256,) float32
        embeddings.append(emb)

    embeddings_arr = np.stack(embeddings, axis=0)  # (N, 256)

    # Centroid: mean of all d-vectors
    centroid = embeddings_arr.mean(axis=0)  # (256,)

    # Majority vote on signs for the hash
    sign_matrix = (embeddings_arr > 0).astype(np.uint8)  # (N, 256)
    votes = sign_matrix.sum(axis=0)  # (256,)
    majority_bits = (votes > len(audio_bytes_list) / 2).astype(np.uint8)  # (256,)
    voice_hash = hashlib.sha256(majority_bits.tobytes()).hexdigest()

    return voice_hash, centroid.tolist()  # centroid as list of 256 floats
