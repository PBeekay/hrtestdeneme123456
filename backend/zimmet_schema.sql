-- ================================================
-- ZİMMET EŞYA TAKİP SİSTEMİ
-- Asset Assignment Tracking System
-- ================================================

-- Zimmet Kategorileri Tablosu
CREATE TABLE IF NOT EXISTS asset_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT '📦',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Zimmet Eşyaları Tablosu
CREATE TABLE IF NOT EXISTS employee_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    serial_number VARCHAR(100),
    description TEXT,
    assigned_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    document_url VARCHAR(500),
    document_filename VARCHAR(255),
    status ENUM('active', 'returned', 'damaged', 'lost') DEFAULT 'active',
    assigned_by INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_assigned_date (assigned_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek Kategoriler
INSERT INTO asset_categories (name, description, icon) VALUES
('Elektronik', 'Bilgisayar, laptop, telefon vb.', '💻'),
('Araç', 'Şirket araçları', '🚗'),
('Mobilya', 'Masa, sandalye, dolap vb.', '🪑'),
('Yazılım Lisansı', 'Yazılım ve lisanslar', '🔐'),
('Ekipman', 'Ofis ekipmanları', '🖨️'),
('Diğer', 'Diğer zimmet eşyaları', '📦');

-- Örnek Zimmet Kayıtları (ikadmin için test verileri)
-- NOT: employee_id 1 = admin, 2 = çalışan olduğunu varsayıyoruz
INSERT INTO employee_assets (
    employee_id, 
    asset_name, 
    category_id, 
    serial_number,
    description,
    assigned_date, 
    document_url,
    document_filename,
    status, 
    assigned_by,
    notes
) VALUES
(1, 'Dell Latitude 5520 Laptop', 1, 'DL5520-2024-001', 'Intel i7, 16GB RAM, 512GB SSD', '2024-01-15', 'https://example.com/docs/zimmet-001.pdf', 'zimmet-laptop-001.pdf', 'active', 1, 'İyi durumda teslim edildi'),
(1, 'iPhone 13 Pro', 1, 'IMEI-354887114234567', '256GB, Gri Renk', '2024-02-01', 'https://example.com/docs/zimmet-002.pdf', 'zimmet-phone-001.pdf', 'active', 1, 'Şirket hattı ile birlikte'),
(1, 'Microsoft Office 365 Lisansı', 4, 'O365-ENT-2024-001', 'Enterprise E3 Lisansı', '2024-01-01', 'https://example.com/docs/zimmet-003.pdf', 'zimmet-license-001.pdf', 'active', 1, 'Yıllık lisans');

-- Zimmet İstatistikleri için View
CREATE OR REPLACE VIEW asset_summary AS
SELECT 
    u.id as employee_id,
    u.full_name as employee_name,
    COUNT(CASE WHEN ea.status = 'active' THEN 1 END) as active_assets,
    COUNT(CASE WHEN ea.status = 'returned' THEN 1 END) as returned_assets,
    COUNT(*) as total_assets,
    MAX(ea.assigned_date) as last_assignment_date
FROM users u
LEFT JOIN employee_assets ea ON u.id = ea.employee_id
GROUP BY u.id, u.full_name;

-- ================================================
-- KULLANIM:
-- 1. HeidiSQL'de bu dosyayı çalıştırın
-- 2. Tabloların oluşturulduğunu kontrol edin
-- 3. Backend'i yeniden başlatın
-- ================================================

