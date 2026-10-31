import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const { user, loading: authLoading } = useSession();

  const [status, setStatus] = useState('checking'); // 'checking' | 'confirmed' | 'pending' | 'error' | 'missing'
  const [courseId, setCourseId] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!sessionId) {
      setStatus('missing');
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      setStatus('unauthenticated');
      return;
    }

    const check = async () => {
      setStatus('checking');
      for (let i = 0; i < 6 && active; i += 1) {
        try {
          const { data } = await api.get(
            `/payments/session/${encodeURIComponent(sessionId)}`
          );
          if (!active) return;
          setCourseId(data.courseId || '');
          if (data.status === 'confirmed') {
            setStatus('confirmed');
            return;
          }
        } catch (err) {
          if (!active) return;
          setError(getErrorMessage(err));
          if (
            err.response?.status === 403 ||
            err.response?.status === 400
          ) {
            setStatus('error');
            return;
          }
        }
        if (i < 5) {
          await new Promise((resolve) => setTimeout(resolve, 1600));
        }
      }
      if (active) setStatus('pending');
    };

    check();

    return () => {
      active = false;
    };
  }, [sessionId, authLoading, user, attempt]);

  const confirmed = status === 'confirmed';

  if (authLoading) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-violet-200 border-t-violet-600" />
          <p className="text-sm font-semibold text-slate-700">
            Confirming your session…
          </p>
          <p className="text-xs text-slate-500">
            Reconnecting with your account after Stripe checkout.
          </p>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <LogIn size={28} />
          </div>
          <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-amber-600">
            Sign In Required
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Almost there!
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Please sign in with the account you used during checkout to confirm your course enrollment.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              state={{ from: `/payment/success?session_id=${encodeURIComponent(sessionId)}` }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
            >
              Sign in to continue <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${
              confirmed
                ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50'
                : status === 'error' || status === 'missing'
                ? 'bg-red-100 text-red-600 ring-8 ring-red-50'
                : 'bg-violet-100 text-violet-600 ring-8 ring-violet-50'
            }`}
          >
            {confirmed ? (
              <CheckCircle2 size={36} />
            ) : status === 'error' || status === 'missing' ? (
              <AlertCircle size={36} />
            ) : (
              <Clock3 size={36} className="animate-spin" />
            )}
          </div>

          <span
            className={`mt-4 inline-block text-xs font-bold uppercase tracking-wider ${
              confirmed
                ? 'text-emerald-700'
                : status === 'error' || status === 'missing'
                ? 'text-red-700'
                : 'text-violet-700'
            }`}
          >
            Payment return
          </span>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {confirmed
              ? "You're ready to learn."
              : status === 'error'
              ? 'We could not verify this checkout.'
              : status === 'missing'
              ? 'Checkout session not found.'
              : status === 'pending'
              ? 'Confirmation in progress.'
              : 'Confirming your enrollment…'}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {confirmed
              ? 'Your course access is confirmed and activated. Head straight into your course or view your progress from the student dashboard.'
              : status === 'error'
              ? error || 'Please make sure you are signed in with the same account that purchased this course.'
              : status === 'missing'
              ? 'No checkout session identifier was provided in this link. If you completed a payment, check your courses in the dashboard.'
              : status === 'pending'
              ? 'We are still waiting for Stripe confirmation. This can take a few moments depending on network verification.'
              : 'EDUNEXA checks the Stripe payment session server-side before course access is granted. This usually completes in seconds.'}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  confirmed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-violet-100 text-violet-700'
                }`}
              >
                {confirmed ? <ShieldCheck size={18} /> : <Clock3 size={18} />}
              </span>
              <div>
                <strong className="block text-sm font-bold text-slate-800">
                  {confirmed
                    ? 'Enrollment confirmed'
                    : status === 'pending'
                    ? 'Verification pending'
                    : status === 'error'
                    ? 'Verification needs attention'
                    : 'Verifying payment with Stripe'}
                </strong>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {confirmed
                    ? 'Your payment record is verified and course lessons are unlocked.'
                    : 'Access is granted through verified Stripe webhooks and server sessions.'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {confirmed && courseId ? (
              <Link
                to={`/learn/${courseId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-violet-700"
              >
                Start learning <ArrowRight size={17} />
              </Link>
            ) : confirmed ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-violet-700"
              >
                Go to my learning <ArrowRight size={17} />
              </Link>
            ) : null}

            {(status === 'pending' || status === 'error' || status === 'missing') && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => {
                  setError('');
                  setAttempt((count) => count + 1);
                }}
              >
                <Clock3 size={15} /> Check again
              </button>
            )}

            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-violet-700"
            >
              <BookOpen size={16} /> Browse courses
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
