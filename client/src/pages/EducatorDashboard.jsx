import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Eye,
  EyeOff,
  Plus,
  Users,
  GraduationCap,
  TrendingUp,
  Pencil,
  Trash2,
  LayoutDashboard,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

const formatMoney = (amount, currency = 'usd') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  } catch {
    return `$${Number(amount || 0).toFixed(0)}`;
  }
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'courses', label: 'My Courses', icon: BookOpen },
  { id: 'students', label: 'Enrolled Learners', icon: Users },
  { id: 'assessments', label: 'Assessments & Grading', icon: ClipboardList },
];

export default function EducatorDashboard() {
  const { user } = useSession();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');
  const [busyId, setBusyId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [assessmentCourse, setAssessmentCourse] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizPrompt, setQuizPrompt] = useState('');
  const [quizOptions, setQuizOptions] = useState('');
  const [quizCorrect, setQuizCorrect] = useState('0');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [gradeValues, setGradeValues] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get('/educator/overview'),
      api.get('/educator/courses'),
      api.get('/educator/students'),
    ])
      .then(([overview, courseResponse, studentResponse]) => {
        if (cancelled) return;
        setData(overview.data);
        setCourses(courseResponse.data.courses || []);
        setStudents(studentResponse.data.students || []);
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (courses.length && !assessmentCourse)
      setAssessmentCourse(courses[0]._id);
    if (!courses.length) setAssessmentCourse('');
  }, [courses, assessmentCourse]);

  const stats = data?.stats || {};
  const publishedCount = courses.filter((course) => course.published).length;
  const draftCount = courses.length - publishedCount;
  const recentCourses = useMemo(() => courses.slice(0, 4), [courses]);

  const togglePublished = async (course) => {
    setBusyId(course._id);
    try {
      await api.put(`/courses/${course._id}`, {
        published: !course.published,
      });
      toast.success(
        course.published ? 'Course unpublished.' : 'Course published to catalog.'
      );
      setRefresh((n) => n + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  const deleteCourse = async (course) => {
    if (
      !window.confirm(
        `Are you sure you want to delete “${course.title}”? Courses with enrolled learners must be unpublished instead.`
      )
    )
      return;
    setBusyId(course._id);
    try {
      await api.delete(`/courses/${course._id}`);
      toast.success('Course deleted.');
      setRefresh((n) => n + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  const createQuiz = async (event) => {
    event.preventDefault();
    const options = quizOptions
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!assessmentCourse) return toast.error('Choose a course first.');
    if (options.length < 2)
      return toast.error('Add at least two answer options.');
    const correctIndex = Number(quizCorrect);
    if (correctIndex < 0 || correctIndex >= options.length) {
      return toast.error('Choose a valid correct option.');
    }
    try {
      await api.post(`/learning/courses/${assessmentCourse}/quizzes`, {
        title: quizTitle,
        questions: [{ prompt: quizPrompt, options, correctIndex, points: 1 }],
      });
      toast.success('Quiz created and available to enrolled learners.');
      setQuizTitle('');
      setQuizPrompt('');
      setQuizOptions('');
      setQuizCorrect('0');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    if (!assessmentCourse) return toast.error('Choose a course first.');
    try {
      await api.post(`/learning/courses/${assessmentCourse}/assignments`, {
        title: assignmentTitle,
        instructions: assignmentInstructions,
      });
      toast.success('Assignment published.');
      setAssignmentTitle('');
      setAssignmentInstructions('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await api.get('/learning/educator/submissions');
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const gradeSubmission = async (submission) => {
    const grade = Number(gradeValues[submission._id]);
    if (!Number.isFinite(grade)) {
      toast.error('Enter a numeric grade first.');
      return;
    }
    try {
      await api.patch(`/learning/submissions/${submission._id}/grade`, {
        grade,
        feedback: submission.feedbackDraft || '',
      });
      toast.success('Grade saved.');
      await loadSubmissions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const changeView = (nextView) => {
    setView(nextView);
    if (nextView === 'assessments') loadSubmissions();
  };

  const isEducator = user?.role === 'educator' || user?.role === 'admin';

  if (!isEducator) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Educator Studio Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            This area is reserved for Course Instructors & Educators. You are currently signed in as a{' '}
            <strong className="text-slate-700 dark:text-slate-200 capitalize">{user?.role || 'Student'}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
            >
              Go to My Learning (Student Dashboard)
            </Link>
            <Link
              to="/courses"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const statCards = [
    {
      label: 'Total Courses',
      value: loading ? '—' : stats.totalCourses ?? courses.length,
      detail: `${stats.publishedCourses ?? publishedCount} published · ${draftCount} in draft`,
      icon: BookOpen,
      color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    },
    {
      label: 'Enrolled Learners',
      value: loading ? '—' : stats.totalEnrollments ?? 0,
      detail: 'Students actively learning',
      icon: Users,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      label: 'Recorded Revenue',
      value: loading ? '—' : formatMoney(stats.totalRevenue, stats.currency),
      detail: 'Gross student enrollments',
      icon: CircleDollarSign,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Educator Studio Hero Header */}
        <header className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-800 p-6 sm:p-8 text-white shadow-md lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-violet-100 backdrop-blur-md">
                <GraduationCap size={13} />
                Educator Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-['Manrope']">
              Teach what you know.
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-violet-100 leading-relaxed">
              Welcome back, <strong className="text-white">{user?.name}</strong>. Create thoughtful learning experiences, organize curriculum, and monitor student progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/educator/new-course"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-violet-800 shadow-md transition hover:bg-violet-50 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create a New Course</span>
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map(({ label, value, detail, icon: Icon, color }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {detail}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${color}`}
                >
                  <Icon size={20} />
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Workspace Card & Tabs */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {/* Tabs Topbar */}
          <div className="border-b border-slate-200/80 px-5 pt-4 sm:px-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Educator Workspace
                </p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {tabs.find((tab) => tab.id === view)?.label || 'Overview'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRefresh((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-1 overflow-x-auto" aria-label="Educator sections">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => changeView(id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    view === id
                      ? 'border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  aria-current={view === id ? 'page' : undefined}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="space-y-3 py-6" aria-label="Loading educator data">
                <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            ) : (
              <>
                {/* View 1: Overview */}
                {view === 'overview' && (
                  <div className="space-y-6">
                    {/* Action Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => changeView('courses')}
                        className="rounded-2xl border border-slate-200/80 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50/40 dark:border-slate-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/20 cursor-pointer"
                      >
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          <BookOpen size={19} />
                        </span>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                          Manage Courses
                        </strong>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {courses.length} total courses · {draftCount} draft(s)
                        </span>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400">
                          View courses <ArrowRight size={13} />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => changeView('students')}
                        className="rounded-2xl border border-slate-200/80 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-slate-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 cursor-pointer"
                      >
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Users size={19} />
                        </span>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                          Enrolled Learners
                        </strong>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {students.length} learner records recorded
                        </span>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Track learners <ArrowRight size={13} />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => changeView('assessments')}
                        className="rounded-2xl border border-slate-200/80 p-5 text-left transition hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-800 dark:hover:border-amber-800 dark:hover:bg-amber-950/20 cursor-pointer"
                      >
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <ClipboardList size={19} />
                        </span>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                          Assessments & Quizzes
                        </strong>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          Create quizzes & grade assignments
                        </span>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          Open assessments <ArrowRight size={13} />
                        </span>
                      </button>
                    </div>

                    {/* Recent courses & checklist split */}
                    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                      {/* Recent Courses Column */}
                      <section className="rounded-2xl border border-slate-200/80 p-5 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Your Recent Courses
                            </h3>
                            <p className="text-xs text-slate-500">
                              Quick look at your teaching curriculum.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => changeView('courses')}
                            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                          >
                            View all
                          </button>
                        </div>

                        {recentCourses.length > 0 ? (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentCourses.map((c) => (
                              <div
                                key={c._id}
                                className="py-3 flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center shrink-0">
                                    <GraduationCap size={18} />
                                  </span>
                                  <div className="truncate">
                                    <strong className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                      {c.title}
                                    </strong>
                                    <small className="text-[11px] text-slate-400">
                                      {c.category || 'Development'} · {c.level || 'All levels'}
                                    </small>
                                  </div>
                                </div>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                    c.published
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {c.published ? 'Published' : 'Draft'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <GraduationCap
                              size={32}
                              className="mx-auto text-slate-300 dark:text-slate-600"
                            />
                            <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                              No courses created yet
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Start by creating your first course and adding lessons.
                            </p>
                            <Link
                              to="/educator/new-course"
                              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700"
                            >
                              <Plus size={14} /> Create Course
                            </Link>
                          </div>
                        )}
                      </section>

                      {/* Educator Checklist Column */}
                      <section className="rounded-2xl border border-slate-200/80 p-5 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Teaching Checklist
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Key steps to complete your studio setup.
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-3 text-xs">
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2
                              size={16}
                              className={
                                courses.length
                                  ? 'text-emerald-500 mt-0.5'
                                  : 'text-slate-300 mt-0.5'
                              }
                            />
                            <div>
                              <strong className="text-slate-800 dark:text-slate-200 block">
                                Create your course outline
                              </strong>
                              <span className="text-slate-500 text-[11px]">
                                {courses.length
                                  ? 'You have course drafts created.'
                                  : 'Draft your first curriculum module.'}
                              </span>
                            </div>
                          </li>

                          <li className="flex items-start gap-2.5">
                            <CheckCircle2
                              size={16}
                              className={
                                publishedCount
                                  ? 'text-emerald-500 mt-0.5'
                                  : 'text-slate-300 mt-0.5'
                              }
                            />
                            <div>
                              <strong className="text-slate-800 dark:text-slate-200 block">
                                Publish to public catalog
                              </strong>
                              <span className="text-slate-500 text-[11px]">
                                {publishedCount
                                  ? `${publishedCount} course(s) are currently live.`
                                  : 'Publish when lessons are ready for students.'}
                              </span>
                            </div>
                          </li>

                          <li className="flex items-start gap-2.5">
                            <CheckCircle2
                              size={16}
                              className={
                                students.length
                                  ? 'text-emerald-500 mt-0.5'
                                  : 'text-slate-300 mt-0.5'
                              }
                            />
                            <div>
                              <strong className="text-slate-800 dark:text-slate-200 block">
                                Engage with enrolled learners
                              </strong>
                              <span className="text-slate-500 text-[11px]">
                                {students.length
                                  ? `${students.length} students enrolled.`
                                  : 'Learners appear here as they enroll.'}
                              </span>
                            </div>
                          </li>
                        </ul>

                        <Link
                          to="/educator/new-course"
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700"
                        >
                          <Plus size={14} /> Add New Course
                        </Link>
                      </section>
                    </div>
                  </div>
                )}

                {/* View 2: My Courses Table */}
                {view === 'courses' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          My Courses ({courses.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Edit curriculum, update pricing, and toggle course visibility.
                        </p>
                      </div>
                      <Link
                        to="/educator/new-course"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 cursor-pointer shrink-0"
                      >
                        <Plus size={14} />
                        <span>Create New Course</span>
                      </Link>
                    </div>

                    {courses.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <table className="w-full min-w-[650px] text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Course</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Price</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {courses.map((course) => (
                              <tr
                                key={course._id}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                              >
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center shrink-0">
                                      <GraduationCap size={18} />
                                    </span>
                                    <div>
                                      <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                                        {course.title}
                                      </strong>
                                      <small className="text-slate-400">
                                        {course.category} · {course.level}
                                      </small>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      course.published
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    }`}
                                  >
                                    {course.published ? 'Published' : 'Draft'}
                                  </span>
                                </td>

                                <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                                  {course.price === 0
                                    ? 'Free'
                                    : `$${Number(course.price).toFixed(0)}`}
                                </td>

                                <td className="px-4 py-3.5 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    {/* Edit Button */}
                                    <Link
                                      to={`/educator/courses/${course._id}/edit`}
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                                      title="Edit course"
                                    >
                                      <Pencil size={13} />
                                    </Link>

                                    {/* Publish Toggle Button */}
                                    <button
                                      type="button"
                                      onClick={() => togglePublished(course)}
                                      disabled={busyId === course._id}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                                      title={
                                        course.published
                                          ? 'Unpublish course'
                                          : 'Publish course'
                                      }
                                    >
                                      {course.published ? (
                                        <>
                                          <EyeOff size={13} className="text-amber-600" />
                                          <span>Unpublish</span>
                                        </>
                                      ) : (
                                        <>
                                          <Eye size={13} className="text-emerald-600" />
                                          <span>Publish</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Preview Course Button */}
                                    <Link
                                      to={`/courses/${course._id}`}
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                                      title="Preview course as student"
                                    >
                                      <ArrowRight size={13} />
                                    </Link>

                                    {/* Delete Course Button */}
                                    <button
                                      type="button"
                                      onClick={() => deleteCourse(course)}
                                      disabled={busyId === course._id}
                                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
                                      title="Delete course"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center">
                        <GraduationCap
                          size={36}
                          className="mx-auto text-slate-300 dark:text-slate-600"
                        />
                        <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                          You haven't created any courses yet
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                          Create your first course to start sharing knowledge with students.
                        </p>
                        <Link
                          to="/educator/new-course"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700"
                        >
                          <Plus size={14} /> Create Your First Course
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* View 3: Learners */}
                {view === 'students' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Enrolled Learners ({students.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Track students enrolled in your courses and their learning progress.
                      </p>
                    </div>

                    {students.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <table className="w-full min-w-[650px] text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-3">Learner</th>
                              <th className="px-4 py-3">Enrolled Course</th>
                              <th className="px-4 py-3">Progress</th>
                              <th className="px-4 py-3">Enrolled Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {students.map((student, idx) => (
                              <tr
                                key={student.id || idx}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                              >
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold flex items-center justify-center shrink-0">
                                      {(student.name || 'L').slice(0, 1).toUpperCase()}
                                    </span>
                                    <div>
                                      <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                                        {student.name || 'Learner'}
                                      </strong>
                                      <small className="text-slate-400">
                                        {student.email || 'Student account'}
                                      </small>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                                  {student.course || 'Course'}
                                </td>

                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                      <div
                                        className="h-full bg-violet-600 rounded-full"
                                        style={{
                                          width: `${Math.max(
                                            0,
                                            Math.min(
                                              100,
                                              Number(student.progressPercent) || 0
                                            )
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                      {student.progressPercent || 0}%
                                    </span>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5 text-slate-400">
                                  {student.enrolledAt
                                    ? new Date(student.enrolledAt).toLocaleDateString()
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center">
                        <Users
                          size={32}
                          className="mx-auto text-slate-300 dark:text-slate-600"
                        />
                        <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                          No student enrollments yet
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          When students enroll in your published courses, their progress will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* View 4: Assessments & Grading */}
                {view === 'assessments' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Course Assessments & Grading
                      </h3>
                      <p className="text-xs text-slate-500">
                        Create quizzes and assignments, and review student submissions.
                      </p>
                    </div>

                    {/* Course Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select Target Course:
                      </label>
                      <select
                        value={assessmentCourse}
                        onChange={(e) => setAssessmentCourse(e.target.value)}
                        className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Form 1: Create Quiz */}
                      <form
                        onSubmit={createQuiz}
                        className="rounded-2xl border border-slate-200/80 p-5 dark:border-slate-800 space-y-3.5 bg-slate-50/50 dark:bg-slate-850"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                            Multiple-Choice Assessment
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            Create a Quiz
                          </h4>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Quiz Title *
                          </label>
                          <input
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. React Hooks Quiz"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Question Prompt *
                          </label>
                          <input
                            type="text"
                            value={quizPrompt}
                            onChange={(e) => setQuizPrompt(e.target.value)}
                            placeholder="e.g. What does useEffect return?"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Answer Options (one per line) *
                          </label>
                          <textarea
                            rows={3}
                            value={quizOptions}
                            onChange={(e) => setQuizOptions(e.target.value)}
                            placeholder={'Option A\nOption B\nOption C'}
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Correct Answer:
                          </label>
                          <select
                            value={quizCorrect}
                            onChange={(e) => setQuizCorrect(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          >
                            {quizOptions
                              .split('\n')
                              .map((v) => v.trim())
                              .filter(Boolean)
                              .map((opt, i) => (
                                <option key={i} value={i}>
                                  Option {i + 1}: {opt}
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={!assessmentCourse}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
                        >
                          <Plus size={14} /> Publish Quiz
                        </button>
                      </form>

                      {/* Form 2: Create Assignment */}
                      <form
                        onSubmit={createAssignment}
                        className="rounded-2xl border border-slate-200/80 p-5 dark:border-slate-800 space-y-3.5 bg-slate-50/50 dark:bg-slate-850"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            Hands-On Practice
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            Create an Assignment
                          </h4>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Assignment Title *
                          </label>
                          <input
                            type="text"
                            value={assignmentTitle}
                            onChange={(e) => setAssignmentTitle(e.target.value)}
                            placeholder="e.g. Build a Responsive Dashboard"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Instructions & Evaluation Criteria *
                          </label>
                          <textarea
                            rows={5}
                            value={assignmentInstructions}
                            onChange={(e) =>
                              setAssignmentInstructions(e.target.value)
                            }
                            placeholder="Explain what learners should build or write, and how it will be graded…"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!assessmentCourse}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
                        >
                          <Plus size={14} /> Publish Assignment
                        </button>
                      </form>
                    </div>

                    {/* Submissions Section */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Learner Submissions to Grade
                        </h4>
                        <p className="text-xs text-slate-500">
                          Review assignment submissions from enrolled learners.
                        </p>
                      </div>

                      {submissions.length > 0 ? (
                        <div className="space-y-3">
                          {submissions.map((sub) => (
                            <div
                              key={sub._id}
                              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                                  {sub.assignment?.title || 'Assignment'} · {sub.user?.name || 'Student'}
                                </strong>
                                <small className="text-[11px] text-slate-400">
                                  {sub.course?.title || 'Course'} · Submitted {new Date(sub.createdAt).toLocaleDateString()}
                                </small>
                                <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {sub.body}
                                </p>
                              </div>

                              <div className="flex sm:flex-col gap-2 shrink-0 sm:w-40">
                                <label className="text-[11px] font-semibold text-slate-500">
                                  Grade:
                                  <input
                                    type="number"
                                    min="0"
                                    max={sub.assignment?.maxPoints || 100}
                                    placeholder="Grade"
                                    value={
                                      gradeValues[sub._id] ?? sub.grade ?? ''
                                    }
                                    onChange={(e) =>
                                      setGradeValues((old) => ({
                                        ...old,
                                        [sub._id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs mt-0.5"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => gradeSubmission(sub)}
                                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition cursor-pointer"
                                >
                                  Save Grade
                                </button>
                                {sub.grade !== null && sub.grade !== undefined && (
                                  <span className="text-[10px] text-emerald-600 font-bold">
                                    Current: {sub.grade}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No student submissions awaiting review yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
