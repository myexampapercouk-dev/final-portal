-- ============================================================
-- EDU PORTAL - MySQL Schema
-- Parent / Teacher / Admin portals
-- ============================================================

CREATE DATABASE IF NOT EXISTS edu_portal;
USE edu_portal;

-- ------------------------------------------------------------
-- USERS (shared login table for all 3 roles)
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('parent','teacher','admin') NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents are users with role='parent'. No extra table needed beyond users,
-- but we keep a thin table in case parent-specific fields are needed later.

-- ------------------------------------------------------------
-- CHILDREN (belongs to a parent)
-- ------------------------------------------------------------
CREATE TABLE children (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  dob DATE NOT NULL,
  target_exam VARCHAR(150),
  allergies VARCHAR(255),
  category VARCHAR(50) NOT NULL, -- e.g. '7+', '8+'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- TEACHERS -- users with role='teacher', added only by admin.
-- No self-registration route exists for this role.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- COURSES (created by admin)
-- ------------------------------------------------------------
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- CLASSES (belongs to a course, taught by one teacher)
-- ------------------------------------------------------------
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  teacher_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  timing DATETIME NOT NULL,
  material_url VARCHAR(500),
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Multi-select categories per class (e.g. a class open to both 7+ and 8+)
CREATE TABLE class_categories (
  class_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,
  PRIMARY KEY (class_id, category),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- CLASS REGISTRATIONS (a child registered for a class)
-- ------------------------------------------------------------
CREATE TABLE class_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  child_id INT NOT NULL,
  status ENUM('upcoming','attended','cancelled') DEFAULT 'upcoming',
  present TINYINT(1) DEFAULT NULL, -- set when teacher marks attendance
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  UNIQUE KEY uniq_class_child (class_id, child_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- FEEDBACK (teacher -> child, only for students marked present)
-- ------------------------------------------------------------
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  teacher_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES class_registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 1:1 CLASSES (scheduled by a teacher for a specific child)
-- ------------------------------------------------------------
CREATE TABLE one_on_one_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  teacher_id INT NOT NULL,
  topic VARCHAR(200),
  timing DATETIME NOT NULL,
  status ENUM('upcoming','completed','cancelled') DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- MOCK EXAMS (per child results/records)
-- ------------------------------------------------------------
CREATE TABLE mock_exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  exam_name VARCHAR(200) NOT NULL,
  exam_date DATE,
  score VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- INVOICES (one consolidated invoice per parent; record only, no payment gateway)
-- ------------------------------------------------------------
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('unpaid','paid') DEFAULT 'unpaid', -- manually marked, cash only
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  child_id INT NOT NULL,
  class_id INT NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Seed an initial admin so someone can log in and add teachers/courses.
-- Password below is bcrypt hash for "Admin@123" -- change after first login.
-- ------------------------------------------------------------
-- INSERT INTO users (role, name, email, password_hash) VALUES
-- ('admin', 'Super Admin', 'admin@example.com', '$2b$10$REPLACE_WITH_REAL_HASH');
