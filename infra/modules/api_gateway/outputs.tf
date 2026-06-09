output "api_url" {
  value = "https://api.${var.domain}"
}

output "api_domain_name" {
  value = aws_api_gateway_domain_name.this.regional_domain_name
}

output "api_hosted_zone_id" {
  value = aws_api_gateway_domain_name.this.regional_zone_id
}
