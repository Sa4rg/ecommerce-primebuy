-- MySQL Initialization Script
-- Creates both development and test databases
-- Grants privileges to ecommerce user on both databases

-- Create test database
CREATE DATABASE IF NOT EXISTS ecommerce_test;

-- Grant privileges to ecommerce user on both databases
GRANT ALL PRIVILEGES ON ecommerce_dev.* TO 'ecommerce'@'%';
GRANT ALL PRIVILEGES ON ecommerce_test.* TO 'ecommerce'@'%';

-- Apply changes
FLUSH PRIVILEGES;
