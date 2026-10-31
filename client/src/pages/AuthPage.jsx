import { useState, useEffect } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  LockKeyhole,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useSession } from '../auth/AuthProvider';

const clerkEnabled = Boolean(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

function getRoleHome(user, requestedTarget) {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'educator') return '/educator';
  if (user?.role === 'student') return requestedTarget || '/dashboard';
  return requestedTarget || '/dashboard';
}

export default function AuthPage({ mode = 'login' }) {
  const signup = mode === 'signup';
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('edemy_requested_role');
      if (saved === 'educator' || saved === 'student') return saved;
    }
    return 'student';
  });

  const { user, loading, isClerk, logout } = useSession();
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const location = useLocation();

  const requestedTarget =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : null;

  const roleHome = getRoleHome(user, requestedTarget);
  const profileError = user?.profileSyncError;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('edemy_requested_role', role);
    }
  };

  useEffect(() => {
    if (signup && typeof window !== 'undefined') {
      sessionStorage.setItem('edemy_requested_role', selectedRole);
    }
  }, [signup, selectedRole]);

  // If already authenticated and profile loaded with role, redirect to workspace
  if (clerkLoaded && isSignedIn && !loading && user) {
    return <Navigate to={roleHome} replace />;
  }

  const clerkAppearance = {
    variables: {
      colorPrimary: '#7c3aed',
      colorText: '#0f172a',
      borderRadius: '0.75rem',
      fontFamily: 'DM Sans, sans-serif',
      fontSizeBase: '14px',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Left Column: Brand & Story */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white p-12 xl:p-16 flex-col justify-between relative z-10 border-r border-slate-800">
        <div>
          {/* Brand */}
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
              <GraduationCap size={22} strokeWidth={2.4} />
            </span>
            <span className="font-extrabold text-2xl tracking-tight text-white font-['Manrope']">
              EDUNEXA<span className="text-violet-400">.</span>
            </span>
          </Link>

          <div className="mt-14 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-900/60 border border-violet-700/60 text-violet-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-violet-400" />
            <span>A little progress, every day</span>
          </div>

          <h1 className="mt-5 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] font-['Manrope']">
            {signup ? (
              <>
                Your next chapter <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400">
                  starts here.
                </span>
              </>
            ) : (
              <>
                Good to see you <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
                  again.
                </span>
              </>
            )}
          </h1>

          <p className="mt-4 text-slate-300 text-sm xl:text-base leading-relaxed max-w-lg">
            {signup
              ? 'Build a learning habit that stays with you. Explore expert-led courses, track your progress, and get answers from your AI Mentor.'
              : 'Pick up where you left off. Your courses, progress, and AI Mentor are ready when you are.'}
          </p>

          {/* Benefits */}
          <div className="mt-8 space-y-3.5 max-w-md">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <BookOpen size={14} />
              </span>
              <span>Learn at your own pace with self-paced courses</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </span>
              <span>24/7 AI Mentor assistance when concepts get tricky</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <LockKeyhole size={14} />
              </span>
              <span>Lifetime access and verified completion certificates</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 text-xs text-slate-400">
          Learn something that matters to you.
        </div>
      </div>

      {/* Right Column: Authentication Card & Role Selector */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 z-10">
        <div className="w-full max-w-[460px] flex flex-col items-center">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6 flex flex-col items-center text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <span className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white">
                <GraduationCap size={20} />
              </span>
              <span className="font-extrabold text-xl text-slate-900 font-['Manrope']">
                EDUNEXA<span className="text-violet-600">.</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 font-medium">
              Learn without limits.
            </p>
          </div>

          {/* If already signed in in Clerk, offer direct dashboard jump or switch account */}
          {clerkLoaded && isSignedIn ? (
            <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 text-center space-y-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 font-bold text-lg mx-auto">
                {(user?.name || 'U').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Active Session
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Welcome back, {user?.name || 'Learner'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  You are already signed in with your EDUNEXA account.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to={roleHome || '/dashboard'}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition"
                >
                  <LayoutDashboard size={15} />
                  <span>Go to My Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Selector (Prominent on Signup) */}
              {signup && (
                <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 mb-5 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600">
                        Account Type
                      </span>
                      <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                        How would you like to use EDUNEXA?
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3.5">
                    Choose your role before creating your account:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Student Option */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('student')}
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                        selectedRole === 'student'
                          ? 'border-violet-600 bg-violet-50/70 shadow-xs ring-2 ring-violet-200'
                          : 'border-slate-200 bg-white hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedRole === 'student'
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <BookOpen size={16} />
                        </span>
                        {selectedRole === 'student' && (
                          <CheckCircle2 size={16} className="text-violet-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Student
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Discover courses, learn new skills, and track progress
                      </span>
                    </button>

                    {/* Educator Option */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('educator')}
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                        selectedRole === 'educator'
                          ? 'border-violet-600 bg-violet-50/70 shadow-xs ring-2 ring-violet-200'
                          : 'border-slate-200 bg-white hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedRole === 'educator'
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <GraduationCap size={16} />
                        </span>
                        {selectedRole === 'educator' && (
                          <CheckCircle2 size={16} className="text-violet-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Educator
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Create courses, build curriculum, and teach learners
                      </span>
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Registering as:{' '}
                      <strong className="text-violet-600 capitalize">
                        {selectedRole}
                      </strong>
                    </span>
                    <span className="text-slate-400">Saved to profile</span>
                  </div>
                </div>
              )}

              {/* Clerk Component Render */}
              {clerkEnabled ? (
                isClerk ? (
                  <div className="w-full flex justify-center">
                    {signup ? (
                      <SignUp
                        routing="hash"
                        signInUrl="/login"
                        fallbackRedirectUrl={
                          selectedRole === 'educator' ? '/educator' : '/dashboard'
                        }
                        forceRedirectUrl={
                          selectedRole === 'educator' ? '/educator' : '/dashboard'
                        }
                        unsafeMetadata={{
                          requestedRole: selectedRole,
                        }}
                        appearance={clerkAppearance}
                      />
                    ) : (
                      <SignIn
                        routing="hash"
                        signUpUrl="/signup"
                        fallbackRedirectUrl={roleHome || '/dashboard'}
                        forceRedirectUrl={roleHome || '/dashboard'}
                        appearance={clerkAppearance}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    Clerk authentication is initializing.
                  </div>
                )
              ) : (
                <div className="w-full p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  Clerk publishable key is missing. Set VITE_CLERK_PUBLISHABLE_KEY in client/.env.
                </div>
              )}
            </>
          )}

          {/* Role Resolution Error fallback */}
          {!loading && user && !roleHome && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs w-full">
              {profileError
                ? `Account notice: ${profileError}. Please refresh or sign in again.`
                : 'Account verified. Please refresh your browser.'}
            </div>
          )}

          {/* Footer Backlink */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700 font-semibold transition"
            >
              <span>Back to Edemy Home</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
