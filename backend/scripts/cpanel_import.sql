-- MariaDB Database Setup Script (cPanel Compatible)
-- Import this file AFTER creating the database in cPanel

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
    phone VARCHAR(20) NULL,
    manager INT NULL,
    location VARCHAR(100) NULL,
    start_date DATE NULL,
    status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
    user_role ENUM('admin', 'hr_specialist', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_user_status (status),
    INDEX idx_user_manager (manager)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

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
    created_by INT NULL,
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

-- Work Schedule table
CREATE TABLE IF NOT EXISTS work_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_date DATE NOT NULL,
    check_in TIME NULL,
    check_out TIME NULL,
    total_hours FLOAT DEFAULT 0,
    status ENUM('present', 'absent', 'late', 'leave') DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Dashboard Widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    position INT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    settings JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_widget (user_id, widget_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Asset Categories table
CREATE TABLE IF NOT EXISTS asset_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Employee Assets table
CREATE TABLE IF NOT EXISTS employee_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    category_id INT NULL,
    asset_name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    description TEXT,
    assigned_date DATETIME NOT NULL,
    return_date DATETIME NULL,
    document_url VARCHAR(500),
    document_filename VARCHAR(255),
    status ENUM('assigned', 'returned', 'lost', 'maintenance') DEFAULT 'assigned',
    notes TEXT,
    assigned_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Insert demo user (password: admin123)
-- Using INSERT IGNORE to prevent duplicate error if re-run
INSERT IGNORE INTO users (username, password_hash, full_name, email, role, department, avatar, user_role, status) 
VALUES (
    'ikadmin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyDQ2xPHRvPW',
    'Ayşe Yılmaz',
    'ayse.yilmaz@sirket.com',
    'Kıdemli İK Müdürü',
    'İnsan Kaynakları',
    'AY',
    'admin',
    'active'
);

-- Get the user ID
SET @user_id = (SELECT id FROM users WHERE username = 'ikadmin' LIMIT 1);

-- Insert leave balance
INSERT IGNORE INTO leave_balance (user_id, annual_leave, sick_leave, personal_leave, year)
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
INSERT INTO announcements (title, category, announcement_date, is_active) VALUES
('Yılbaşı Kutlaması - 20 Aralık', 'Etkinlik', '2025-11-25', TRUE),
('Yeni Sağlık Sigortası Planları Mevcut', 'Yan Haklar', '2025-11-24', TRUE),
('Ofis Kapalı - Yılbaşı Haftası', 'Tatil', '2025-11-20', TRUE);

-- Insert Asset Categories
INSERT IGNORE INTO asset_categories (name, icon) VALUES 
('Bilgisayar', 'laptop'),
('Telefon', 'smartphone'),
('Tablet', 'tablet'),
('Monitör', 'monitor'),
('Araç', 'car'),
('Diğer', 'package');
