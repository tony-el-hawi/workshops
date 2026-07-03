output "website_url" {
  description = "URL du site web statique hébergé sur S3"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "api_invoke_url" {
  description = "URL de base de l'API Gateway (stage)"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "audio_bucket_name" {
  description = "Nom du bucket S3 pour les fichiers audio"
  value       = aws_s3_bucket.audio.id
}

output "dynamodb_table_name" {
  description = "Nom de la table DynamoDB"
  value       = aws_dynamodb_table.posts.name
}
