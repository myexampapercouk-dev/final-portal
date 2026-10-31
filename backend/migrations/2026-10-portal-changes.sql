-- Run once (phpMyAdmin > SQL tab) on the live database.
-- Adds everything needed for: teacher-added children, class venue/price/end time,
-- admin-approved feedback, homework, admin notifications and yearly category upgrades.

-- Children added by a teacher have no parent yet and no date of birth
ALTER TABLE children MODIFY parent_id INT NULL;
ALTER TABLE children MODIFY dob DATE NULL;
ALTER TABLE children ADD COLUMN added_by_teacher_id INT NULL;

-- Columns that older databases may be missing (safe to skip if you get "Duplicate column")
ALTER TABLE feedback ADD COLUMN subject VARCHAR(40) NULL AFTER registration_id;
ALTER TABLE one_on_one_classes ADD COLUMN end_timing DATETIME NULL;

-- Class booking details + feedback approval state
ALTER TABLE classes ADD COLUMN end_timing DATETIME NULL;
ALTER TABLE classes ADD COLUMN venue VARCHAR(200) NULL;
ALTER TABLE classes ADD COLUMN price DECIMAL(10,2) NULL;
ALTER TABLE classes ADD COLUMN feedback_status ENUM('none','pending','approved') NOT NULL DEFAULT 'none';
-- Classes that were already completed keep their feedback visible to parents
UPDATE classes SET feedback_status = 'approved' WHERE status = 'completed';

-- Homework (question PDF + optional answer PDF) per class
CREATE TABLE IF NOT EXISTS homework (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  answer_file_name VARCHAR(255) NULL,
  answer_file_path VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Admin notification bell (new child added, feedback awaiting approval, ...)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body VARCHAR(500) NULL,
  link VARCHAR(255) NULL,
  ref_id INT NULL,
  user_id INT NULL,
  status ENUM('open','done','dismissed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Small key/value store (used for the yearly 1 September category upgrade)
CREATE TABLE IF NOT EXISTS system_meta (
  k VARCHAR(50) PRIMARY KEY,
  v VARCHAR(255) NOT NULL
);
