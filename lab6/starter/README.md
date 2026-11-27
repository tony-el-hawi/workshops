# Vault Keeper - Starter kit (Lab 6)

Toutes les instructions sont sur le site du lab. Suivez-le, il explique chaque
mission et chaque commande.

Contenu :

- `template.yaml` - l'infra SAM (se deploie telle quelle)
- `src/app.py` - la fonction Lambda du Vault Keeper
- `ask.sh` - parler au bot : `./ask.sh "Bonjour"`
- `score.py` - le scoreboard : `python3 score.py`
- `attacks.txt` - les 10 attaques du scoreboard

CloudShell est partage : travaillez dans `~/<trigramme>/starter` uniquement.
Deploiement : `sam deploy --guided --stack-name vault-keeper-<trigramme> --region eu-west-1`.
Ne lancez pas `sam build` (voir le site, Mission 0).
