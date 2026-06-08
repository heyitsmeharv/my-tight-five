variable "project" {
  type        = string
  description = "Project name used for naming and tagging."
}

variable "environment" {
  type        = string
  description = "Environment name (matches folder under infra/env/)."
}

variable "aws_region" {
  type        = string
  description = "AWS region to deploy into."
  default     = "eu-west-2"
}

variable "domain" {
  type        = string
  description = "Root domain name, registered via Route 53 Domains before applying."
}
