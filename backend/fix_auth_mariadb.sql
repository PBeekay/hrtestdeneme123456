-- MariaDB için düzeltilmiş authentication fix
-- HeidiSQL'de çalıştırın

-- Önce kullanıcıyı sil (varsa)
DROP USER IF EXISTS 'hrapp'@'localhost';

-- MariaDB uyumlu syntax ile oluştur
CREATE USER 'hrapp'@'localhost' IDENTIFIED BY 'hrpass123';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON hrtest_db.* TO 'hrapp'@'localhost';

FLUSH PRIVILEGES;

-- Kontrol et
SELECT user, host, plugin FROM mysql.user WHERE user='hrapp';

SELECT 'Kullanıcı başarıyla oluşturuldu!' as status;

