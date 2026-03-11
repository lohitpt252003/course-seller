import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import CoursePlayer from './pages/CoursePlayer';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import TeacherApply from './pages/TeacherApply';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import About from './pages/About';
import BookCall from './pages/BookCall';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import HelpCentre from './pages/HelpCentre';
import ContactUs from './pages/ContactUs';
import NotFound from './pages/NotFound';
import './index.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-layout">
            <Header />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/students" element={<Students />} />
                <Route path="/teachers" element={<Teachers />} />
                <Route path="/about" element={<About />} />
                <Route path="/book-call" element={<BookCall />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/help-centre" element={<HelpCentre />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/checkout/:courseId" element={
                  <ProtectedRoute><Checkout /></ProtectedRoute>
                } />
                <Route path="/learn/:courseId" element={
                  <ProtectedRoute><CoursePlayer /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
                } />
                <Route path="/teacher" element={
                  <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/apply-teacher" element={
                  <ProtectedRoute><TeacherApply /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
