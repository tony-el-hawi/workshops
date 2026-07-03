# ============================================================
# SNS — topic pour déclencher la conversion audio
# ============================================================

resource "aws_sns_topic" "new_posts" {
  name = local.sns_topic

  tags = {
    Project = var.project_name
  }
}

resource "aws_sns_topic_subscription" "convert_audio" {
  topic_arn = aws_sns_topic.new_posts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.convert_to_audio.arn
}
