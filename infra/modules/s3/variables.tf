variable "project" { type = string }
variable "environment" { type = string }
variable "bucket_name" { type = string }
variable "versioning_enabled" {
  type    = bool
  default = false
}

variable "cors_rules" {
  type = list(object({
    allowed_headers = list(string)
    allowed_methods = list(string)
    allowed_origins = list(string)
    max_age_seconds = optional(number, 3600)
  }))
  default = []
}
