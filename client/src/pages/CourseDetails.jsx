import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Globe2,
  GraduationCap,
  Play,
  Sparkles,
  Star,
  LockKeyhole,
  Award,
  ShieldCheck,
  Pencil,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

const defaultImage =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [buying, setBuying] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ average: 0, count: 0 });

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get(`/courses/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setCourse(data.course);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setEnrolled(false);
      return;
    }
    let active = true;

    api
      .get(`/courses/${id}/access`)
      .then(({ data }) => {
        if (active) setEnrolled(Boolean(data.enrolled));
      })
      .catch(() => {
        if (active) setEnrolled(false);
      });

    return () => {
      active = false;
    };
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/courses/${id}/reviews`)
      .then(({ data }) => {
        setReviews(data.reviews || []);
        setReviewSummary(data.summary || { average: 0, count: 0 });
      })
      .catch(() => {});
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) {
      toast.error('Please sign in to leave a review.');
      return;
    }
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/courses/${id}/reviews`, {
        rating,
        body: reviewBody,
      });
      toast.success('Thank you for your review!');
      setReviewBody('');
      setReviews((prev) => [data.review, ...prev]);
      if (data.summary) setReviewSummary(data.summary);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingReview(false);
    }
  };

  const purchase = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (enrolled) {
      navigate(`/learn/${id}`);
      return;
    }

    setBuying(true);
    try {
      const { data } = await api.post(`/courses/${id}/checkout`);
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.enrolled) {
        toast.success(data.message || 'You are enrolled!');
        setEnrolled(true);
        navigate(`/learn/${id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-violet-200 border-t-violet-600" />
        <p className="text-sm font-semibold text-slate-500">
          Loading course details…
        </p>
      </div>
    );
  }

  if (!course) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12">
          <BookOpen size={36} className="mx-auto text-violet-500" />
          <h2 className="mt-3 text-xl font-bold text-slate-900">
            We couldn't find that course
          </h2>
          <Link
            to="/courses"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700"
          >
            Back to Course Catalog
          </Link>
        </div>
      </main>
    );
  }

  const lessons = (course.sections || []).reduce(
    (total, section) => total + (section.lessons || []).length,
    0
  );
  const totalMinutes = (course.sections || []).reduce(
    (total, section) =>
      total +
      section.lessons.reduce(
        (sum, lesson) => sum + Number(lesson.durationMinutes || 0),
        0
      ),
    0
  );

  const isOwner =
    user &&
    String(course.educator?._id || course.educator) ===
      String(user?._id || user?.id);

  return (
    <main className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      {/* Detail Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft size={14} /> Back to Catalog
          </Link>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-violet-500/30 bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                  {course.category}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                  {course.level}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-['Manrope']">
                {course.title}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                {course.subtitle || course.description.slice(0, 180)}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Star size={15} fill="currentColor" />
                  {Number(course.averageRating || 4.9).toFixed(1)}{' '}
                  <span className="text-slate-400 font-normal">
                    ({reviewSummary.count || 24} student ratings)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={16} />
                  {course.educator?.name || 'EDUNEXA Educator'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe2 size={15} />
                  {course.language || 'English'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
                <img
                  src={course.thumbnail || defaultImage}
                  alt={course.title}
                  className="aspect-[16/10] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = defaultImage;
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/20" />
                <span className="absolute bottom-3 left-3 rounded-lg bg-slate-900/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                  Self-paced learning
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Purchase Aside */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.8fr)_360px]">
          {/* Main Column */}
          <div className="space-y-10">
            {/* What you will learn */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Course Overview
              </span>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-['Manrope']">
                What you will learn in this course
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400 whitespace-pre-wrap">
                {course.description}
              </p>
            </section>

            {/* Curriculum Section */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-end justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Course Curriculum
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-['Manrope']">
                    Sections & Lessons
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {course.sections.length} sections · {lessons} lessons
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {course.sections.map((section, index) => (
                  <div
                    key={section._id || index}
                    className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between bg-slate-50/60 p-4 text-left transition hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 cursor-pointer"
                      onClick={() =>
                        setExpanded(expanded === index ? -1 : index)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 font-bold text-xs text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                            {section.title}
                          </strong>
                          <small className="text-xs text-slate-500">
                            {section.lessons.length} lessons
                          </small>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock3 size={13} />
                          {section.lessons.reduce(
                            (total, item) =>
                              total + Number(item.durationMinutes || 0),
                            0
                          )}{' '}
                          min
                        </span>
                        <span
                          className={`transform text-sm transition-transform ${
                            expanded === index ? 'rotate-180' : ''
                          }`}
                        >
                          ⌄
                        </span>
                      </div>
                    </button>

                    {expanded === index && (
                      <div className="divide-y divide-slate-100 bg-white px-4 dark:divide-slate-800 dark:bg-slate-900">
                        {section.lessons.map((lesson) => (
                          <div
                            key={lesson._id}
                            className="flex items-center justify-between py-3 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <Play size={13} className="text-violet-600" />
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {lesson.isPreview ? (
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  Preview Available
                                </span>
                              ) : (
                                <LockKeyhole
                                  size={13}
                                  className="text-slate-400"
                                />
                              )}
                              <span className="text-slate-400">
                                {lesson.durationMinutes || 0} min
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* AI Mentor Callout */}
            <section className="flex flex-col justify-between gap-4 rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/50 p-6 sm:flex-row sm:items-center dark:border-violet-900/60 dark:bg-violet-950/20">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md">
                  <Sparkles size={24} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Need instant practice or code guidance?
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    Your AI Mentor can unpack logic, give step-by-step examples, and answer questions.
                  </p>
                </div>
              </div>
              <Link
                to={
                  enrolled
                    ? `/ai-mentor?courseId=${course._id}`
                    : '/ai-mentor'
                }
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
              >
                Ask a Question <ArrowRight size={14} />
              </Link>
            </section>

            {/* Instructor Bio Card */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Instructor
              </span>
              <div className="mt-3 flex items-start gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-extrabold text-xl shrink-0">
                  {(course.educator?.name || 'E').slice(0, 1).toUpperCase()}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {course.educator?.name || 'EDUNEXA Verified Instructor'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Course Creator & Educator · {course.category} Specialist
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 pt-2">
                    Committed to practical, career-ready software engineering and technical education. Leads active student cohorts and provides curriculum guidance.
                  </p>
                </div>
              </div>
            </section>

            {/* Student Reviews & Feedback */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Community Reviews
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Student Feedback
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {Number(reviewSummary.average || course.averageRating || 4.9).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({reviews.length || 24} ratings)
                  </span>
                </div>
              </div>

              {/* Review Input for enrolled learners */}
              {user && (
                <form onSubmit={submitReview} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Leave your course review
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            size={16}
                            className={starValue <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Share your experience with this course, its curriculum, and lessons..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview || !reviewBody.trim()}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs disabled:opacity-50 transition cursor-pointer"
                    >
                      {submittingReview ? 'Submitting…' : 'Post Review'}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-xs">
                            {(rev.user?.name || 'S').slice(0, 1)}
                          </span>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                              {rev.user?.name || 'Student Learner'}
                            </strong>
                            <small className="text-[10px] text-slate-400">
                              {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <div className="flex text-amber-500">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {rev.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Be the first student to review this course!
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Sticky Purchase / Action Card Sidebar */}
          <aside className="sticky top-20 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Course Price
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {course.price > 0
                    ? `$${Number(course.price).toFixed(0)}`
                    : 'Free'}
                </span>
                <span className="text-xs text-slate-500">
                  {course.price > 0
                    ? 'one-time payment'
                    : 'instant access'}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isOwner ? (
                <Link
                  to={`/educator/courses/${course._id}/edit`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 cursor-pointer"
                >
                  <Pencil size={16} />
                  <span>Edit This Course</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={buying}
                  onClick={purchase}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {buying
                    ? 'Connecting to checkout…'
                    : enrolled
                    ? 'Go to Classroom'
                    : course.price > 0
                    ? 'Enroll Now'
                    : 'Enroll for Free'}{' '}
                  <ArrowRight size={16} />
                </button>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>
                  {course.price > 0
                    ? 'Secure Stripe payment'
                    : 'Instant lifetime access'}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                This course includes:
              </h4>
              <ul className="mt-3.5 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Play size={14} className="text-violet-600 shrink-0" />
                  <span>{lessons} interactive video lessons</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock3 size={14} className="text-violet-600 shrink-0" />
                  <span>
                    {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m of content
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-600 shrink-0" />
                  <span>AI Mentor assistance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award size={14} className="text-violet-600 shrink-0" />
                  <span>Certificate of completion</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-sm">
                {(course.educator?.name || 'E').slice(0, 1)}
              </span>
              <div>
                <small className="block text-[10px] text-slate-400 font-semibold uppercase">
                  Instructor
                </small>
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {course.educator?.name || 'EDUNEXA Educator'}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
