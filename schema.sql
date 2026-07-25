CREATE DATABASE IF NOT EXISTS otp_forward_system;
USE otp_forward_system;

-- Admin/User Table with 256-bit secure password hashing support
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Reports Table
CREATE TABLE IF NOT EXISTS sms_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_date VARCHAR(100),
    date_range_val VARCHAR(100),
    phone_number VARCHAR(50),
    cli VARCHAR(100),
    client_name VARCHAR(100),
    sms_content TEXT,
    status VARCHAR(50) DEFAULT 'Official',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
