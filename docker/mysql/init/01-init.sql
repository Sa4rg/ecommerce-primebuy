-- Create development database
CREATE DATABASE IF NOT EXISTS ecommerce_dev;

-- Create test database
CREATE DATABASE IF NOT EXISTS ecommerce_test;

-- Grant privileges
GRANT ALL PRIVILEGES ON ecommerce_dev.* TO 'ecommerce'@'%';
GRANT ALL PRIVILEGES ON ecommerce_test.* TO 'ecommerce'@'%';

FLUSH PRIVILEGES;
