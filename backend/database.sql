CREATE DATABASE IF NOT EXISTS aidms;
USE aidms;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  avatar VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_id VARCHAR(50) UNIQUE, -- e.g., 'doc1', 'doc2' to map easily
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  type VARCHAR(20),
  tags JSON,
  relevance INT DEFAULT 90,
  uploaded_at DATE,
  author VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Pending',
  size VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wf_id VARCHAR(50) UNIQUE, -- e.g., 'wf1'
  document_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  days_waiting INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  type VARCHAR(20),
  size VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
