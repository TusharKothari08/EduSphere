import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Menu,
  Play,
  Sparkles,
  Video,
  StickyNote,
  Trash2,
  ClipboardList,
  Award,
  BookOpen,
  Send,
  HelpCircle,
  Code2,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

function videoEmbed(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be'))
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}?rel=0`;
    if (parsed.hostname.includes('youtube.com')) {
      const id =
        parsed.searchParams.get('v') ||
        parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return '';
  } catch {
    return '';
  }
}

export default function CoursePlayer() {
  const { id } = useParams();
  const { user } = useSession();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [expanded, setExpanded] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [marking, setMarking] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'quizzes' | 'assignments'

  useEffect(() => {
    api
      .get(`/courses/${id}/content`)
      .then(({ data }) => {
        setCourse(data.course);
        setEnrollment(data.enrollment || null);
        const firstLesson = data.course.sections?.flatMap(
          (section) => section.lessons || [],
        )[0];
        setSelectedId(firstLesson?._id || '');
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [id, refresh]);

  useEffect(() => {
    if (!course) return;
    setNotesLoading(true);
    Promise.all([
      api.get(`/learning/courses/${id}/notes`),
      api.get(`/learning/courses/${id}/quizzes`),
      api.get(`/learning/courses/${id}/assignments`),
    ])
      .then(([n, q, a]) => {
        setNotes(n.data.notes || []);
        setQuizzes(q.data.quizzes || []);
        setAssignments(a.data.assignments || []);
        setSubmissions(a.data.submissions || []);
      })
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, [course?._id, id]);

  const allLessons = useMemo(
    () =>
      (course?.sections || []).flatMap((section, sectionIndex) =>
        section.lessons.map((lesson, lessonIndex) => ({
          ...lesson,
          sectionTitle: section.title,
          sectionIndex,
          lessonIndex,
        })),
      ),
    [course],
  );

  const current =
    allLessons.find((lesson) => lesson._id === selectedId) || allLessons[0];
  const completedIds = enrollment?.completedLessonIds || [];
  const currentIndex = current
    ? allLessons.findIndex((lesson) => lesson._id === current._id)
    : -1;
  const embedUrl = videoEmbed(current?.videoUrl);
  const isCompleted = current && completedIds.includes(current._id);

  const markComplete = async () => {
    if (!current || marking) return;
    setMarking(true);
    try {
      const { data } = await api.post(
        `/courses/${id}/lessons/${current._id}/complete`,
      );
      if (data.completedLessonIds)
        setEnrollment((old) => ({
          ...old,
          progressPercent: data.progressPercent,
          completedLessonIds: data.completedLessonIds,
        }));
      toast.success(data.message || 'Lesson marked complete.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMarking(false);
    }
  };

  const issueCertificate = async () => {
    try {
      const { data } = await api.post(`/learning/courses/${id}/certificate`);
      setCertificate(data.certificate);
      toast.success('Course Certificate issued successfully!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const submitQuiz = async (quiz) => {
    try {
      const { data } = await api.post(
        `/learning/quizzes/${quiz._id}/attempts`,
        {
          answers: (quiz.questions || []).map((_, i) =>
            Number(quizAnswers[`${quiz._id}-${i}`] ?? -1),
          ),
        },
      );
      setQuizResults((old) => ({ ...old, [quiz._id]: data }));
      toast.success(`Assessment submitted: ${data.attempt.score}%`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const submitAssignment = async (assignment) => {
    try {
      const { data } = await api.post(
        `/learning/assignments/${assignment._id}/submissions`,
        {
          body: assignmentDrafts[assignment._id] || '',
        },
      );
      setSubmissions((old) => [
        ...old.filter((s) => s.assignment !== assignment._id),
        data.submission,
      ]);
      toast.success('Assignment code/answer submitted successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveNote = async () => {
    if (!noteDraft.trim()) return;
    try {
      const { data } = await api.post(`/learning/courses/${id}/notes`, {
        body: noteDraft,
        lessonId: current?._id || '',
      });
      setNotes((old) => [data.note, ...old]);
      setNoteDraft('');
      toast.success('Note saved to course notes.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteNote = async (note) => {
    try {
      await api.delete(`/learning/notes/${note._id}`);
      setNotes((old) => old.filter((n) => n._id !== note._id));
      toast.success('Note deleted.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const moveLesson = (direction) => {
    const next = allLessons[currentIndex + direction];
    if (next) {
      setSelectedId(next._id);
      setExpanded(next.sectionIndex);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Opening your learning workspace…
        </p>
      </div>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            We couldn't open this classroom.
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            The course may be private or your session may have expired.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
          >
            Back to Student Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to={user?.role === 'educator' ? '/educator' : '/dashboard'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">My Learning</span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              E
            </span>
            <div className="flex flex-col min-w-0">
              <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {course.title}
              </strong>
              <small className="text-[10px] text-slate-500 truncate">
                {course.educator?.name || 'EDUNEXA Instructor'} · {allLessons.length} Lessons
              </small>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            to={`/ai-mentor?courseId=${course._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition"
          >
            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Ask AI Mentor</span>
          </Link>

          <button
            onClick={() => setSidebarOpen((val) => !val)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
            aria-label="Toggle curriculum sidebar"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Video Stage & Lesson Details */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Cinema Video Stage */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={current?.title || course.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
                <span className="w-14 h-14 rounded-2xl bg-slate-800 text-indigo-400 flex items-center justify-center mb-3">
                  <Video size={28} />
                </span>
                <h3 className="text-sm font-bold text-white">
                  {current?.title || 'Interactive Lesson'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  No video stream is attached to this module. Read the course notes and practice the assessment below.
                </p>
              </div>
            )}

            {/* Video Chip Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-bold tracking-wider text-slate-200 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Lesson {Math.max(1, currentIndex + 1)}</span>
            </div>
          </div>

          {/* Lesson Title & Action Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  {course.title} / {current?.sectionTitle || 'Section'}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                  {current?.title || 'Choose a lesson to begin'}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {current?.durationMinutes || 0} min duration
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Play size={13} />
                    Lesson {Math.max(1, currentIndex + 1)} of {allLessons.length}
                  </span>
                </div>
              </div>

              {/* Mark Complete Button */}
              <button
                type="button"
                onClick={markComplete}
                disabled={!current || marking || isCompleted}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <Check size={16} />}
                <span>
                  {marking ? 'Saving…' : isCompleted ? 'Completed' : 'Mark Lesson Complete'}
                </span>
              </button>
            </div>

            {current?.description && (
              <p className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {current.description}
              </p>
            )}

            {/* Previous / Next Navigation */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => moveLesson(-1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={currentIndex < 0 || currentIndex >= allLessons.length - 1}
                onClick={() => moveLesson(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-sm"
              >
                <span>Next Lesson</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Practice & Interactive Tools (Tabs) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200/90 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <StickyNote size={14} />
                <span>Course Notes ({notes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quizzes')}
                className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'quizzes'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList size={14} />
                <span>Assessments & Quizzes ({quizzes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'assignments'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code2 size={14} />
                <span>Assignments ({assignments.length})</span>
              </button>
            </div>

            {/* Tab 1: Notes / Journal */}
            {activeTab === 'notes' && (
              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Personal Course Notes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capture key concepts, questions, and insights from this lesson.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Write a note about this lesson (e.g. key edge cases, time complexity)..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveNote}
                      disabled={!noteDraft.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-sm"
                    >
                      <StickyNote size={14} />
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-2.5 pt-3">
                  {notesLoading ? (
                    <p className="text-xs text-slate-400">Loading notes…</p>
                  ) : notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No notes recorded yet for this course. Start jotting down your insights above!
                    </p>
                  ) : (
                    notes
                      .filter((n) => !n.lessonId || n.lessonId === current?._id)
                      .map((note) => (
                        <div
                          key={note._id}
                          className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700"
                        >
                          <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {note.body}
                          </p>
                          <button
                            type="button"
                            onClick={() => deleteNote(note)}
                            className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                            aria-label="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Quizzes */}
            {activeTab === 'quizzes' && (
              <div className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Knowledge Checks & Quizzes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test your understanding of core concepts and multiple-choice questions.
                  </p>
                </div>

                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No quizzes have been created for this course yet.
                  </p>
                ) : (
                  quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            {quiz.title}
                          </strong>
                          <p className="text-[11px] text-slate-500">
                            {quiz.questions?.length || 0} questions · Pass Mark {quiz.passingScore}%
                          </p>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-4 pt-2">
                        {quiz.questions?.map((q, qi) => (
                          <fieldset key={qi} className="space-y-2">
                            <legend className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {qi + 1}. {q.prompt}
                            </legend>
                            <div className="space-y-1.5 pl-2">
                              {q.options?.map((option, oi) => (
                                <label
                                  key={oi}
                                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`${quiz._id}-${qi}`}
                                    checked={
                                      String(
                                        quizAnswers[`${quiz._id}-${qi}`] ?? '',
                                      ) === String(oi)
                                    }
                                    onChange={() =>
                                      setQuizAnswers((old) => ({
                                        ...old,
                                        [`${quiz._id}-${qi}`]: oi,
                                      }))
                                    }
                                    className="accent-indigo-600"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        ))}
                      </div>

                      {/* Result / Submit */}
                      {quizResults[quiz._id] ? (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-xs">
                          <strong className="text-emerald-800 dark:text-emerald-300">
                            Score: {quizResults[quiz._id].attempt.score}% ·{' '}
                            {quizResults[quiz._id].attempt.passed
                              ? 'Passed!'
                              : 'Keep practicing'}
                          </strong>
                          <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {
                              quizResults[quiz._id].explanations.filter(
                                (x) => !x.correct,
                              ).length
                            }{' '}
                            incorrect answer(s).
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => submitQuiz(quiz)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Submit Assessment
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Assignments */}
            {activeTab === 'assignments' && (
              <div className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Coding Problems & Assignments
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submit code solutions, GitHub repositories, or explanations for evaluation.
                  </p>
                </div>

                {assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No coding assignments uploaded for this course yet.
                  </p>
                ) : (
                  assignments.map((a) => {
                    const submission = submissions.find(
                      (s) =>
                        String(s.assignment?._id || s.assignment) === String(a._id),
                    );

                    return (
                      <div
                        key={a._id}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-sm font-bold text-slate-900 dark:text-white">
                              {a.title}
                            </strong>
                            <p className="text-[11px] text-slate-500">
                              {a.dueAt
                                ? `Due ${new Date(a.dueAt).toLocaleDateString()}`
                                : `${a.maxPoints} Points`}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {a.instructions}
                        </p>

                        {submission && (
                          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                            Submission recorded. Grade:{' '}
                            <strong className="text-indigo-600 dark:text-indigo-400">
                              {submission.grade ?? 'Under review by Educator'}
                            </strong>
                          </div>
                        )}

                        <textarea
                          rows={3}
                          value={assignmentDrafts[a._id] || ''}
                          onChange={(e) =>
                            setAssignmentDrafts((old) => ({
                              ...old,
                              [a._id]: e.target.value,
                            }))
                          }
                          placeholder="Paste your code solution or write your response…"
                          className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          onClick={() => submitAssignment(a)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                        >
                          Submit Solution
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right: Collapsible Curriculum Drawer */}
        {sidebarOpen && (
          <aside className="w-full lg:w-88 border-l border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
            {/* Curriculum Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Course Content
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {enrollment?.progressPercent || 0}% Complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                  style={{ width: `${enrollment?.progressPercent || 0}%` }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {completedIds.length} of {allLessons.length} lessons finished
                </span>
                {enrollment?.progressPercent >= 100 && (
                  <span className="text-emerald-500 font-bold">Completed</span>
                )}
              </div>

              {/* Course Certificate Button if 100% */}
              {enrollment?.progressPercent >= 100 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={issueCertificate}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <Award size={15} />
                    <span>Claim Certificate</span>
                  </button>
                  {certificate && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-center">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Certificate Verified: {certificate.code}
                      </p>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="mt-1 text-[11px] underline font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer"
                      >
                        Print / Download PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sections Accordion */}
            <div className="space-y-2.5">
              {course.sections.map((section, index) => {
                const isExpanded = expanded === index;

                return (
                  <div
                    key={section._id || index}
                    className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? -1 : index)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50/70 dark:bg-slate-850 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="truncate">
                          <strong className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                            {section.title}
                          </strong>
                          <small className="text-[10px] text-slate-400">
                            {section.lessons.length} lessons
                          </small>
                        </div>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Lesson Items */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {section.lessons.map((lesson) => {
                          const done = completedIds.includes(lesson._id);
                          const active = selectedId === lesson._id;

                          return (
                            <button
                              key={lesson._id}
                              type="button"
                              onClick={() => setSelectedId(lesson._id)}
                              className={`w-full flex items-center gap-2.5 p-3 text-left transition cursor-pointer ${
                                active
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-600'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="shrink-0">
                                {done ? (
                                  <CheckCircle2
                                    size={15}
                                    className="text-emerald-500"
                                  />
                                ) : active ? (
                                  <Play
                                    size={13}
                                    className="text-indigo-600 fill-current"
                                  />
                                ) : (
                                  <Circle
                                    size={14}
                                    className="text-slate-300 dark:text-slate-600"
                                  />
                                )}
                              </span>

                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold block truncate">
                                  {lesson.title}
                                </span>
                                <small className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock3 size={10} />
                                  {lesson.durationMinutes || 0} min
                                </small>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Mentor Callout */}
            <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border border-indigo-200/80 dark:border-indigo-800/80 flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                  Stuck on this concept?
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Ask your 24/7 AI Interviewer for quick hints or solution walkthroughs.
                </p>
                <Link
                  to={`/ai-mentor?courseId=${course._id}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Chat with AI</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
