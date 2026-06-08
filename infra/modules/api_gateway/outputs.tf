output "api_url" {
  value = "https://api.${var.domain}"
}

output "api_id" {
  value = aws_apigatewayv2_api.this.id
}

output "api_domain_name" {
  description = "AWS-generated target domain for the Route 53 alias record"
  value       = aws_apigatewayv2_domain_name.this.domain_name_configuration[0].target_domain_name
}

output "api_hosted_zone_id" {
  description = "Hosted zone ID for the API Gateway regional endpoint"
  value       = aws_apigatewayv2_domain_name.this.domain_name_configuration[0].hosted_zone_id
}
