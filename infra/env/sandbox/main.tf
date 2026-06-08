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

module "cognito" {
  source = "../../modules/cognito"

  project     = var.project
  environment = var.environment
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

  project              = var.project
  environment          = var.environment
  domain               = var.domain
  certificate_arn      = module.api_cert.certificate_arn
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.user_pool_client_id
  lambda_invoke_arn    = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
  aws_region           = var.aws_region
}

# Route 53 alias record for api.domain.com
module "api_dns" {
  source = "../../modules/route53"

  zone_id               = data.aws_route53_zone.this.zone_id
  names                 = ["api.${var.domain}"]
  target_domain_name    = module.api_gateway.api_domain_name
  target_hosted_zone_id = module.api_gateway.api_hosted_zone_id
  create_ipv6_records   = false
}

resource "aws_acm_certificate" "frontend" {
  provider                  = aws.us_east_1
  domain_name               = var.domain
  subject_alternative_names = ["www.${var.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  zone_id         = data.aws_route53_zone.this.zone_id
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
}

resource "aws_acm_certificate_validation" "frontend" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [
    for record in aws_route53_record.frontend_cert_validation : record.fqdn
  ]
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  project             = var.project
  environment         = var.environment
  domain_name         = var.domain
  aliases             = ["www.${var.domain}"]
  acm_certificate_arn = aws_acm_certificate_validation.frontend.certificate_arn
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

resource "aws_s3_bucket_cors_configuration" "audio" {
  bucket = module.audio_bucket.bucket_name

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = [
      "https://${var.domain}",
      "https://www.${var.domain}",
      "http://localhost:5173",
    ]
    max_age_seconds = 3600
  }
}
