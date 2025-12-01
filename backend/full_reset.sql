-- Tam sıfırlama ve yeniden kurulum
USE hrtest_db;

-- Önce tüm tabloları temizle (foreign key sırasına göre)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS dashboard_widgets;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS work_schedule;
DROP TABLE IF EXISTS performance_metrics;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS leave_balance;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Tabloları yeniden oluştur

-- 1. Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    avatar VARCHAR(10),
    user_role ENUM('admin', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 2. Leave balance table
CREATE TABLE leave_balance (
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

-- 3. Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATE NOT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 4. Performance metrics table
CREATE TABLE performance_metrics (
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

-- 5. Announcements table
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(50) NOT NULL,
    announcement_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_date (is_active, announcement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 6. Work schedule table
CREATE TABLE work_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    total_hours DECIMAL(4,2),
    status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 7. Leave requests table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'personal') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 8. Dashboard widgets table
CREATE TABLE dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    position INT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_widget (user_id, widget_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 9. Sessions table
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- VERİLERİ EKLE

-- Admin kullanıcı (ikadmin / admin123)
INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role) 
VALUES (
    'ikadmin',
    '$2b$12$enZGrHo90EqhoEwi4tbEDuVXjuBU55tMypmyGQn/ZKSdo588VcH/O',
    'Ayşe Yılmaz',
    'ayse.yilmaz@sirket.com',
    'Kıdemli İK Müdürü',
    'İnsan Kaynakları',
    'AY',
    'admin'
);

SET @admin_id = LAST_INSERT_ID();

-- Employee kullanıcı (calisan / emp123)
INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role) 
VALUES (
    'calisan',
    '$2b$12$OqzP5wXPY.wZGN4hVBHrCeFZJQn8WUC8XMQvhbmYDMK3PqZxJ.MJq',
    'Mehmet Demir',
    'mehmet.demir@sirket.com',
    'Yazılım Geliştirici',
    'Yazılım Departmanı',
    'MD',
    'employee'
);

SET @emp_id = LAST_INSERT_ID();

-- Duyurular (user_id gerektirmez)
INSERT INTO announcements (title, category, announcement_date) VALUES
('Yılbaşı Kutlaması - 20 Aralık', 'Etkinlik', '2025-11-25'),
('Yeni Sağlık Sigortası Planları Mevcut', 'Yan Haklar', '2025-11-24'),
('Ofis Kapalı - Yılbaşı Haftası', 'Tatil', '2025-11-20');

-- ADMIN VERİLERİ
INSERT INTO leave_balance (user_id, annual_leave, sick_leave, personal_leave, year)
VALUES (@admin_id, 12, 5, 3, 2025);

INSERT INTO tasks (user_id, title, priority, due_date) VALUES
(@admin_id, '4. Çeyrek Performans Değerlendirmesini Tamamla', 'high', '2025-11-30'),
(@admin_id, 'Masraf Raporunu Gönder', 'medium', '2025-12-05'),
(@admin_id, 'Ekip Toplantısı Hazırlığı', 'low', '2025-12-10');

INSERT INTO performance_metrics (user_id, label, value, max_value) VALUES
(@admin_id, 'Tamamlanan Projeler', 8, 10),
(@admin_id, 'Ekip İşbirliği', 95, 100),
(@admin_id, 'Hedef Başarısı', 87, 100);

INSERT INTO dashboard_widgets (user_id, widget_type, position, is_visible) VALUES
(@admin_id, 'profile', 1, TRUE),
(@admin_id, 'leave_balance', 2, TRUE),
(@admin_id, 'pending_tasks', 3, TRUE),
(@admin_id, 'performance', 4, TRUE),
(@admin_id, 'task_details', 5, TRUE),
(@admin_id, 'announcements', 6, TRUE);

-- EMPLOYEE VERİLERİ
INSERT INTO leave_balance (user_id, annual_leave, sick_leave, personal_leave, year)
VALUES (@emp_id, 15, 7, 2, 2025);

INSERT INTO tasks (user_id, title, priority, due_date) VALUES
(@emp_id, 'Yeni Modül Geliştirme', 'high', '2025-12-01'),
(@emp_id, 'Kod Review Yap', 'medium', '2025-11-28'),
(@emp_id, 'Dokümantasyon Güncelle', 'low', '2025-12-15');

INSERT INTO performance_metrics (user_id, label, value, max_value) VALUES
(@emp_id, 'Tamamlanan Görevler', 15, 20),
(@emp_id, 'Kod Kalitesi', 92, 100),
(@emp_id, 'Zamanında Teslimat', 88, 100);

INSERT INTO work_schedule (user_id, work_date, check_in, check_out, total_hours, status) VALUES
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:15:00', '18:00:00', 7.75, 'late'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '13:00:00', 4.0, 'half_day'),
(@emp_id, CURDATE(), '09:00:00', NULL, NULL, 'present');

INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status) VALUES
(@emp_id, 'annual', '2025-12-20', '2025-12-27', 5, 'Yılbaşı tatili', 'pending'),
(@emp_id, 'personal', '2025-11-29', '2025-11-29', 1, 'Kişisel işler', 'approved');

INSERT INTO dashboard_widgets (user_id, widget_type, position, is_visible) VALUES
(@emp_id, 'profile', 1, TRUE),
(@emp_id, 'work_days', 2, TRUE),
(@emp_id, 'leave_balance', 3, TRUE),
(@emp_id, 'leave_requests', 4, TRUE),
(@emp_id, 'pending_tasks', 5, TRUE),
(@emp_id, 'announcements', 6, TRUE);

-- Başarı mesajı
SELECT '✅ Database tamamen sıfırlandı ve yeniden kuruldu!' AS sonuc;
SELECT '' AS bos;
SELECT '👤 HESAPLAR:' AS baslik;
SELECT 'Admin: ikadmin / admin123' AS admin_hesap;
SELECT 'Çalışan: calisan / emp123' AS calisan_hesap;

