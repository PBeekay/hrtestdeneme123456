-- MariaDB Database Setup Script
-- Run this in HeidiSQL or MySQL command line

-- Create database
CREATE DATABASE IF NOT EXISTS hrtest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;

-- Create user (MariaDB compatible syntax)
CREATE USER IF NOT EXISTS 'hrapp'@'localhost' IDENTIFIED BY 'hrpass123';

-- Grant privileges
GRANT ALL PRIVILEGES ON hrtest_db.* TO 'hrapp'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE hrtest_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    avatar VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;


-- =========================================================
-- ÇALIŞAN ÖZLÜK DOSYASI ALANLARI VE TABLOLARI
-- (employee_schema.sql içeriği, yeni kurulumlar için entegre edildi)
-- =========================================================

-- Users tablosuna ek alanlar (telefon, yönetici, lokasyon, başlangıç tarihi, durum)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER email;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS manager INT NULL AFTER department;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(100) NULL AFTER manager;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS start_date DATE NULL AFTER location;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active' AFTER start_date;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_role ENUM('admin', 'hr_specialist', 'employee') DEFAULT 'employee' AFTER status;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_manager ON users(manager);

-- Çalışan Notları Tablosu
CREATE TABLE IF NOT EXISTS employee_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    note TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_employee (employee_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Çalışan Belgeleri Tablosu
CREATE TABLE IF NOT EXISTS employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('contract', 'performance', 'discipline', 'other') NOT NULL DEFAULT 'other',
    document_url VARCHAR(500) NULL,
    document_filename VARCHAR(255) NULL,
    status ENUM('approved', 'pending', 'rejected') DEFAULT 'pending',
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Leave balance table
CREATE TABLE IF NOT EXISTS leave_balance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    annual_leave INT DEFAULT 0,
    sick_leave INT DEFAULT 0,
    personal_leave INT DEFAULT 0,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_year (user_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'personal') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_days FLOAT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATETIME NOT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(100) NOT NULL,
    value INT NOT NULL,
    max_value INT NOT NULL,
    period VARCHAR(20) DEFAULT 'current',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_period (user_id, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(50) NOT NULL,
    announcement_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_date (is_active, announcement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Insert demo user (password: admin123)
INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role) 
VALUES (
    'ikadmin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyDQ2xPHRvPW',
    'Ayşe Yılmaz',
    'ayse.yilmaz@sirket.com',
    'Kıdemli İK Müdürü',
    'İnsan Kaynakları',
    'AY',
    'admin'
);

-- Get the user ID
SET @user_id = LAST_INSERT_ID();

-- Insert leave balance
INSERT INTO leave_balance (user_id, annual_leave, sick_leave, personal_leave, year)
VALUES (@user_id, 12, 5, 3, 2025);

-- Insert tasks
INSERT INTO tasks (user_id, title, priority, due_date) VALUES
(@user_id, '4. Çeyrek Performans Değerlendirmesini Tamamla', 'high', '2025-11-30'),
(@user_id, 'Masraf Raporunu Gönder', 'medium', '2025-12-05'),
(@user_id, 'Ekip Toplantısı Hazırlığı', 'low', '2025-12-10');

-- Insert performance metrics
INSERT INTO performance_metrics (user_id, label, value, max_value) VALUES
(@user_id, 'Tamamlanan Projeler', 8, 10),
(@user_id, 'Ekip İşbirliği', 95, 100),
(@user_id, 'Hedef Başarısı', 87, 100);

-- Insert announcements
INSERT INTO announcements (title, category, announcement_date) VALUES
('Yılbaşı Kutlaması - 20 Aralık', 'Etkinlik', '2025-11-25'),
('Yeni Sağlık Sigortası Planları Mevcut', 'Yan Haklar', '2025-11-24'),
('Ofis Kapalı - Yılbaşı Haftası', 'Tatil', '2025-11-20');

-- Show success message
SELECT 'Database setup completed successfully!' as message;
SELECT 'Demo user: ikadmin / Password: admin123' as credentials;

