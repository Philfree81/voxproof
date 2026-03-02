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
