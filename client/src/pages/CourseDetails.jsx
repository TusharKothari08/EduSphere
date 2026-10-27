import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Globe2, GraduationCap, LockKeyhole, Play, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

const defaultImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ average: 0, count: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => setCourse(data.course)).catch((error) => toast.error(getErrorMessage(error))).finally(() => setLoading(false));
    if (user) api.get('/enrollments/me').then(({ data }) => setEnrolled((data.enrollments || []).some((item) => item.course?._id === id))).catch(() => {});
    api.get(`/learning/courses/${id}/reviews`).then(({ data }) => { setReviews(data.reviews || []); setReviewSummary(data.summary || { average: 0, count: 0 }); }).catch(() => {});
  }, [id, user]);

  const submitReview = async (event) => { event.preventDefault(); if (!user) return navigate('/login'); setReviewBusy(true); try { await api.post(`/learning/courses/${id}/reviews`, { rating: reviewRating, body: reviewBody }); const { data } = await api.get(`/learning/courses/${id}/reviews`); setReviews(data.reviews || []); setReviewSummary(data.summary || { average: 0, count: 0 }); setReviewBody(''); toast.success('Thanks for sharing your feedback.'); } catch (error) { toast.error(getErrorMessage(error)); } finally { setReviewBusy(false); } };

  const purchase = async () => {
    if (!user) return navigate('/login', { state: { from: `/courses/${id}` } });
    if (enrolled) return navigate(`/learn/${id}`);
    setBuying(true);
    try {
      const { data } = await api.post(`/courses/${id}/checkout`);
      if (data.checkoutUrl) { window.location.assign(data.checkoutUrl); return; }
      if (data.enrolled) { toast.success(data.message || 'You are enrolled!'); setEnrolled(true); navigate(`/learn/${id}`); }
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBuying(false); }
  };

  if (loading) return <div className="page-loading"><span className="spinner" /><p>Loading course details…</p></div>;
  if (!course) return <main className="container page-shell"><div className="empty-state"><BookOpen size={32} /><h2>We couldn't find that course</h2><Link to="/courses" className="btn btn-primary">Back to courses</Link></div></main>;
  const lessons = (course.sections || []).reduce((total, section) => total + (section.lessons || []).length, 0);
  const totalMinutes = course.sections.reduce((total, section) => total + section.lessons.reduce((sum, lesson) => sum + Number(lesson.durationMinutes || 0), 0), 0);

  return <main className="course-detail-page"><div className="detail-hero"><div className="container"><Link to="/courses" className="back-link"><ArrowLeft size={15} /> Back to courses</Link><div className="detail-hero-grid"><div className="detail-copy"><div className="detail-tags"><span>{course.category}</span><span>{course.level}</span></div><h1>{course.title}</h1><p className="detail-subtitle">{course.subtitle || course.description.slice(0, 170)}</p><div className="detail-byline"><span className="detail-rating"><Star size={15} fill="currentColor" /> {Number(course.averageRating || 0).toFixed(1)} <small>{course.averageRating > 0 ? 'course rating' : 'not rated yet'}</small></span><span><GraduationCap size={16} /> {course.educator?.name || 'Edemy educator'}</span><span><Globe2 size={15} /> {course.language || 'English'}</span></div></div><div className="detail-cover"><img src={course.thumbnail || defaultImage} alt="" onError={(event) => { event.currentTarget.src = defaultImage; }} /><span className="cover-play"><Play size={20} fill="currentColor" /></span><span className="cover-caption">Learn at your own pace</span></div></div></div></div>
    <div className="container detail-content-grid"><div className="detail-main-column"><section className="detail-section"><span className="section-kicker">WHAT YOU'LL LEARN</span><h2>Skills that travel with you.</h2><p className="course-long-description">{course.description}</p><div className="learning-outcomes"><div><CheckCircle2 size={17} /> Understand the core concepts step by step</div><div><CheckCircle2 size={17} /> Practice with real-world examples</div><div><CheckCircle2 size={17} /> Build confidence through guided lessons</div><div><CheckCircle2 size={17} /> Ask follow-up questions with the AI Mentor</div></div></section>
    <section className="detail-section curriculum-section"><div className="curriculum-header"><div><span className="section-kicker">THE CURRICULUM</span><h2>Inside the course.</h2></div><span>{course.sections.length} sections · {lessons} lessons</span></div>{course.sections.map((section, index) => <div className="syllabus-section" key={section._id || index}><button className="syllabus-toggle" onClick={() => setExpanded(expanded === index ? -1 : index)}><span className="syllabus-index">{String(index + 1).padStart(2, '0')}</span><span className="syllabus-title"><strong>{section.title}</strong><small>{section.lessons.length} lessons</small></span><span className="syllabus-duration"><Clock3 size={13} /> {section.lessons.reduce((total, item) => total + Number(item.durationMinutes || 0), 0)} min</span><span className={`chevron ${expanded === index ? 'rotate' : ''}`}>⌄</span></button>{expanded === index && <div className="syllabus-lessons">{section.lessons.map((lesson) => <div className="syllabus-lesson" key={lesson._id}><Play size={14} /><span>{lesson.title}</span>{lesson.isPreview ? <span className="preview-label">Preview</span> : <LockKeyhole size={13} className="lesson-lock" />}<small>{lesson.durationMinutes || 0} min</small></div>)}</div>}</div>)}</section>
    <section className="detail-section course-reviews-section"><div className="curriculum-header"><div><span className="section-kicker">LEARNER FEEDBACK</span><h2>Reviews from students.</h2></div><span>{reviewSummary.count ? `${Number(reviewSummary.average).toFixed(1)} / 5 · ${reviewSummary.count} review${reviewSummary.count===1?'':'s'}` : 'No reviews yet'}</span></div>{enrolled && <form className="course-review-form" onSubmit={submitReview}><label>Rating<select value={reviewRating} onChange={e=>setReviewRating(Number(e.target.value))}><option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Very good</option><option value="3">★★★ — Good</option><option value="2">★★ — Needs improvement</option><option value="1">★ — Poor</option></select></label><label>Your review<textarea value={reviewBody} onChange={e=>setReviewBody(e.target.value)} required minLength={3} maxLength={3000} rows={3} placeholder="What was useful? What could be improved?"/></label><button className="btn btn-primary btn-small" disabled={reviewBusy}>{reviewBusy?'Submitting…':'Submit review'}</button></form>}{reviews.length ? <div className="course-review-list">{reviews.map(review=><article className="course-review-item" key={review._id}><span className="review-avatar">{(review.user?.name||'L').slice(0,1).toUpperCase()}</span><div><div className="review-item-heading"><strong>{review.user?.name||'Learner'}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div><p>{review.body}</p><small>{new Date(review.createdAt).toLocaleDateString()}</small></div></article>)}</div>:<p className="review-empty">Be the first learner to share feedback after enrolling.</p>}</section><section className="detail-section mentor-callout"><span className="callout-icon"><Sparkles size={23} /></span><div><h3>Questions are part of learning.</h3><p>Use the Edemy AI Mentor to get another explanation, an example, or a guided next step.</p></div><Link to={enrolled ? `/ai-mentor?courseId=${course._id}` : '/ai-mentor'} className="text-link">Ask a question <ArrowRight size={15} /></Link></section></div>
    <aside className="purchase-card"><div className="purchase-price">{course.price > 0 ? `$${Number(course.price).toFixed(0)}` : 'Free'} <small>{course.price > 0 ? 'one-time payment' : 'enroll today'}</small></div><button className="btn btn-primary btn-block btn-lg" disabled={buying} onClick={purchase}>{buying ? 'Preparing checkout…' : enrolled ? 'Continue learning' : course.price > 0 ? 'Enroll in this course' : 'Enroll for free'} <ArrowRight size={17} /></button><p className="secure-note"><ShieldCheck size={15} /> {course.price > 0 ? 'Secure checkout with Stripe' : 'Instant course access'}</p><div className="purchase-divider" /><h4>This course includes</h4><div className="purchase-includes"><span><Play size={16} /> {lessons} on-demand lessons</span><span><Clock3 size={16} /> {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m of content</span><span><BookOpen size={16} /> Course progress tracking</span><span><Sparkles size={16} /> AI learning assistance</span><span><CheckCircle2 size={16} /> Learn on your schedule</span></div><div className="purchase-bottom"><span className="purchase-avatar">{(course.educator?.name || 'E').slice(0, 1)}</span><div><small>Created by</small><strong>{course.educator?.name || 'Edemy educator'}</strong></div></div></aside></div>
    {searchParams.get('payment') === 'cancelled' && <div className="payment-cancel-banner">Checkout was cancelled. You have not been charged.</div>}
  </main>;
}
