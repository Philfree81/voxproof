"""
Chart generation from eGeMAPS acoustic features.
Produces:
  1. Radar chart — 8 acoustic dimensions
  2. Bar chart   — detailed acoustic properties
"""

import io
import base64
import numpy as np
import matplotlib
matplotlib.use('Agg')  # non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import librosa
import librosa.display


# ─── eGeMAPS feature groups ─────────────────────────────────────────────────
# These indices correspond to eGeMAPSv02 functional features (88 total).
# We extract 8 key acoustic dimensions for the radar chart.

RADAR_DIMENSIONS = {
    'Loudness':      slice(0, 5),    # loudness mean/std/percentiles
    'Pitch (F0)':    slice(5, 11),   # F0 semitone mean/std/percentiles
    'Jitter':        slice(20, 23),  # jitter local/DDP
    'Shimmer':       slice(23, 26),  # shimmer local
    'HNR':           slice(26, 29),  # harmonics-to-noise ratio
    'Formant F1':    slice(35, 40),  # F1 frequency/bandwidth
    'Formant F2':    slice(40, 45),  # F2 frequency/bandwidth
    'Spectral':      slice(55, 65),  # spectral flux, centroid, slope
}

BAR_GROUPS = {
    'Énergie vocale':     slice(0, 5),
    'Hauteur tonale':     slice(5, 11),
    'Qualité vocale':     slice(20, 29),
    'Structure formantique': slice(35, 50),
    'Profil spectral':    slice(55, 70),
    'Rythme & pauses':    slice(75, 88),
}

BRAND_COLOR = '#4F46E5'  # indigo-600
ACCENT_COLOR = '#7C3AED'  # violet-600


def _normalize(values: np.ndarray) -> float:
    """Normalize an array to [0,1] and return the mean."""
    if len(values) == 0:
        return 0.0
    v = np.nan_to_num(values)
    vmin, vmax = v.min(), v.max()
    if vmax == vmin:
        return 0.5
    return float(np.mean((v - vmin) / (vmax - vmin)))


def _to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                facecolor=fig.get_facecolor())
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def generate_radar_chart(egemaps: np.ndarray) -> str:
    """
    Generate a radar (spider) chart from 8 acoustic dimensions.
    Returns base64-encoded PNG.
    """
    labels = list(RADAR_DIMENSIONS.keys())
    values = [_normalize(egemaps[s]) for s in RADAR_DIMENSIONS.values()]
    values_closed = values + [values[0]]

    angles = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist()
    angles_closed = angles + [angles[0]]

    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True),
                           facecolor='#FAFAFA')
    ax.set_facecolor('#F5F5FF')

    # Grid styling
    ax.set_xticks(angles)
    ax.set_xticklabels(labels, size=9, color='#374151')
    ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0])
    ax.set_yticklabels(['0.2', '0.4', '0.6', '0.8', '1.0'], size=7, color='#9CA3AF')
    ax.set_ylim(0, 1)
    ax.grid(color='#E5E7EB', linestyle='--', linewidth=0.8)

    # Fill
    ax.fill(angles_closed, values_closed, alpha=0.25, color=BRAND_COLOR)
    ax.plot(angles_closed, values_closed, color=BRAND_COLOR, linewidth=2.5)
    ax.scatter(angles, values, color=BRAND_COLOR, s=50, zorder=5)

    ax.set_title('Profil acoustique vocal', size=13, fontweight='bold',
                 color='#1F2937', pad=20)

    plt.tight_layout()
    result = _to_base64(fig)
    plt.close(fig)
    return result


