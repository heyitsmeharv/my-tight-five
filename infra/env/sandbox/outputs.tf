output "app_url" {
  description = "Frontend URL"
  value       = "https://${var.domain}"
}

output "frontend_bucket_name" {
  description = "S3 bucket name for the frontend - used by CI/CD to sync build artifacts"
  value       = module.cloudfront.bucket_name
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID - used by CI/CD to invalidate cache after deploy"
  value       = module.cloudfront.distribution_id
}

output "frontend_distribution_url" {
  description = "CloudFront URL usable immediately, before custom domain DNS propagates"
  value       = module.cloudfront.distribution_url
}

output "api_url" {
  description = "API base URL - injected as VITE_API_URL during the frontend build"
  value       = module.api_gateway.api_url
}

output "cognito_user_pool_id" {
  description = "Used to create your first user: aws cognito-idp admin-create-user ..."
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID - injected as VITE_COGNITO_CLIENT_ID during the frontend build"
  value       = module.cognito.user_pool_client_id
}
