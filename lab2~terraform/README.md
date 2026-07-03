# Lab 2 — Terraform : Application Serverless Text-to-Speech

Ce lab déploie **de bout en bout** l'application serverless Text-to-Speech du Lab 2
via **Terraform**. Un seul `terraform apply` crée toutes les ressources et héberge
le site statique sur S3.

## Architecture déployée

- **Amazon S3** — bucket pour les MP3 + bucket pour le site web statique
- **Amazon DynamoDB** — table `TextToSpeech-posts` (clé `id`, GSI `user-index`)
- **Amazon SNS** — topic `TextToSpeech-new_posts`
- **AWS Lambda** — 3 fonctions (NewPost, ConvertToAudio, GetPost)
- **Amazon API Gateway** (REST) — expose les Lambda en POST/GET + CORS
- **Amazon Polly** — synthèse vocale (utilisé par ConvertToAudio)
- **IAM** — rôles et politiques pour chaque Lambda

## Prérequis

- Terraform >= 1.5
- AWS CLI configuré (profil ou variables d'environnement)
- Python 3.10+ (pour packager les Lambda, le zip est fait par Terraform)

## Utilisation

```bash
cd lab2~terraform
terraform init
terraform plan
terraform apply
```

## Outputs

| Output | Description |
|--------|-------------|
| `website_url` | URL du site web statique hébergé sur S3 |
| `api_invoke_url` | URL de base de l'API Gateway (stage) |
| `audio_bucket_name` | Nom du bucket S3 des fichiers MP3 |

## Nettoyage

```bash
terraform destroy
```

> **Note :** le bucket audio doit être vidé avant `destroy`. Terraform tentera
> de le faire via `force_destroy = true`.
