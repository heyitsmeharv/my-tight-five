variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "table_name" {
  type = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "audio_bucket_name" {
  type = string
}

variable "audio_bucket_arn" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_client_id" {
  type = string
}

variable "cors_allow_origins" {
  type    = list(string)
  default = []
}
