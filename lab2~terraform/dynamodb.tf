# ============================================================
# DynamoDB — table des posts
# ============================================================

resource "aws_dynamodb_table" "posts" {
  name         = local.dynamodb_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "user"
    type = "S"
  }

  global_secondary_index {
    name            = "user-index"
    hash_key        = "user"
    projection_type = "ALL"
  }

  tags = {
    Project = var.project_name
  }
}
