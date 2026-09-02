const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const coursesRoutes = require('./routes/courses');
const classesRoutes = require('./routes/classes');
const registrationsRoutes = require('./routes/registrations');
const oneOnOneRoutes = require('./routes/oneOnOne');
const mockExamsRoutes = require('./routes/mockExams');
const invoicesRoutes = require('./routes/invoices');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded class-material files (e.g. /uploads/materials/xxx.pdf)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/one-on-one', oneOnOneRoutes);
app.use('/api/mock-exams', mockExamsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler (fallback)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Edu Portal API running on port ${PORT}`));