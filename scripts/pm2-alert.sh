#!/bin/bash

BREVO_API_KEY="${BREVO_API_KEY:-your_brevo_api_key_here}"
FROM_EMAIL="noreply@voxproof.com"
FROM_NAME="VoxProof Monitor"
TO_EMAIL="ptriem@gmail.com"

APPS=("voxproof-backend" "voxproof-frontend" "voxproof-processor")
FAILED=()

for app in "${APPS[@]}"; do
  status=$(~/.npm-global/bin/pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p['name'] == '$app':
        print(p['pm2_env']['status'])
        break
")
  if [ "$status" != "online" ]; then
    FAILED+=("$app (status: ${status:-inconnu})")
  fi
done

if [ ${#FAILED[@]} -eq 0 ]; then
  exit 0
fi

SUBJECT="[VoxProof] Alerte crash serveur"
BODY="Un ou plusieurs services VoxProof sont hors ligne :\n\n"
for f in "${FAILED[@]}"; do
  BODY+="- $f\n"
done
BODY+="\nServeur : $(hostname) — $(date '+%d/%m/%Y %H:%M:%S')\n\nConnectez-vous via SSH pour investiguer."

curl -s -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "api-key: $BREVO_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"sender\": {\"name\": \"$FROM_NAME\", \"email\": \"$FROM_EMAIL\"},
    \"to\": [{\"email\": \"$TO_EMAIL\"}],
    \"subject\": \"$SUBJECT\",
    \"textContent\": \"$(echo -e "$BODY")\"
  }" > /dev/null

# WhatsApp via Twilio
TWILIO_SID="${TWILIO_SID:-your_twilio_sid_here}"
TWILIO_TOKEN="${TWILIO_TOKEN:-your_twilio_token_here}"
TWILIO_FROM="whatsapp:+14155238886"
TWILIO_TO="whatsapp:+33678808527"
WA_MSG="[VoxProof] Alerte crash : $(IFS=,; echo "${FAILED[*]}") — $(date '+%d/%m %H:%M')"

curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/Messages.json" \
  -u "$TWILIO_SID:$TWILIO_TOKEN" \
  --data-urlencode "From=$TWILIO_FROM" \
  --data-urlencode "To=$TWILIO_TO" \
  --data-urlencode "Body=$WA_MSG" > /dev/null
