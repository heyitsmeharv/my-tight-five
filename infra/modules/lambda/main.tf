resource "aws_iam_role" "lambda" {
  name = "${var.project}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ]
      Resource = var.dynamodb_table_arn
    }]
  })
}

resource "aws_iam_role_policy" "s3_audio" {
  name = "s3-audio-access"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      Resource = "${var.audio_bucket_arn}/audio/*"
    }]
  })
}

resource "aws_iam_role_policy" "s3_video" {
  name = "s3-video-access"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      Resource = "${var.video_bucket_arn}/video/*"
    }]
  })
}

# --- Profile Lambda (public Function URL, read-only) ---

resource "aws_iam_role" "profile_lambda" {
  name = "${var.project}-${var.environment}-profile-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "profile_basic" {
  role       = aws_iam_role.profile_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "profile_dynamodb_read" {
  name = "dynamodb-read"
  role = aws_iam_role.profile_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Query"]
      Resource = var.dynamodb_table_arn
    }]
  })
}

resource "aws_iam_role_policy" "profile_s3_video_read" {
  name = "s3-video-read"
  role = aws_iam_role.profile_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = "${var.video_bucket_arn}/video/*"
    }]
  })
}

# --- Zip bundles ---

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/functions/api"
  output_path = "${path.module}/api.zip"
}

data "archive_file" "profile" {
  type        = "zip"
  source_dir  = "${path.module}/functions/profile"
  output_path = "${path.module}/profile.zip"
}

# --- Lambda functions ---

resource "aws_lambda_function" "api" {
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  function_name    = "${var.project}-${var.environment}-api"
  description      = "Authenticated API — CRUD for ideas, jokes, sets and videos; issues pre-signed S3 URLs for audio/video uploads"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 256
  timeout          = 30

  environment {
    variables = {
      TABLE_NAME      = var.table_name
      AUDIO_BUCKET    = var.audio_bucket_name
      VIDEO_BUCKET    = var.video_bucket_name
      FRONTEND_ORIGIN = "https://${var.domain}"
    }
  }
}

resource "aws_lambda_function" "profile" {
  filename         = data.archive_file.profile.output_path
  source_code_hash = data.archive_file.profile.output_base64sha256
  function_name    = "${var.project}-${var.environment}-profile"
  description      = "Public showreel — returns a user's public videos with short-lived signed S3 URLs; no auth required"
  role             = aws_iam_role.profile_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 128
  timeout          = 10

  environment {
    variables = {
      TABLE_NAME   = var.table_name
      VIDEO_BUCKET = var.video_bucket_name
    }
  }
}

resource "aws_lambda_function_url" "profile" {
  function_name      = aws_lambda_function.profile.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["Content-Type"]
    max_age           = 3600
  }
}

resource "aws_lambda_permission" "profile_url_public" {
  statement_id           = "FunctionURLAllowPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.profile.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "profile_invoke_public" {
  statement_id  = "AllowPublicInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.profile.function_name
  principal     = "*"
}
