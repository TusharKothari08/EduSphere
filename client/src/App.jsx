import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Dashboard from './pages/Dashboard';
import EducatorDashboard from './pages/EducatorDashboard';
import CourseEditor from './pages/CourseEditor';
import CoursePlayer from './pages/CoursePlayer';
import AIMentor from './pages/AIMentor';
import AuthPage from './pages/AuthPage';
import PaymentSuccess from './pages/PaymentSuccess';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function SiteLayout({ children }) {
  return <><Navbar />{children}<Footer /></>;
}

function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50/70">
      <div className="max-w-md w-full text-center bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-bold text-xs tracking-wider uppercase border border-violet-200/60">
          404 · Page Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Manrope']">
          Looks like this page took a different path.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          The link may be out of date or the course module has moved to another track.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
          >
            Back to EDUNEXA Home
          </a>
        </div>
      </div>
    </main>
  );
}

function RoutedApp() {
  const { pathname } = useLocation();
  const isPlayer = pathname.startsWith('/learn/');
  const isAuth = pathname === '/login' || pathname === '/signup';
  const specialLayout = isPlayer || isAuth || pathname === '/payment/success';
  return <>
    <ScrollToTop />
    <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '14px', fontFamily: 'DM Sans, sans-serif' } }} />
    {specialLayout ? <Routes>
      <Route path="/learn/:id" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
    </Routes> : <SiteLayout><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetails />} />
      <Route path="/ai-mentor" element={<AIMentor />} />
      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['educator', 'admin']} />}>
        <Route path="/educator" element={<EducatorDashboard />} />
        <Route path="/educator/new-course" element={<CourseEditor />} />
        <Route path="/educator/courses/:id/edit" element={<CourseEditor />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes></SiteLayout>}
  </>;
}

export default function App() {
  return <BrowserRouter><RoutedApp /></BrowserRouter>;
}
