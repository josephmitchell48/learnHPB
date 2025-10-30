terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "random_pet" "resource_suffix" {
  length = 2
}

locals {
  name_prefix = "learnhpb-${random_pet.resource_suffix.id}"
}

resource "aws_s3_bucket" "documents" {
  bucket        = "${local.name_prefix}-documents"
  force_destroy = true

  lifecycle_rule {
    id      = "archive"
    enabled = true

    transition {
      days          = 60
      storage_class = "GLACIER_IR"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket" "assets" {
  bucket        = "${local.name_prefix}-assets"
  force_destroy = true

  lifecycle_rule {
    id      = "tiered"
    enabled = true

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

resource "aws_sqs_queue" "dicom_ingest" {
  name = "${local.name_prefix}-dicom-ingest"
}

resource "aws_db_subnet_group" "primary" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds"
  description = "Access to Postgres"
  vpc_id      = var.vpc_id

  ingress {
    description = "App access"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.app_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "${local.name_prefix}-postgres"
  engine                  = "postgres"
  engine_version          = "15"
  instance_class          = var.db_instance_class
  allocated_storage       = 50
  max_allocated_storage   = 200
  storage_type            = "gp3"
  publicly_accessible     = false
  db_subnet_group_name    = aws_db_subnet_group.primary.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  username                = var.db_username
  password                = var.db_password
  skip_final_snapshot     = false
  deletion_protection     = true
  backup_retention_period = 7
  multi_az                = false
}

resource "aws_iam_role" "ingest_lambda" {
  name = "${local.name_prefix}-ingest-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "ingest_permissions" {
  name = "${local.name_prefix}-ingest-policy"
  role = aws_iam_role.ingest_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = [
          "${aws_s3_bucket.documents.arn}/*",
          "${aws_s3_bucket.assets.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.dicom_ingest.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_lambda_function" "dicom_converter" {
  function_name = "${local.name_prefix}-dicom-converter"
  role          = aws_iam_role.ingest_lambda.arn
  handler       = "handler.main"
  runtime       = "python3.11"

  filename         = var.lambda_package_path
  source_code_hash = filebase64sha256(var.lambda_package_path)

  environment {
    variables = {
      TARGET_BUCKET = aws_s3_bucket.assets.bucket
      QUEUE_URL     = aws_sqs_queue.dicom_ingest.id
    }
  }
}

resource "aws_lambda_event_source_mapping" "queue_trigger" {
  event_source_arn                   = aws_sqs_queue.dicom_ingest.arn
  function_name                      = aws_lambda_function.dicom_converter.arn
  maximum_retry_attempts             = 2
  batch_size                         = 1
  enabled                            = true
  scaling_config { maximum_concurrency = 2 }
}

output "documents_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "assets_bucket" {
  value = aws_s3_bucket.assets.bucket
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}
