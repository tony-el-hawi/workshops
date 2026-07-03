# ============================================================
# IAM — Rôle d'exécution pour les fonctions Lambda
# ============================================================

# --- Rôle commun pour les 3 Lambda ---
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-role-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })

  tags = {
    Project = var.project_name
  }
}

# --- CloudWatch Logs ---
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Politique custom : DynamoDB + SNS + S3 + Polly ---
resource "aws_iam_role_policy" "lambda_services" {
  name = "${var.project_name}-lambda-services"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDB"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.posts.arn,
          "${aws_dynamodb_table.posts.arn}/index/*"
        ]
      },
      {
        Sid      = "SNSPublish"
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [aws_sns_topic.new_posts.arn]
      },
      {
        Sid    = "S3Audio"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject"
        ]
        Resource = ["${aws_s3_bucket.audio.arn}/*"]
      },
      {
        Sid      = "Polly"
        Effect   = "Allow"
        Action   = ["polly:SynthesizeSpeech"]
        Resource = ["*"]
      }
    ]
  })
}
