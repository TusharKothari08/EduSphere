
import { Navigate, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useSession } from '../auth/AuthProvider';

const clerkEnabled = Boolean(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

function getRoleHome(user, requestedTarget) {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'educator') return '/educator';
  if (user?.role === 'student') return requestedTarget || '/dashboard';
  return null;
}

export default function AuthPage({ mode = 'login' }) {
  const signup = mode === 'signup';
  const { user, loading, isClerk } = useSession();
  const location = useLocation();

  const requestedTarget =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname || '/dashboard';

  const useClerkUI = clerkEnabled && isClerk;
  const roleHome = getRoleHome(user, requestedTarget);
  const profileError = user?.profileSyncError;

  if (!loading && user && roleHome) {
    return <Navigate to={roleHome} replace />;
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />

      <div className="container auth-layout">
        <section className="auth-story">
          <Link className="brand auth-brand" to="/">
            <span className="brand-mark">
              <GraduationCap size={23} />
            </span>
            <span>
              edemy<span className="brand-dot">.</span>
            </span>
          </Link>

          <div className="auth-story-copy">
            <span className="section-kicker light-kicker">
              A LITTLE PROGRESS, EVERY DAY
            </span>

            <h1>
              {signup
                ? 'Your next chapter starts here.'
                : 'Good to see you again.'}
            </h1>

            <p>
              {signup
                ? 'Build a learning habit that stays with you. Explore expert-led courses and keep your curiosity moving.'
                : 'Pick up where you left off. Your courses, progress, and AI Mentor are ready when you are.'}
            </p>

            <div className="auth-benefits">
              <span>
                <BookOpen size={17} />
                Learn at your own pace
              </span>
              <span>
                <Sparkles size={17} />
                Ask your AI Mentor
              </span>
              <span>
                <LockKeyhole size={17} />
                Your learning stays yours
              </span>
            </div>
          </div>

          <div className="auth-story-footer">
            Learn something that matters to you.
          </div>
        </section>

        <section
          className={`auth-form-side ${useClerkUI ? 'clerk-page-mode' : ''}`}
        >
          <div
            className={`auth-form-card ${useClerkUI ? 'clerk-mode' : ''}`}
          >
            {!useClerkUI && (
              <div className="auth-form-heading">
                <span className="section-kicker">
                  WELCOME TO EDEMY
                </span>
                <h2>
                  {signup
                    ? 'Create your account'
                    : 'Sign in to continue'}
                </h2>
                <p>
                  {signup
                    ? 'Start building skills one lesson at a time.'
                    : 'Your learning journey is right where you left it.'}
                </p>
              </div>
            )}

            {clerkEnabled ? (
              isClerk ? (
                <div className="clerk-auth-widget">
                  {signup ? (
                    <SignUp
                      routing="hash"
                      signInUrl="/login"
                      fallbackRedirectUrl="/dashboard"
                    />
                  ) : (
                    <SignIn
                      routing="hash"
                      signUpUrl="/signup"
                      fallbackRedirectUrl="/dashboard"
                    />
                  )}
                </div>
              ) : (
                <p role="alert">
                  Clerk is configured in the environment, but its
                  authentication provider is not active. Check
                  client/src/auth/AuthProvider.jsx and restart Vite.
                </p>
              )
            ) : (
              <p role="alert">
                Clerk is not configured. Set
                VITE_CLERK_PUBLISHABLE_KEY in client/.env and restart
                Vite.
              </p>
            )}

            {!loading && user && !roleHome && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {profileError
                  ? `Edemy could not load your account role: ${profileError}. Please refresh or sign out and sign in again.`
                  : 'Edemy loaded your account but did not receive a recognized role. Check the backend profile response.'}
              </p>
            )}
          </div>

          {!useClerkUI && (
            <p className="auth-legal">
              By continuing, you agree to use Edemy responsibly and
              respectfully.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
