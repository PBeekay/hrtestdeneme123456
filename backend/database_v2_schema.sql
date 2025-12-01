-- Version 2.0 Schema Updates
-- Role-based system with employee features

USE hrtest_db;

-- Add role column if not exists (admin, employee)
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role ENUM('admin', 'employee') DEFAULT 'employee' AFTER department;

-- Work schedule table
CREATE TABLE IF NOT EXISTS work_schedule (
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

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
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

-- Dashboard widget preferences
CREATE TABLE IF NOT EXISTS dashboard_widgets (
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

-- Update existing admin user
UPDATE users SET user_role = 'admin' WHERE username = 'ikadmin';

-- Insert employee user (password: emp123)
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

-- Employee leave balance
INSERT INTO leave_balance (user_id, annual_leave, sick_leave, personal_leave, year)
VALUES (@emp_id, 15, 7, 2, 2025);

-- Employee tasks
INSERT INTO tasks (user_id, title, priority, due_date) VALUES
(@emp_id, 'Yeni Modül Geliştirme', 'high', '2025-12-01'),
(@emp_id, 'Kod Review Yap', 'medium', '2025-11-28'),
(@emp_id, 'Dokümantasyon Güncelle', 'low', '2025-12-15');

-- Employee performance
INSERT INTO performance_metrics (user_id, label, value, max_value) VALUES
(@emp_id, 'Tamamlanan Görevler', 15, 20),
(@emp_id, 'Kod Kalitesi', 92, 100),
(@emp_id, 'Zamanında Teslimat', 88, 100);

-- Employee work schedule (last 7 days)
INSERT INTO work_schedule (user_id, work_date, check_in, check_out, total_hours, status) VALUES
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:15:00', '18:00:00', 7.75, 'late'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:00:00', '18:00:00', 8.0, 'present'),
(@emp_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '13:00:00', 4.0, 'half_day'),
(@emp_id, CURDATE(), '09:00:00', NULL, NULL, 'present');

-- Employee leave requests
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status) VALUES
(@emp_id, 'annual', '2025-12-20', '2025-12-27', 5, 'Yılbaşı tatili', 'pending'),
(@emp_id, 'personal', '2025-11-29', '2025-11-29', 1, 'Kişisel işler', 'approved');

-- Default admin widgets
INSERT INTO dashboard_widgets (user_id, widget_type, position, is_visible) VALUES
(1, 'profile', 1, TRUE),
(1, 'leave_balance', 2, TRUE),
(1, 'pending_tasks', 3, TRUE),
(1, 'performance', 4, TRUE),
(1, 'task_details', 5, TRUE),
(1, 'announcements', 6, TRUE);

-- Default employee widgets
INSERT INTO dashboard_widgets (user_id, widget_type, position, is_visible) VALUES
(@emp_id, 'profile', 1, TRUE),
(@emp_id, 'work_days', 2, TRUE),
(@emp_id, 'leave_balance', 3, TRUE),
(@emp_id, 'leave_requests', 4, TRUE),
(@emp_id, 'pending_tasks', 5, TRUE),
(@emp_id, 'announcements', 6, TRUE);

SELECT '✅ Version 2.0 schema updated successfully!' AS status;
SELECT 'Admin: ikadmin / admin123' AS admin_account;
SELECT 'Employee: calisan / emp123' AS employee_account;

