import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Flame,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

const fallbackImage =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

export default function Dashboard() {
  const { user } = useSession();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/me'),
      api.get('/learning/certificates/me'),
    ])
      .then(([e, c]) => {
        setEnrollments(e.data.enrollments || []);
        setCertificates(c.data.certificates || []);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [refresh]);

  const completed = enrollments.filter(
    (item) => item.progressPercent >= 100
  ).length;
  const totalProgress = enrollments.length
    ? Math.round(
        enrollments.reduce(
          (total, item) => total + item.progressPercent,
          0
        ) / enrollments.length
      )
    : 0;
  const continueCourse =
    enrollments.find((item) => item.progressPercent < 100) || enrollments[0];

  const isEducator = user?.role === 'educator';

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Educator Role Notice Banner (if Educator is on Student Dashboard) */}
        {isEducator && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-200">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </span>
              <div>
                <strong className="text-xs sm:text-sm font-bold block">
                  Educator Account Mode
                </strong>
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  You are viewing the learner dashboard. Switch to your Educator Studio to manage your courses and track students.
                </p>
              </div>
            </div>
            <Link
              to="/educator"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shrink-0"
            >
              <span>Open Educator Studio</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Welcome Banner */}
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                <BookOpen size={11} />
                Student Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Manrope']">
              Keep your momentum,{' '}
              <span className="text-violet-600">
                {user?.name?.split(' ')[0] || 'Learner'}.
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Every lesson is progress. Here is where your learning stands today.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-violet-700 shrink-0"
          >
            <BookOpen size={15} />
            <span>Explore Courses</span>
          </Link>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Courses Enrolled
              </p>
              <strong className="mt-1 block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {loading ? '—' : enrollments.length}
              </strong>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Active learning tracks
              </span>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <BookOpen size={20} />
            </span>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Courses Completed
              </p>
              <strong className="mt-1 block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {loading ? '—' : completed}
              </strong>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Milestones finished
              </span>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 size={20} />
            </span>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Overall Progress
              </p>
              <strong className="mt-1 block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {loading ? '—' : `${totalProgress}%`}
              </strong>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Across all enrolled courses
              </span>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Flame size={20} />
            </span>
          </article>
        </section>

        {/* Certificates Earned */}
        {certificates.length > 0 && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                Your Achievements
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Certificates Earned
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((c) => (
                <div
                  key={c._id}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 flex items-start gap-3"
                >
                  <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {c.course?.title || 'Completed Course'}
                    </strong>
                    <small className="text-[11px] text-slate-500 block">
                      Issued {new Date(c.issuedAt).toLocaleDateString()}
                    </small>
                    <code className="mt-1 inline-block text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300">
                      {c.code}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Print
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Main Column: Enrolled Courses */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pick Up Where You Left Off
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Continue Learning
                </h2>
              </div>
              <Link
                to="/courses"
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Browse more courses
              </Link>
            </div>

            {loading ? (
              <div className="h-44 animate-pulse rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800" />
            ) : enrollments.length > 0 ? (
              <div className="space-y-3.5">
                {enrollments.map((item) => {
                  const course = item.course;
                  if (!course) return null;
                  const totalLessons = (course.sections || []).reduce(
                    (total, section) =>
                      total + (section.lessons || []).length,
                    0
                  );

                  return (
                    <article
                      key={item._id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <Link
                        to={`/learn/${course._id}`}
                        className="aspect-video w-full sm:w-44 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 block"
                      >
                        <img
                          src={course.thumbnail || fallbackImage}
                          alt={course.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = fallbackImage;
                          }}
                        />
                      </Link>

                      <div className="flex-1 min-w-0 w-full space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
                            {course.category}
                          </span>
                          <span className="text-[11px] font-bold">
                            {item.progressPercent >= 100
                              ? 'Completed'
                              : item.progressPercent > 0
                              ? 'In progress'
                              : 'Ready to start'}
                          </span>
                        </div>

                        <Link
                          to={`/learn/${course._id}`}
                          className="block font-bold text-sm text-slate-900 dark:text-white hover:text-violet-600 truncate"
                        >
                          {course.title}
                        </Link>

                        <p className="text-[11px] text-slate-400">
                          By {course.educator?.name || 'Educator'} ·{' '}
                          {totalLessons} lessons
                        </p>

                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>Progress</span>
                            <strong>{item.progressPercent}%</strong>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-violet-600 rounded-full"
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/learn/${course._id}`}
                        className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition shrink-0"
                        title="Open Classroom"
                      >
                        <span>Continue</span>
                        <ArrowRight size={14} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-xs">
                <GraduationCap
                  size={36}
                  className="mx-auto text-violet-400"
                />
                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Your learning journey starts here.
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Enroll in a course to start learning and track your progress here.
                </p>
                <Link
                  to="/courses"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700"
                >
                  <BookOpen size={14} /> Explore the Catalog
                </Link>
              </div>
            )}
          </section>

          {/* Sidebar Column */}
          <aside className="space-y-5">
            {/* Next Step Card */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50/30 dark:from-violet-950/40 dark:via-slate-900 dark:to-indigo-950/20 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
                <CalendarDays size={18} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Your Next Step
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {continueCourse
                  ? continueCourse.progressPercent >= 100
                    ? 'Choose what to learn next.'
                    : 'One lesson at a time.'
                  : 'Start with one small step.'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {continueCourse
                  ? continueCourse.progressPercent >= 100
                    ? 'You have completed a course! Discover another subject to keep building your skills.'
                    : `Continue ${continueCourse.course?.title || 'your course'} and make today count.`
                  : 'Find a course that sparks your curiosity and learn at your own pace.'}
              </p>
              <Link
                to={
                  continueCourse && continueCourse.progressPercent < 100
                    ? `/learn/${continueCourse.course?._id}`
                    : '/courses'
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline pt-1"
              >
                <span>
                  {continueCourse && continueCourse.progressPercent < 100
                    ? 'Continue Course'
                    : 'Find a Course'}
                </span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* AI Mentor Callout */}
            <div className="flex gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <Sparkles size={18} />
              </span>
              <div>
                <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                  Need a little clarity?
                </strong>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ask your EDUNEXA AI Mentor to explain a concept in a new way.
                </p>
                <Link
                  to="/ai-mentor"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <span>Ask the Mentor</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
