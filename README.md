# Edu Portal — Parent / Teacher / Admin

Stack: **React (CRA)** frontend, **Node.js/Express** backend, **MySQL** database.

## Structure
```
edu-portal/
  backend/     Express API + MySQL
  frontend/    CRA React app (3 portals)
```

## 1. Database setup
```bash
mysql -u root -p < backend/schema.sql
```
This creates the `edu_portal` database and all tables.

## 2. Backend setup
```bash
cd backend
cp .env.example .env      # fill in your MySQL credentials + a JWT secret
npm install
node src/seedAdmin.js "Admin Name" admin@example.com YourPassword123
npm run dev                # starts on http://localhost:5000
```
The seed script is required because, per the spec, admin accounts are not self-serve —
only an existing admin can create teacher accounts, and the very first admin has to be
inserted directly.

## 3. Frontend setup
```bash
cd frontend
cp .env.example .env       # points to the backend API URL
npm install
npm start                  # starts on http://localhost:3000
```

## How the flows map to the spec

**Parent portal**
- Self-registration → `/parent/register`
- Dashboard → add child (popup: Name, DOB, Target Exam, Allergies, Category)
- Per-child page has 4 tabs: Upcoming Classes (+ register for more), Classes Attended, 1:1 Classes, Mock Exams
- Menu: Main Dashboard, Invoices (record-only, no payment gateway)

**Teacher portal**
- No self-registration — accounts created by Admin (Tutors page)
- Dashboard lists only classes assigned to that teacher
- Class detail: Students & Attendance tab, Feedback tab (present students only), Material tab, "Complete Class" button (flips registrations to "attended", visible to parent/admin)
- Teachers can schedule 1:1 classes for a child (search by name), which then shows in that child's "1:1 Classes" tab on the parent side
- Cancellation (class or 1:1) is blocked once the 24-hour window before start time has passed — enforced both in the UI (disabled button) and the API (hard check)

**Admin portal**
- Tutors: create/remove teacher accounts
- Courses & Classes: create courses, then classes under a course with multi-select category, assigned teacher, timing, and material link — the class then appears on that teacher's dashboard, and only to children whose category matches
- Parents: view all parents and their children
- Invoices: pick a parent → see attended classes across all their children → select classes + enter amounts → generate **one consolidated invoice per parent**. No payment gateway; this is a record for cash collection, with a "Mark Paid" toggle

## Notes / next steps for a production build
- Material upload is currently a URL field; wire up real file storage (S3, etc.) if physical uploads are needed.
- Add password-reset and email notifications.
- Add pagination for large teacher/parent/class lists.
- Consider a proper category taxonomy table instead of the hardcoded list in the frontend if categories will change often.
