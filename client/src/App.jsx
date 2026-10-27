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
  return <main className="container page-shell"><div className="empty-state not-found"><span className="section-kicker">404 · PAGE NOT FOUND</span><h1>Looks like this page took a different path.</h1><p>The link may be out of date, or the page may have moved.</p><a className="btn btn-primary" href="/">Back to Edemy</a></div></main>;
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
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
    </Routes> : <SiteLayout><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetails />} />
      <Route path="/ai-mentor" element={<AIMentor />} />
      <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<Dashboard />} /></Route>
      <Route element={<ProtectedRoute role="admin" />}><Route path="/admin" element={<AdminDashboard />} /></Route>
      <Route element={<ProtectedRoute role="educator" />}>
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
