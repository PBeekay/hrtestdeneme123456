
CREATE TABLE asset_categories (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	icon VARCHAR(50), 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name)
)

;


CREATE TABLE reminders (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(200) NOT NULL, 
	date DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE users (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	username VARCHAR(50) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	full_name VARCHAR(100) NOT NULL, 
	first_name VARCHAR(50), 
	last_name VARCHAR(50), 
	salary FLOAT, 
	avatar VARCHAR(255), 
	created_at DATETIME NOT NULL DEFAULT now(), 
	updated_at DATETIME, 
	type VARCHAR(50) NOT NULL, 
	is_active BOOL NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE announcements (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(200) NOT NULL, 
	content TEXT NOT NULL, 
	category VARCHAR(50) NOT NULL, 
	created_by INTEGER, 
	is_active BOOL NOT NULL, 
	announcement_date DATETIME NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;


CREATE TABLE assistant_managers (
	id INTEGER NOT NULL, 
	department VARCHAR(100), 
	PRIMARY KEY (id), 
	FOREIGN KEY(id) REFERENCES users (id)
)

;


CREATE TABLE audit_logs (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	action VARCHAR(100) NOT NULL, 
	details TEXT, 
	ip_address VARCHAR(45), 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE dashboard_widgets (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	widget_type VARCHAR(50) NOT NULL, 
	position INTEGER NOT NULL, 
	is_visible BOOL NOT NULL, 
	settings JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE documents (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(200) NOT NULL, 
	file_path VARCHAR(500) NOT NULL, 
	uploaded_by INTEGER NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
)

;


CREATE TABLE employees (
	id INTEGER NOT NULL, 
	department VARCHAR(100), 
	start_date DATETIME, 
	phone VARCHAR(20), 
	location VARCHAR(100), 
	manager_id INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id) REFERENCES users (id), 
	FOREIGN KEY(manager_id) REFERENCES users (id)
)

;


CREATE TABLE hr_managers (
	id INTEGER NOT NULL, 
	department VARCHAR(100), 
	start_date DATETIME, 
	hr_cert_no VARCHAR(50), 
	PRIMARY KEY (id), 
	FOREIGN KEY(id) REFERENCES users (id)
)

;


CREATE TABLE leave_requests (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	leave_type VARCHAR(50) NOT NULL, 
	start_date DATETIME NOT NULL, 
	end_date DATETIME NOT NULL, 
	total_days FLOAT NOT NULL, 
	reason TEXT, 
	status ENUM('pending','approved','rejected') NOT NULL, 
	rejection_reason TEXT, 
	approved_by INTEGER, 
	approved_at DATETIME, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(approved_by) REFERENCES users (id)
)

;


CREATE TABLE managers (
	id INTEGER NOT NULL, 
	department VARCHAR(100), 
	admin_level INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id) REFERENCES users (id)
)

;


CREATE TABLE notifications (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	title VARCHAR(100) NOT NULL, 
	message TEXT NOT NULL, 
	is_read BOOL NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE owners (
	id INTEGER NOT NULL, 
	department VARCHAR(100), 
	start_date DATETIME, 
	share_rate FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id) REFERENCES users (id)
)

;


CREATE TABLE sessions (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	token VARCHAR(500) NOT NULL, 
	expires_at DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (token)
)

;


CREATE TABLE tasks (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(200) NOT NULL, 
	description TEXT, 
	priority ENUM('low','medium','high') NOT NULL, 
	status ENUM('pending','in_progress','completed') NOT NULL, 
	due_date DATETIME, 
	created_at DATETIME NOT NULL, 
	user_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE employee_assets (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	employee_id INTEGER NOT NULL, 
	category_id INTEGER NOT NULL, 
	asset_name VARCHAR(100) NOT NULL, 
	serial_number VARCHAR(100), 
	description TEXT, 
	assigned_by INTEGER, 
	assigned_date DATETIME NOT NULL, 
	return_date DATETIME, 
	status VARCHAR(50) NOT NULL, 
	document_url VARCHAR(255), 
	document_filename VARCHAR(255), 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(employee_id) REFERENCES employees (id), 
	FOREIGN KEY(category_id) REFERENCES asset_categories (id), 
	FOREIGN KEY(assigned_by) REFERENCES users (id)
)

;


CREATE TABLE leave_balance (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	year INTEGER NOT NULL, 
	annual_leave INTEGER NOT NULL, 
	sick_leave INTEGER NOT NULL, 
	personal_leave INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES employees (id)
)

;


CREATE TABLE work_schedule (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	work_date DATETIME NOT NULL, 
	check_in DATETIME, 
	check_out DATETIME, 
	total_hours FLOAT, 
	status VARCHAR(50) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES employees (id)
)

;

