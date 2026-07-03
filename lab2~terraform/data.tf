data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  account_id       = data.aws_caller_identity.current.account_id
  region           = data.aws_region.current.name
  suffix           = random_id.suffix.hex
  dynamodb_table   = "${var.project_name}-posts-${local.suffix}"
  sns_topic        = "${var.project_name}-new-posts-${local.suffix}"
  audio_bucket     = "${var.project_name}-audio-${local.suffix}"
  website_bucket   = "${var.project_name}-website-${local.suffix}"
  api_name         = "${var.project_name}-api"
  stage_name       = "prod"
}
