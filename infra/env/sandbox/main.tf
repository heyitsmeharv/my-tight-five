module "dynamodb" {
  source = "../../modules/dynamodb"

  project     = var.project
  environment = var.environment
  table_name  = "${var.project}-${var.environment}"
}

module "audio_bucket" {
  source = "../../modules/s3"

  project            = var.project
  environment        = var.environment
  bucket_name        = "${var.project}-${var.environment}-audio"
  versioning_enabled = false

  cors_rules = [{
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = [
      "https://${var.domain}",
      "https://www.${var.domain}",
      "http://localhost:5173",
    ]
    max_age_seconds = 3600
  }]
}

module "cognito" {
  source = "../../modules/cognito"

  project     = var.project
  environment = var.environment
}

module "lambda" {
  source = "../../modules/lambda"

  project            = var.project
  environment        = var.environment
  table_name         = module.dynamodb.table_name
  dynamodb_table_arn = module.dynamodb.table_arn
  audio_bucket_name  = module.audio_bucket.bucket_name
  audio_bucket_arn   = module.audio_bucket.bucket_arn
}

module "api_cert" {
  source = "../../modules/acm"

  project         = var.project
  environment     = var.environment
  domain_name     = "api.${var.domain}"
  route53_zone_id = data.aws_route53_zone.this.zone_id
}

module "api_gateway" {
  source = "../../modules/api_gateway"

  project               = var.project
  environment           = var.environment
  domain                = var.domain
  certificate_arn       = module.api_cert.certificate_arn
  cognito_user_pool_arn = module.cognito.user_pool_arn
  lambda_invoke_arn     = module.lambda.invoke_arn
  lambda_function_name  = module.lambda.function_name
}

module "api_dns" {
  source = "../../modules/route53"

  zone_id               = data.aws_route53_zone.this.zone_id
  names                 = ["api.${var.domain}"]
  target_domain_name    = module.api_gateway.api_domain_name
  target_hosted_zone_id = module.api_gateway.api_hosted_zone_id
  create_ipv6_records   = false
}

module "frontend_cert" {
  source    = "../../modules/acm"
  providers = { aws = aws.us_east_1 }

  project                   = var.project
  environment               = var.environment
  domain_name               = var.domain
  subject_alternative_names = ["www.${var.domain}"]
  route53_zone_id           = data.aws_route53_zone.this.zone_id
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  project             = var.project
  environment         = var.environment
  domain_name         = var.domain
  aliases             = ["www.${var.domain}"]
  acm_certificate_arn = module.frontend_cert.certificate_arn
  spa_mode            = true
  wait_for_deployment = false
}

module "frontend_dns" {
  source = "../../modules/route53"

  zone_id               = data.aws_route53_zone.this.zone_id
  names                 = [var.domain, "www.${var.domain}"]
  target_domain_name    = module.cloudfront.distribution_domain_name
  target_hosted_zone_id = module.cloudfront.distribution_hosted_zone_id
  create_ipv6_records   = true
}

