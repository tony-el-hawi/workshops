variable "aws_region" {
  description = "Région AWS de déploiement"
  type        = string
  default     = "eu-west-3"
}

variable "project_name" {
  description = "Préfixe pour nommer les ressources"
  type        = string
  default     = "tts-lab"
}

variable "user_name" {
  description = "Identifiant utilisateur pour le site web (ex: jsmith)"
  type        = string
  default     = "student"
}
