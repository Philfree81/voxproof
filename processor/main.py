"""
VoxProof Acoustic Processor — FastAPI microservice.
Receives 5 audio files, extracts acoustic features, generates charts and PDF.
"""

import base64
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from audio import extract_features, compute_acoustic_hash, aggregate_egemaps, compute_voice_hash
from charts import generate_radar_chart, generate_properties_chart, generate_spectrogram
from pdf_gen import generate_certificate

app = FastAPI(title='VoxProof Processor', version='1.0.0')


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/process')
async def process_session(
    audio1: UploadFile = File(...),
    audio2: UploadFile = File(...),
    audio3: UploadFile = File(...),
    audio4: UploadFile = File(...),
    audio5: UploadFile = File(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    language: str = Form('fr'),
    text_set_index: int = Form(0),
    text_set_name: str = Form(''),
    tx_hash: str = Form('pending'),
    block_number: int = Form(0),
    valid_until: str = Form(''),
    kyc_verified: bool = Form(True),
):
    """
    Process 5 audio recordings:
    1. Extract eGeMAPS + ComParE features
    2. Compute acoustic hash (SHA-256 of ComParE features)
    3. Generate radar chart + properties chart
    4. Generate PDF certificate
    Returns JSON with hash, charts (base64), and PDF (base64).
    """
    audios = [audio1, audio2, audio3, audio4, audio5]
    egemaps_list = []
    compare_list = []
    raw_bytes_list = []  # kept for Resemblyzer (UploadFile.read() is one-shot)

    for i, audio in enumerate(audios):
        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail=f'Audio {i+1} is empty')
        raw_bytes_list.append(content)
        try:
            features = extract_features(content, audio.filename or f'audio{i+1}.webm')
            egemaps_list.append(features['egemaps'])
            compare_list.append(features['compare'])
        except Exception as e:
            raise HTTPException(status_code=422, detail=f'Feature extraction failed for audio {i+1}: {str(e)}')

    # Session hash from ComParE (unique per recording)
    acoustic_hash = compute_acoustic_hash(compare_list)

    # Voice identity hash from Resemblyzer (stable across sessions for same person)
    try:
        voice_hash = compute_voice_hash(raw_bytes_list)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'Voice hash computation failed: {str(e)}')

    # Average eGeMAPS for charts
    avg_egemaps = aggregate_egemaps(egemaps_list)

    # Generate charts
    try:
        radar_b64 = generate_radar_chart(avg_egemaps)
        properties_b64 = generate_properties_chart(avg_egemaps)
        spectrogram_b64, spectrogram_metrics = generate_spectrogram(raw_bytes_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Chart generation failed: {str(e)}')

    # Generate PDF
    try:
        valid_until_dt = datetime.fromisoformat(valid_until.replace('Z', '+00:00')) if valid_until else None
        pdf_bytes = generate_certificate(
            first_name=first_name,
            last_name=last_name,
            email=email,
            acoustic_hash=acoustic_hash,
            voice_hash=voice_hash,
            tx_hash=tx_hash,
            block_number=block_number,
            language=language,
            text_set_index=text_set_index,
            text_set_name=text_set_name,
            radar_b64=radar_b64,
            properties_b64=properties_b64,
            spectrogram_b64=spectrogram_b64,
            anchored_at=datetime.utcnow(),
            valid_until=valid_until_dt,
            kyc_verified=kyc_verified,
        )
        pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'PDF generation failed: {str(e)}')

    return JSONResponse({
        'acoustic_hash': acoustic_hash,
        'voice_hash': voice_hash,
        'radar_chart': radar_b64,
        'properties_chart': properties_b64,
        'spectrogram': spectrogram_b64,
        'spectrogram_metrics': spectrogram_metrics,
        'pdf': pdf_b64,
    })
