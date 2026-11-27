#!/usr/bin/env bash
# ask.sh - envoie un message au Vault Keeper et affiche sa reponse.
#
#   ./ask.sh "Bonjour"
#
# Lit l'URL ChatEndpoint depuis les Outputs de votre stack.
# Nom de la stack : variable STACK, sinon stack_name du samconfig.toml
# de ce dossier (ecrit par sam deploy --guided).
# Region : variable AWS_REGION (defaut: eu-west-1).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
STACK="${STACK:-}"
if [ -z "$STACK" ] && [ -f "$HERE/samconfig.toml" ]; then
  STACK=$(sed -n 's/^stack_name *= *"\(.*\)"/\1/p' "$HERE/samconfig.toml" | head -n 1)
fi
if [ -z "$STACK" ]; then
  echo "Nom de stack inconnu. Recollez le bloc de reprise du site (export STACK=vault-keeper-<trigramme>)." >&2
  exit 1
fi
REGION="${AWS_REGION:-eu-west-1}"
MESSAGE="${1:-Bonjour}"

ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$STACK" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ChatEndpoint'].OutputValue" \
  --output text)

if [ -z "$ENDPOINT" ] || [ "$ENDPOINT" = "None" ]; then
  echo "ChatEndpoint introuvable pour la stack '$STACK' (region $REGION)." >&2
  echo "Verifiez que la stack est deployee et que STACK est bien exporte." >&2
  exit 1
fi

# Construit le JSON proprement (gere les guillemets / caracteres speciaux).
PAYLOAD=$(python3 -c 'import json,sys; print(json.dumps({"message": sys.argv[1]}))' "$MESSAGE")

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
| python3 -c 'import json,sys
d = json.load(sys.stdin)
print(d.get("reply", ""))
print("[stopReason: %s]" % d.get("stopReason", ""), file=sys.stderr)'