def generate_spectrogram(audio_bytes_list: list[bytes]) -> str:
    """
    Generate a mel spectrogram from the 5 audio recordings (concatenated).
    Returns base64-encoded PNG.
    Uses librosa for mel filterbank computation.
    """
    from audio import _decode_audio  # import here to avoid circular dependency at module load

    signals = []
    target_sr = 16000
    for audio_bytes in audio_bytes_list:
        signal, sr = _decode_audio(audio_bytes)
        mono = signal.mean(axis=0).astype(np.float32)
        # Resample to 16kHz for consistency
        if sr != target_sr:
            mono = librosa.resample(mono, orig_sr=sr, target_sr=target_sr)
        signals.append(mono)

    # Concatenate all 5 recordings with a short silence gap
    silence = np.zeros(int(target_sr * 0.3), dtype=np.float32)
    combined = np.concatenate([s for pair in zip(signals, [silence] * 5) for s in pair][:-1])

    # Mel spectrogram
    S = librosa.feature.melspectrogram(
        y=combined, sr=target_sr,
        n_mels=128, fmax=8000,
        n_fft=1024, hop_length=256,
    )
    S_db = librosa.power_to_db(S, ref=np.max)

    # ── Spectral metrics ────────────────────────────────────────────────────
    mel_freqs = librosa.mel_frequencies(n_mels=128, fmax=8000)
    low_mask  = mel_freqs < 500
    mid_mask  = (mel_freqs >= 500) & (mel_freqs < 3000)
    high_mask = mel_freqs >= 3000

    total_energy = float(S.sum())
    if total_energy > 0:
        energie_grave_pct  = float(S[low_mask].sum()  / total_energy * 100)
        energie_medium_pct = float(S[mid_mask].sum()  / total_energy * 100)
        energie_aigu_pct   = float(S[high_mask].sum() / total_energy * 100)
    else:
        energie_grave_pct = energie_medium_pct = energie_aigu_pct = 0.0

    centroide_hz = float(np.mean(librosa.feature.spectral_centroid(y=combined, sr=target_sr)))
    rolloff_hz   = float(np.mean(librosa.feature.spectral_rolloff(y=combined, sr=target_sr, roll_percent=0.85)))
    rms = librosa.feature.rms(y=combined).flatten()
    variabilite  = float(min(rms.std() / (rms.mean() + 1e-8) / 2.0, 1.0))

    metrics = {
        'centroide_hz':      round(centroide_hz,      1),
        'rolloff_hz':        round(rolloff_hz,        1),
        'energie_grave_pct': round(energie_grave_pct, 1),
        'energie_medium_pct':round(energie_medium_pct,1),
        'energie_aigu_pct':  round(energie_aigu_pct,  1),
        'variabilite':       round(variabilite,        3),
    }

    # Plot
    fig, ax = plt.subplots(figsize=(10, 4), facecolor='#0f172a')
    ax.set_facecolor('#0f172a')

    img = librosa.display.specshow(
        S_db, sr=target_sr, hop_length=256,
        x_axis='time', y_axis='mel', fmax=8000,
        cmap='magma', ax=ax,
    )

    cbar = fig.colorbar(img, ax=ax, format='%+2.0f dB', pad=0.01)
    cbar.ax.yaxis.set_tick_params(color='#94a3b8', labelsize=8)
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='#94a3b8')
    cbar.outline.set_edgecolor('#334155')

    ax.set_title('Empreinte spectrale vocale', fontsize=13, fontweight='bold',
                 color='#f1f5f9', pad=10)
    ax.set_xlabel('Temps (s)', fontsize=9, color='#94a3b8')
    ax.set_ylabel('Fréquence (Hz)', fontsize=9, color='#94a3b8')
    ax.tick_params(colors='#94a3b8', labelsize=8)
    for spine in ax.spines.values():
        spine.set_edgecolor('#334155')

    plt.tight_layout()
    result = _to_base64(fig)
    plt.close(fig)
    return result, metrics


def generate_properties_chart(egemaps: np.ndarray) -> str:
    """
    Generate a horizontal bar chart of 6 acoustic property groups.
    Returns base64-encoded PNG.
    """
    labels = list(BAR_GROUPS.keys())
    values = [_normalize(egemaps[s]) for s in BAR_GROUPS.values()]

    colors = [BRAND_COLOR, ACCENT_COLOR, '#0891B2', '#059669', '#D97706', '#DC2626']

    fig, ax = plt.subplots(figsize=(7, 4), facecolor='#FAFAFA')
    ax.set_facecolor('#FAFAFA')

    bars = ax.barh(labels, values, color=colors, alpha=0.85, height=0.55,
                   edgecolor='white', linewidth=1.5)

    # Value labels
    for bar, val in zip(bars, values):
        ax.text(min(val + 0.02, 0.98), bar.get_y() + bar.get_height() / 2,
                f'{val:.2f}', va='center', ha='left', fontsize=9, color='#374151')

    ax.set_xlim(0, 1.1)
    ax.set_xlabel('Score normalisé', fontsize=9, color='#6B7280')
    ax.set_title('Propriétés acoustiques détaillées', fontsize=13,
                 fontweight='bold', color='#1F2937', pad=12)
    ax.tick_params(axis='y', labelsize=9, colors='#374151')
    ax.tick_params(axis='x', labelsize=8, colors='#9CA3AF')
    ax.spines[['top', 'right', 'left']].set_visible(False)
    ax.spines['bottom'].set_color('#E5E7EB')
    ax.axvline(x=0, color='#E5E7EB', linewidth=1)

    plt.tight_layout()
    result = _to_base64(fig)
    plt.close(fig)
    return result
