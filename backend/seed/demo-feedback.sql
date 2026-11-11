-- Demo data for checking the latest changes. Run AFTER sample-data.sql, and AFTER the
-- backend has been redeployed (the redeploy adds homework.total_questions).
-- Safe to run more than once.

-- 1. Give the demo homework a question count (this drives the "Give feedback" dropdown)
UPDATE homework SET total_questions = 8 WHERE file_path LIKE 'seed-%';

-- 2. Mark Week 1 of both demo courses as completed + approved, with the demo children present
UPDATE classes SET status = 'completed', feedback_status = 'approved'
WHERE title IN ('English Masterclass - Week 1', 'Maths and Reasoning - Week 1');

UPDATE class_registrations cr
JOIN classes c ON c.id = cr.class_id
JOIN children ch ON ch.id = cr.child_id
SET cr.status = 'attended', cr.present = 1
WHERE c.title IN ('English Masterclass - Week 1', 'Maths and Reasoning - Week 1')
  AND ch.name LIKE '% Demo';

-- 3. Teacher feedback for each child (different text per child, so you can see the dashboard follow the selected child)
INSERT INTO feedback (registration_id, subject, teacher_id, content)
SELECT cr.id, s.subject, c.teacher_id,
       CONCAT(SUBSTRING_INDEX(ch.name, ' ', 1), ' ', s.line)
FROM class_registrations cr
JOIN classes c ON c.id = cr.class_id
JOIN children ch ON ch.id = cr.child_id
JOIN (
  SELECT 'Maths' AS subject, 'is confident with subtraction and showed neat working.' AS line
  UNION ALL SELECT 'English', 'read aloud clearly and is building a wider vocabulary.'
  UNION ALL SELECT 'Behaviour', 'listened well and helped the others in the group.'
) AS s
WHERE c.title IN ('English Masterclass - Week 1', 'Maths and Reasoning - Week 1')
  AND ch.name LIKE '% Demo'
  AND NOT EXISTS (SELECT 1 FROM feedback f WHERE f.registration_id = cr.id AND f.subject = s.subject);
