

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BarChart3, BookOpen, CircleDollarSign, Eye, EyeOff,
  Plus, Users, GraduationCap, TrendingUp, Pencil, Trash2,
  LayoutDashboard, ClipboardList, RefreshCw, CheckCircle2
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
  { id: 'courses', label: 'My courses', icon: BookOpen },
  { id: 'students', label: 'Learners', icon: Users },
  { id: 'assessments', label: 'Assessments', icon: ClipboardList },
];

const buttonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50';
const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
const fieldClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100';

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
    if (courses.length && !assessmentCourse) setAssessmentCourse(courses[0]._id);
    if (!courses.length) setAssessmentCourse('');
  }, [courses, assessmentCourse]);

  const stats = data?.stats || {};
  const publishedCount = courses.filter((course) => course.published).length;
  const draftCount = courses.length - publishedCount;
  const recentCourses = useMemo(() => courses.slice(0, 4), [courses]);

  const togglePublished = async (course) => {
    setBusyId(course._id);
    try {
      await api.put(`/courses/${course._id}`, { published: !course.published });
      toast.success(course.published ? 'Course unpublished.' : 'Course published.');
      setRefresh((n) => n + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  const deleteCourse = async (course) => {
    if (!window.confirm(`Delete “${course.title}”? Courses with learners must be unpublished instead.`)) return;
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
    const options = quizOptions.split('\n').map((value) => value.trim()).filter(Boolean);
    if (!assessmentCourse) return toast.error('Choose a course first.');
    if (options.length < 2) return toast.error('Add at least two answer options.');
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

  const statCards = [
    {
      label: 'Total courses',
      value: loading ? '—' : (stats.totalCourses ?? courses.length),
      detail: `${stats.publishedCourses ?? publishedCount} published and live`,
      icon: BookOpen,
      color: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Total enrollments',
      value: loading ? '—' : (stats.totalEnrollments ?? 0),
      detail: 'Learners across your courses',
      icon: Users,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Recorded revenue',
      value: loading ? '—' : formatMoney(stats.totalRevenue, stats.currency),
      detail: 'Successful recorded payments',
      icon: CircleDollarSign,
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-indigo-700 p-6 text-white shadow-lg sm:p-8 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-200">Educator studio</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Teach what you <span className="text-violet-200">know.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
              Welcome back, {user?.name?.split(' ')[0] || 'educator'}. Create thoughtful learning experiences and see how students are doing.
            </p>
          </div>
          <Link to="/educator/new-course" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold !text-violet-800 shadow-sm transition hover:bg-violet-50">
            <Plus size={18} />
            <span className="!text-violet-800">Create a course</span>
          </Link>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map(({ label, value, detail, icon: Icon, color }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                  <p className="mt-2 text-xs text-slate-500">{detail}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={21} />
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Your teaching workspace</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                  {tabs.find((tab) => tab.id === view)?.label || 'Overview'}
                </h2>
              </div>
              <button type="button" className={buttonSecondary} onClick={() => setRefresh((n) => n + 1)}>
                <RefreshCw size={15} /> Refresh data
              </button>
            </div>
            <nav className="flex gap-1 overflow-x-auto" aria-label="Educator sections">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => changeView(id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                    view === id
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                  aria-current={view === id ? 'page' : undefined}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-4" aria-label="Loading educator data">
                <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : (
              <>
                {view === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <button type="button" onClick={() => changeView('courses')} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50/50">
                        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><BookOpen size={20} /></span>
                        <span className="block font-bold text-slate-900">Manage courses</span>
                        <span className="mt-1 block text-sm text-slate-500">{courses.length} total · {draftCount} draft{draftCount === 1 ? '' : 's'}</span>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">Open courses <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                      </button>
                      <button type="button" onClick={() => changeView('students')} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50">
                        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Users size={20} /></span>
                        <span className="block font-bold text-slate-900">View learners</span>
                        <span className="mt-1 block text-sm text-slate-500">{students.length} learner record{students.length === 1 ? '' : 's'} available</span>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Open learners <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                      </button>
                      <button type="button" onClick={() => changeView('assessments')} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:border-orange-300 hover:bg-orange-50/50">
                        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><ClipboardList size={20} /></span>
                        <span className="block font-bold text-slate-900">Assessments</span>
                        <span className="mt-1 block text-sm text-slate-500">Create quizzes and assignments</span>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-700">Open assessments <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                      </button>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
                      <section className="rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                          <div>
                            <h3 className="font-bold text-slate-900">Your courses</h3>
                            <p className="mt-1 text-sm text-slate-500">A quick look at your latest course activity.</p>
                          </div>
                          <button type="button" onClick={() => changeView('courses')} className="text-sm font-semibold text-violet-700 hover:text-violet-900">View all</button>
                        </div>
                        {recentCourses.length ? (
                          <div className="divide-y divide-slate-100">
                            {recentCourses.map((course) => (
                              <div key={course._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><GraduationCap size={19} /></span>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">{course.title}</p>
                                    <p className="mt-1 text-xs text-slate-500">{course.category || 'General'} · {course.level || 'All levels'}</p>
                                  </div>
                                </div>
                                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${course.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${course.published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  {course.published ? 'Published' : 'Draft'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-10 text-center">
                            <GraduationCap className="mx-auto text-slate-300" size={32} />
                            <h4 className="mt-3 font-semibold text-slate-900">Your first course starts here</h4>
                            <p className="mt-1 text-sm text-slate-500">Create a course and add lessons for learners.</p>
                            <Link className={`${buttonPrimary} mt-4`} to="/educator/new-course"><Plus size={16} /> Create course</Link>
                          </div>
                        )}
                      </section>

                      <section className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={20} /></span>
                          <div><h3 className="font-bold text-slate-900">Teaching checklist</h3><p className="text-sm text-slate-500">A few steps to get started.</p></div>
                        </div>
                        <ul className="mt-5 space-y-4 text-sm">
                          <li className="flex items-start gap-3"><span className={`mt-0.5 ${courses.length ? 'text-emerald-600' : 'text-slate-300'}`}><CheckCircle2 size={18} /></span><span><strong className="text-slate-800">Create a course</strong><span className="mt-0.5 block text-slate-500">{courses.length ? 'You have created a course.' : 'Add your first course to your studio.'}</span></span></li>
                          <li className="flex items-start gap-3"><span className={`mt-0.5 ${publishedCount ? 'text-emerald-600' : 'text-slate-300'}`}><CheckCircle2 size={18} /></span><span><strong className="text-slate-800">Publish a course</strong><span className="mt-0.5 block text-slate-500">{publishedCount ? 'At least one course is live.' : 'Publish a course when it is ready.'}</span></span></li>
                          <li className="flex items-start gap-3"><span className={`mt-0.5 ${students.length ? 'text-emerald-600' : 'text-slate-300'}`}><CheckCircle2 size={18} /></span><span><strong className="text-slate-800">Connect with learners</strong><span className="mt-0.5 block text-slate-500">{students.length ? 'Learner records are available.' : 'Learners appear after they enroll.'}</span></span></li>
                        </ul>
                        <Link to="/educator/new-course" className={`${buttonPrimary} mt-6 w-full`}><Plus size={16} /> Create a course</Link>
                      </section>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-violet-950">
                      <TrendingUp size={21} className="mt-0.5 shrink-0 text-violet-700" />
                      <div><p className="font-semibold">Teach, learn, improve.</p><p className="mt-1 text-sm leading-5 text-violet-800">Review learner progress regularly and use course feedback to improve your next lesson.</p></div>
                      <BarChart3 size={36} className="ml-auto hidden shrink-0 text-violet-300 sm:block" />
                    </div>
                  </div>
                )}

                {view === 'courses' && (
                  <div>
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div><h3 className="font-bold text-slate-900">My courses</h3><p className="mt-1 text-sm text-slate-500">Edit course details, manage publishing, or preview your course.</p></div>
                      <Link to="/educator/new-course" className={buttonPrimary}><Plus size={16} /> Create a course</Link>
                    </div>
                    {courses.length ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[700px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Course</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Price</th><th className="px-4 py-3 font-semibold">Actions</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {courses.map((course) => (
                              <tr key={course._id} className="hover:bg-slate-50/70">
                                <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><GraduationCap size={18} /></span><div><p className="font-semibold text-slate-900">{course.title}</p><p className="mt-1 text-xs text-slate-500">{course.category || 'General'} · {course.level || 'All levels'}</p></div></div></td>
                                <td className="px-4 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${course.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${course.published ? 'bg-emerald-500' : 'bg-amber-500'}`} />{course.published ? 'Published' : 'Draft'}</span></td>
                                <td className="px-4 py-4 font-semibold text-slate-800">{course.price ? `$${Number(course.price).toFixed(0)}` : 'Free'}</td>
                                <td className="px-4 py-4"><div className="flex items-center gap-2">
                                  <Link className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" to={`/educator/courses/${course._id}/edit`} title="Edit course"><Pencil size={15} /></Link>
                                  <button type="button" className={buttonSecondary} onClick={() => togglePublished(course)} disabled={busyId === course._id} title={course.published ? 'Unpublish course' : 'Publish course'}>{course.published ? <EyeOff size={15} /> : <Eye size={15} />}{course.published ? 'Unpublish' : 'Publish'}</button>
                                  <Link className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" to={`/courses/${course._id}`} title="Preview course"><ArrowRight size={15} /></Link>
                                  <button type="button" className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" onClick={() => deleteCourse(course)} disabled={busyId === course._id} title="Delete course"><Trash2 size={15} /></button>
                                </div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
                        <GraduationCap className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-bold text-slate-900">Your first course is the start of something.</h3><p className="mt-2 text-sm text-slate-500">Create a course, add lessons, and publish it for learners to discover.</p><Link className={`${buttonPrimary} mt-5`} to="/educator/new-course"><Plus size={16} /> Create your first course</Link>
                      </div>
                    )}
                  </div>
                )}

                {view === 'students' && (
                  <div>
                    <div className="mb-5"><h3 className="font-bold text-slate-900">Learners</h3><p className="mt-1 text-sm text-slate-500">Track learners enrolled in your courses.</p></div>
                    {students.length ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[680px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Learner</th><th className="px-4 py-3 font-semibold">Course</th><th className="px-4 py-3 font-semibold">Progress</th><th className="px-4 py-3 font-semibold">Enrolled</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {students.map((student, index) => (
                              <tr key={student.id || `${student.name}-${index}`} className="hover:bg-slate-50/70">
                                <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">{(student.name || 'L').slice(0, 1).toUpperCase()}</span><div><p className="font-semibold text-slate-900">{student.name || 'Learner'}</p><p className="text-xs text-slate-500">{student.email || 'Edemy learner'}</p></div></div></td>
                                <td className="px-4 py-4 font-medium text-slate-800">{student.course || '—'}</td>
                                <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.max(0, Math.min(100, Number(student.progressPercent) || 0))}%` }} /></div><span className="text-xs text-slate-500">{Number(student.progressPercent) || 0}%</span></div></td>
                                <td className="px-4 py-4 text-slate-600">{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center"><Users size={32} className="mx-auto text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">Your learner list will appear here.</h3><p className="mt-2 text-sm text-slate-500">When students enroll in a published course, you can track their progress here.</p></div>}
                  </div>
                )}

                {view === 'assessments' && (
                  <div className="space-y-8">
                    <div className="max-w-sm"><label className="block text-sm font-semibold text-slate-700">Course<select className={fieldClass} value={assessmentCourse} onChange={(event) => setAssessmentCourse(event.target.value)}><option value="">Select a course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</select></label></div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <form className="space-y-4 rounded-2xl border border-slate-200 p-5" onSubmit={createQuiz}>
                        <div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Knowledge check</p><h3 className="mt-1 text-lg font-bold text-slate-900">Create a multiple-choice quiz</h3></div>
                        <label className="block text-sm font-medium text-slate-700">Quiz title<input className={fieldClass} required value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} placeholder="e.g. React fundamentals" /></label>
                        <label className="block text-sm font-medium text-slate-700">Question<input className={fieldClass} required value={quizPrompt} onChange={(event) => setQuizPrompt(event.target.value)} placeholder="What does useState return?" /></label>
                        <label className="block text-sm font-medium text-slate-700">Answer options (one per line)<textarea className={fieldClass} required rows={4} value={quizOptions} onChange={(event) => setQuizOptions(event.target.value)} placeholder={'A state value\nA state value and setter\nA component'} /></label>
                        <label className="block text-sm font-medium text-slate-700">Correct option<select className={fieldClass} value={quizCorrect} onChange={(event) => setQuizCorrect(event.target.value)}>{quizOptions.split('\n').map((value) => value.trim()).filter(Boolean).map((value, index) => <option value={index} key={`${index}-${value}`}>{index + 1}. {value}</option>)}</select></label>
                        <button className={buttonPrimary} type="submit" disabled={!assessmentCourse}><Plus size={16} /> Publish quiz</button>
                      </form>
                      <form className="space-y-4 rounded-2xl border border-slate-200 p-5" onSubmit={createAssignment}>
                        <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Applied learning</p><h3 className="mt-1 text-lg font-bold text-slate-900">Create an assignment</h3></div>
                        <label className="block text-sm font-medium text-slate-700">Assignment title<input className={fieldClass} required value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} placeholder="e.g. Build a small component" /></label>
                        <label className="block text-sm font-medium text-slate-700">Instructions<textarea className={fieldClass} required rows={7} value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} placeholder="Explain what students should submit and how it will be assessed." /></label>
                        <button className={buttonPrimary} type="submit" disabled={!assessmentCourse}><Plus size={16} /> Publish assignment</button>
                      </form>
                    </div>
                    <section>
                      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Learner work</p><h3 className="mt-1 text-lg font-bold text-slate-900">Submissions to grade</h3></div>
                      {submissions.length ? (
                        <div className="space-y-3">
                          {submissions.map((submission) => (
                            <article key={submission._id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                                <div className="min-w-0"><p className="font-semibold text-slate-900">{submission.assignment?.title || 'Assignment'} · {submission.user?.name || 'Learner'}</p><p className="mt-1 text-xs text-slate-500">{submission.course?.title || 'Course'} · submitted {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'date unavailable'}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.body}</p></div>
                                <div className="flex shrink-0 flex-col gap-2 lg:w-44"><label className="text-xs font-semibold text-slate-600">Grade<input className={fieldClass} type="number" min="0" max={submission.assignment?.maxPoints || 100} placeholder="Enter grade" value={gradeValues[submission._id] ?? submission.grade ?? ''} onChange={(event) => setGradeValues((old) => ({ ...old, [submission._id]: event.target.value }))} /></label><button type="button" className={buttonSecondary} onClick={() => gradeSubmission(submission)}>Save grade</button>{submission.grade !== null && submission.grade !== undefined && <span className="text-xs text-slate-500">Current grade: {submission.grade}</span>}</div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No submissions yet. Learner submissions will appear here.</p>}
                    </section>
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
