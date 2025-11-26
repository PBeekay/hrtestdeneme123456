-- Quick fix for GSSAPI authentication error
-- Run this script as root user (MariaDB compatible)

-- Drop and recreate user with correct authentication
DROP USER IF EXISTS 'hrapp'@'localhost';

-- MariaDB compatible syntax
CREATE USER 'hrapp'@'localhost' IDENTIFIED BY 'hrpass123';

GRANT ALL PRIVILEGES ON hrtest_db.* TO 'hrapp'@'localhost';

FLUSH PRIVILEGES;

-- Verify the fix
SELECT user, host, plugin FROM mysql.user WHERE user='hrapp';

SELECT 'Authentication fixed!' as status;

