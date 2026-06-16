CREATE DATABASE IF NOT EXISTS hostbuster;
USE hostbuster;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    credits DECIMAL(10, 2) DEFAULT 1000.00,
    role ENUM('admin', 'client') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    default_cpu INT DEFAULT 1,
    default_ram INT DEFAULT 1024,
    default_storage INT DEFAULT 10
);

CREATE TABLE instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    app_id INT NOT NULL,
    instance_name VARCHAR(100) NOT NULL,
    cpu_allocated INT,
    ram_allocated INT,
    storage_allocated INT,
    ipv4_address VARCHAR(45),
    ipv6_address VARCHAR(45),
    status ENUM('deploying', 'running', 'stopped', 'error', 'deleted') DEFAULT 'deploying',
    scheduled_deletion_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE RESTRICT
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instance_id INT DEFAULT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('purchase', 'upgrade', 'renewal') DEFAULT 'purchase',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_instance FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('info', 'alert', 'error') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO applications (name, description, default_cpu, default_ram, default_storage) VALUES
('WordPress', 'CMS pour blogs et sites web', 1, 1024, 10),
('Minecraft Java Edition', 'Serveur de jeu sandbox', 2, 4096, 20),
('ODOO', 'Solution ERP pour entreprise', 2, 2048, 15),
('GLPI', 'Gestion de parc informatique et helpdesk', 1, 1024, 10);
