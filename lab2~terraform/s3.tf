# ============================================================
# S3 — bucket pour les fichiers audio MP3
# ============================================================

resource "aws_s3_bucket" "audio" {
  bucket        = local.audio_bucket
  force_destroy = true

  tags = {
    Project = var.project_name
  }
}

resource "aws_s3_bucket_ownership_controls" "audio" {
  bucket = aws_s3_bucket.audio.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "audio" {
  bucket = aws_s3_bucket.audio.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "audio_public_read" {
  bucket = aws_s3_bucket.audio.id

  depends_on = [aws_s3_bucket_public_access_block.audio]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.audio.arn}/*"
      }
    ]
  })
}

# ============================================================
# S3 — bucket pour le site web statique
# ============================================================

resource "aws_s3_bucket" "website" {
  bucket        = local.website_bucket
  force_destroy = true

  tags = {
    Project = var.project_name
  }
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_ownership_controls" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website_public_read" {
  bucket = aws_s3_bucket.website.id

  depends_on = [aws_s3_bucket_public_access_block.website]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

# ============================================================
# Upload des fichiers du site web statique
# ============================================================

resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  source       = "${path.module}/website/index.html"
  content_type = "text/html"
  etag         = filemd5("${path.module}/website/index.html")
}

resource "aws_s3_object" "styles_css" {
  bucket       = aws_s3_bucket.website.id
  key          = "styles.css"
  source       = "${path.module}/website/styles.css"
  content_type = "text/css"
  etag         = filemd5("${path.module}/website/styles.css")
}

resource "aws_s3_object" "scripts_js" {
  bucket       = aws_s3_bucket.website.id
  key          = "scripts.js"
  content      = templatefile("${path.module}/website/scripts.js", {
    api_endpoint = aws_api_gateway_stage.main.invoke_url
    user_name    = var.user_name
  })
  content_type = "application/javascript"
  etag         = md5(templatefile("${path.module}/website/scripts.js", {
    api_endpoint = aws_api_gateway_stage.main.invoke_url
    user_name    = var.user_name
  }))
}
