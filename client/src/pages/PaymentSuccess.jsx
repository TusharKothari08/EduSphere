import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const [status, setStatus] = useState('checking');
  const [courseId, setCourseId] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!sessionId) { setStatus('missing'); return; }
      for (let i = 0; i < 6 && active; i += 1) {
        try {
          const { data } = await api.get(`/payments/session/${encodeURIComponent(sessionId)}`);
          if (!active) return;
          setCourseId(data.courseId || '');
          if (data.status === 'confirmed') { setStatus('confirmed'); return; }
        } catch (err) {
          if (!active) return;
          setError(getErrorMessage(err));
          if (err.response?.status === 403 || err.response?.status === 400) { setStatus('error'); return; }
        }
        if (i < 5) await new Promise((resolve) => setTimeout(resolve, 1600));
      }
      if (active) setStatus('pending');
    };
    check();
    return () => { active = false; };
  }, [sessionId, attempt]);

  const confirmed = status === 'confirmed';
  return <main className="payment-success-page"><div className="payment-success-card"><span className="payment-success-icon"><CheckCircle2 size={35} /></span><span className="section-kicker">PAYMENT RETURN</span><h1>{confirmed ? 'You’re ready to learn.' : status === 'error' ? 'We could not verify this checkout.' : 'We’re confirming your enrollment.'}</h1><p>{confirmed ? 'Your course access is ready. Head to your learning dashboard and pick up where you want to begin.' : status === 'error' ? (error || 'Please open the checkout link from the same account you used to purchase the course.') : 'Edemy checks the Stripe session server-side before course access is granted. This can take a few moments.'}</p><div className="payment-status-row"><span className={confirmed ? 'status-check' : 'status-pending'}>{confirmed ? <ShieldCheck size={18} /> : <Clock3 size={18} />}</span><div><strong>{confirmed ? 'Enrollment confirmed' : status === 'pending' ? 'Still waiting for confirmation' : status === 'error' ? 'Verification needs attention' : 'Checking Stripe confirmation'}</strong><small>{confirmed ? 'The payment is verified and course access has been added.' : 'A browser redirect by itself never grants course access.'}</small></div></div><div className="payment-success-actions">{confirmed && courseId ? <Link className="btn btn-primary btn-lg" to={`/learn/${courseId}`}>Start learning <ArrowRight size={17} /></Link> : <Link className="btn btn-primary btn-lg" to="/dashboard">Go to my learning <ArrowRight size={17} /></Link>}{(status === 'pending' || status === 'error' || status === 'missing') && <button className="btn btn-outline" onClick={() => { setStatus('checking'); setError(''); setAttempt((count) => count + 1); }}><Clock3 size={15} /> Check again</button>}</div><Link to="/courses" className="payment-back-link"><BookOpen size={15} /> Browse more courses</Link></div></main>;
}
