import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './Landing';
import UnifiedLogin from './UnifiedLogin';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

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
import Homework from './portals/parent/Homework';
import MyChildren from './portals/parent/MyChildren';
import PdfViewer from './portals/parent/PdfViewer';

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
import Students from './portals/admin/Students';
import AdminHomework from './portals/admin/AdminHomework';
import FeedbackApproval from './portals/admin/FeedbackApproval';

// Right-click is disabled across the whole site except the admin portal.
function RightClickGuard() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return undefined;
    const block = (e) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, [pathname]);
  return null;
}

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
        <RightClickGuard />
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Single, portal-neutral entry points */}
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/register" element={<ParentRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin has its own sign-in page, not linked from the public site */}
          <Route path="/admin/login" element={<UnifiedLogin adminOnly />} />

          {/* Parent */}
          <Route path="/parent" element={<ParentPage><ParentDashboard /></ParentPage>} />
          <Route path="/parent/upcoming" element={<ParentPage><UpcomingClasses /></ParentPage>} />
          <Route path="/parent/register" element={<ParentPage><RegisterForClasses /></ParentPage>} />
          <Route path="/parent/one-on-one" element={<ParentPage><OneOnOneClasses /></ParentPage>} />
          <Route path="/parent/attended" element={<ParentPage><ClassesAttended /></ParentPage>} />
          <Route path="/parent/mock-exams" element={<ParentPage><MockExams /></ParentPage>} />
          <Route path="/parent/mock-exams/:id" element={<ParentPage><MockExams /></ParentPage>} />
          <Route path="/parent/invoices" element={<ParentPage><ParentInvoices /></ParentPage>} />
          <Route path="/parent/homework" element={<ParentPage><Homework /></ParentPage>} />
          <Route path="/parent/children" element={<ParentPage><MyChildren /></ParentPage>} />
          <Route path="/parent/view/:id/:kind" element={<PrivateRoute role="parent"><PdfViewer /></PrivateRoute>} />

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
          <Route path="/admin/students" element={<PrivateRoute role="admin"><Students /></PrivateRoute>} />
          <Route path="/admin/homework" element={<PrivateRoute role="admin"><AdminHomework /></PrivateRoute>} />
          <Route path="/admin/approvals/:id" element={<PrivateRoute role="admin"><FeedbackApproval /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
