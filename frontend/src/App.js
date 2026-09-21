import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './Landing';
import UnifiedLogin from './UnifiedLogin';

// Parent portal
import { ParentProvider } from './portals/parent/ParentContext';
import ParentRegister from './portals/parent/ParentRegister';
import ParentDashboard from './portals/parent/ParentDashboard';
import UpcomingClasses from './portals/parent/UpcomingClasses';
import RegisterForClasses from './portals/parent/RegisterForClasses';
import OneOnOneClasses from './portals/parent/OneOnOneClasses';
import ClassesAttended from './portals/parent/ClassesAttended';
import MockExams from './portals/parent/MockExams';
import ParentInvoices from './portals/parent/ParentInvoices';

// Teacher portal
import TeacherDashboard from './portals/teacher/TeacherDashboard';
import ClassDetail from './portals/teacher/ClassDetail';
import TeacherOneOnOne from './portals/teacher/TeacherOneOnOne';

// Admin portal
import AdminDashboard from './portals/admin/AdminDashboard';
import Tutors from './portals/admin/Tutors';
import CoursesAndClasses from './portals/admin/CoursesAndClasses';
import Parents from './portals/admin/Parents';
import AdminInvoices from './portals/admin/AdminInvoices';

function ParentPage({ children }) {
  return (
    <PrivateRoute role="parent">
      <ParentProvider>{children}</ParentProvider>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Single, portal-neutral entry points */}
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/register" element={<ParentRegister />} />

          {/* Parent */}
          <Route path="/parent" element={<ParentPage><ParentDashboard /></ParentPage>} />
          <Route path="/parent/upcoming" element={<ParentPage><UpcomingClasses /></ParentPage>} />
          <Route path="/parent/register" element={<ParentPage><RegisterForClasses /></ParentPage>} />
          <Route path="/parent/one-on-one" element={<ParentPage><OneOnOneClasses /></ParentPage>} />
          <Route path="/parent/attended" element={<ParentPage><ClassesAttended /></ParentPage>} />
          <Route path="/parent/mock-exams" element={<ParentPage><MockExams /></ParentPage>} />
          <Route path="/parent/mock-exams/:id" element={<ParentPage><MockExams /></ParentPage>} />
          <Route path="/parent/invoices" element={<ParentPage><ParentInvoices /></ParentPage>} />

          {/* Teacher */}
          <Route path="/teacher" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/class/:id" element={<PrivateRoute role="teacher"><ClassDetail /></PrivateRoute>} />
          <Route path="/teacher/one-on-one" element={<PrivateRoute role="teacher"><TeacherOneOnOne /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/tutors" element={<PrivateRoute role="admin"><Tutors /></PrivateRoute>} />
          <Route path="/admin/courses" element={<PrivateRoute role="admin"><CoursesAndClasses /></PrivateRoute>} />
          <Route path="/admin/parents" element={<PrivateRoute role="admin"><Parents /></PrivateRoute>} />
          <Route path="/admin/invoices" element={<PrivateRoute role="admin"><AdminInvoices /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
