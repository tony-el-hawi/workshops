# ============================================================
# Lambda — Packaging des fonctions
# ============================================================

data "archive_file" "new_post" {
  type        = "zip"
  source_file = "${path.module}/lambda/new_post.py"
  output_path = "${path.module}/.build/new_post.zip"
}

data "archive_file" "convert_to_audio" {
  type        = "zip"
  source_file = "${path.module}/lambda/convert_to_audio.py"
  output_path = "${path.module}/.build/convert_to_audio.zip"
}

data "archive_file" "get_post" {
  type        = "zip"
  source_file = "${path.module}/lambda/get_post.py"
  output_path = "${path.module}/.build/get_post.zip"
}

# ============================================================
# Lambda — PostReader_NewPost
# ============================================================

resource "aws_lambda_function" "new_post" {
  function_name    = "${var.project_name}-NewPost-${local.suffix}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "new_post.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  filename         = data.archive_file.new_post.output_path
  source_code_hash = data.archive_file.new_post.output_base64sha256

  environment {
    variables = {
      DB_TABLE_NAME = aws_dynamodb_table.posts.name
      SNS_TOPIC     = aws_sns_topic.new_posts.arn
    }
  }

  tags = {
    Project = var.project_name
  }
}

# ============================================================
# Lambda — PostReader_ConvertToAudio
# ============================================================

resource "aws_lambda_function" "convert_to_audio" {
  function_name    = "${var.project_name}-ConvertToAudio-${local.suffix}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "convert_to_audio.lambda_handler"
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 512
  filename         = data.archive_file.convert_to_audio.output_path
  source_code_hash = data.archive_file.convert_to_audio.output_base64sha256

  environment {
    variables = {
      DB_TABLE_NAME = aws_dynamodb_table.posts.name
      BUCKET_NAME   = aws_s3_bucket.audio.id
    }
  }

  tags = {
    Project = var.project_name
  }
}

# Permission pour SNS de déclencher ConvertToAudio
resource "aws_lambda_permission" "sns_invoke_convert" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.convert_to_audio.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.new_posts.arn
}

# ============================================================
# Lambda — PostReader_GetPost
# ============================================================

resource "aws_lambda_function" "get_post" {
  function_name    = "${var.project_name}-GetPost-${local.suffix}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "get_post.lambda_handler"
  runtime          = "python3.12"
  timeout          = 10
  filename         = data.archive_file.get_post.output_path
  source_code_hash = data.archive_file.get_post.output_base64sha256

  environment {
    variables = {
      DB_TABLE_NAME = aws_dynamodb_table.posts.name
    }
  }

  tags = {
    Project = var.project_name
  }
}
