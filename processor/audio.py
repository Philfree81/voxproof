"""
Acoustic feature extraction using OpenSMILE.
Extracts both eGeMAPS (88 features, for charts) and ComParE (6373 features, for hash).
Audio decoding via PyAV (bundled ffmpeg codecs — no system ffmpeg required).
"""

import hashlib
import io
import numpy as np
import av
import opensmile


def _decode_audio(audio_bytes: bytes) -> tuple[np.ndarray, int]:
    """
    Decode any audio format (webm, ogg, mp4, wav…) to a float32 numpy array
    using PyAV (bundled codecs, no system ffmpeg needed).
    Returns (signal, sample_rate) where signal shape is (channels, samples).
    """
    container = av.open(io.BytesIO(audio_bytes))
    stream = next(s for s in container.streams if s.type == 'audio')
    sample_rate = stream.codec_context.sample_rate

    frames = []
    for frame in container.decode(stream):
        arr = frame.to_ndarray()           # (channels, samples) float32 or int16
        if arr.dtype != np.float32:
            arr = arr.astype(np.float32) / np.iinfo(arr.dtype).max
        frames.append(arr)

    container.close()
    signal = np.concatenate(frames, axis=1)  # (channels, total_samples)
    return signal, sample_rate


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
