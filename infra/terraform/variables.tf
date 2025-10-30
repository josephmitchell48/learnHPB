variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources"
  default     = "us-east-1"
}

variable "vpc_id" {
  type        = string
  description = "Target VPC ID"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for database"
}

variable "app_cidr_blocks" {
  type        = list(string)
  description = "CIDR blocks allowed to reach the database"
  default     = ["10.0.0.0/16"]
}

variable "db_username" {
  type        = string
  description = "Database master username"
}

variable "db_password" {
  type        = string
  description = "Database master password"
  sensitive   = true
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.t3.medium"
}

variable "lambda_package_path" {
  type        = string
  description = "Path to zipped Lambda deployment package"
}
