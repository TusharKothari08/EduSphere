import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Circle, Clock3, Menu, Play, Sparkles, Video, StickyNote, Trash2, ClipboardList } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

function videoEmbed(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}?rel=0`;
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return '';
  } catch { return ''; }
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

  useEffect(() => {
    api.get(`/courses/${id}/content`).then(({ data }) => {
      setCourse(data.course); setEnrollment(data.enrollment || null);
      const firstLesson = data.course.sections?.flatMap((section) => section.lessons || [])[0];
      setSelectedId(firstLesson?._id || '');
    }).catch((error) => toast.error(getErrorMessage(error))).finally(() => setLoading(false));
  }, [id, refresh]);

  useEffect(() => { if (!course) return; setNotesLoading(true); Promise.all([api.get(`/learning/courses/${id}/notes`), api.get(`/learning/courses/${id}/quizzes`), api.get(`/learning/courses/${id}/assignments`)]).then(([n,q,a]) => { setNotes(n.data.notes || []); setQuizzes(q.data.quizzes || []); setAssignments(a.data.assignments || []); setSubmissions(a.data.submissions || []); }).catch(() => {}).finally(() => setNotesLoading(false)); }, [course?._id, id]);

  const allLessons = useMemo(() => (course?.sections || []).flatMap((section, sectionIndex) => section.lessons.map((lesson, lessonIndex) => ({ ...lesson, sectionTitle: section.title, sectionIndex, lessonIndex }))), [course]);
  const current = allLessons.find((lesson) => lesson._id === selectedId) || allLessons[0];
  const completedIds = enrollment?.completedLessonIds || [];
  const currentIndex = current ? allLessons.findIndex((lesson) => lesson._id === current._id) : -1;
  const embedUrl = videoEmbed(current?.videoUrl);
  const isCompleted = current && completedIds.includes(current._id);

  const markComplete = async () => {
    if (!current || marking) return;
    setMarking(true);
    try {
      const { data } = await api.post(`/courses/${id}/lessons/${current._id}/complete`);
      if (data.completedLessonIds) setEnrollment((old) => ({ ...old, progressPercent: data.progressPercent, completedLessonIds: data.completedLessonIds }));
      else toast.success(data.message || 'Lesson marked complete.');
      if (data.completedLessonIds) toast.success('Lesson marked complete.');
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setMarking(false); }
  };
  const issueCertificate = async () => { try { const { data } = await api.post(`/learning/courses/${id}/certificate`); setCertificate(data.certificate); toast.success('Certificate issued successfully.'); } catch (error) { toast.error(getErrorMessage(error)); } };
  const submitQuiz = async (quiz) => { try { const { data } = await api.post(`/learning/quizzes/${quiz._id}/attempts`, { answers: (quiz.questions || []).map((_, i) => Number(quizAnswers[`${quiz._id}-${i}`] ?? -1)) }); setQuizResults(old => ({ ...old, [quiz._id]: data })); toast.success(`Quiz submitted: ${data.attempt.score}%`); } catch (error) { toast.error(getErrorMessage(error)); } };
  const submitAssignment = async (assignment) => { try { const { data } = await api.post(`/learning/assignments/${assignment._id}/submissions`, { body: assignmentDrafts[assignment._id] || '' }); setSubmissions(old => [...old.filter(s => s.assignment !== assignment._id), data.submission]); toast.success('Assignment submitted.'); } catch (error) { toast.error(getErrorMessage(error)); } };
  const saveNote = async () => { if (!noteDraft.trim()) return; try { const { data } = await api.post(`/learning/courses/${id}/notes`, { body: noteDraft, lessonId: current?._id || '' }); setNotes(old => [data.note, ...old]); setNoteDraft(''); toast.success('Note saved to your learning journal.'); } catch (error) { toast.error(getErrorMessage(error)); } };
  const deleteNote = async (note) => { try { await api.delete(`/learning/notes/${note._id}`); setNotes(old => old.filter(n => n._id !== note._id)); toast.success('Note deleted.'); } catch (error) { toast.error(getErrorMessage(error)); } };
  const moveLesson = (direction) => { const next = allLessons[currentIndex + direction]; if (next) { setSelectedId(next._id); setExpanded(next.sectionIndex); } };

  if (loading) return <div className="page-loading"><span className="spinner" /><p>Opening your classroom…</p></div>;
  if (!course) return <main className="container page-shell"><div className="empty-state"><h2>We couldn't open this course.</h2><Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link></div></main>;

  return <main className={`learning-player-page ${sidebarOpen ? '' : 'sidebar-collapsed'}`}><header className="player-topbar"><Link to={user?.role === 'educator' ? '/educator' : '/dashboard'} className="player-back"><ArrowLeft size={16} /> <span>My learning</span></Link><div className="player-course-title"><span className="player-brand-mark">E</span><span><strong>{course.title}</strong><small>{course.educator?.name || 'Edemy course'}</small></span></div><div className="player-top-actions"><Link to={`/ai-mentor?courseId=${course._id}`} className="player-mentor-link"><Sparkles size={16} /> Ask AI Mentor</Link><button className="player-sidebar-toggle" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle lesson list"><Menu size={19} /></button></div></header>
    <div className="player-layout"><section className="lesson-stage"><div className="video-stage">{embedUrl ? <iframe src={embedUrl} title={current?.title || course.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : <div className="video-placeholder"><span><Video size={35} /></span><h3>{current?.title || 'Your lesson'}</h3><p>This lesson doesn't have a video URL yet. Add a YouTube or Vimeo URL from the educator studio.</p></div>}<div className="video-top-chip"><span className="video-live-dot" /> COURSE PLAYER</div></div>
      <div className="lesson-info"><div className="lesson-breadcrumb">{course.title} <span>/</span> {current?.sectionTitle || 'Course lesson'}</div><div className="lesson-title-row"><div><h1>{current?.title || 'Choose a lesson to begin'}</h1><div className="lesson-meta"><span><Clock3 size={14} /> {current?.durationMinutes || 0} min</span><span><Play size={13} /> Lesson {Math.max(1, currentIndex + 1)} of {allLessons.length}</span></div></div><button onClick={markComplete} className={`btn ${isCompleted ? 'btn-completed' : 'btn-primary'}`} disabled={!current || marking || isCompleted}>{isCompleted ? <CheckCircle2 size={17} /> : <Check size={17} />}{marking ? 'Saving…' : isCompleted ? 'Completed' : 'Mark complete'}</button></div>{current?.description && <p className="lesson-description">{current.description}</p>}
      <div className="lesson-navigation"><button className="btn btn-outline" disabled={currentIndex <= 0} onClick={() => moveLesson(-1)}><ArrowLeft size={15} /> Previous lesson</button><button className="btn btn-primary" disabled={currentIndex < 0 || currentIndex >= allLessons.length - 1} onClick={() => moveLesson(1)}>Next lesson <ArrowRight size={15} /></button></div>
      <div className="player-lower-cards"><div className="player-note-card player-journal-card"><span className="player-note-icon"><StickyNote size={18} /></span><div className="journal-content"><strong>Learning journal</strong><p>Capture an idea from this lesson. Notes are saved to your account.</p><textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="Write a note about this lesson…" rows={3} /><button className="btn btn-primary btn-small" onClick={saveNote} disabled={!noteDraft.trim()}>Save note</button>{notesLoading ? <small>Loading notes…</small> : notes.filter(n => !n.lessonId || n.lessonId === current?._id).slice(0,4).map(note => <div className="saved-note" key={note._id}><p>{note.body}</p><button aria-label="Delete note" onClick={() => deleteNote(note)}><Trash2 size={14}/></button></div>)}</div></div><div className="player-progress-card"><div className="progress-card-head"><span>YOUR PROGRESS</span><strong>{enrollment?.progressPercent || 0}%</strong></div><div className="progress-track"><span style={{ width: `${enrollment?.progressPercent || 0}%` }} /></div><small>{completedIds.length} of {allLessons.length} lessons completed</small>{enrollment?.progressPercent >= 100 && <button className="btn btn-primary btn-small certificate-action" onClick={issueCertificate}>Get certificate</button>}{certificate && <div className="certificate-result"><strong>Certificate issued</strong><small>{certificate.code}</small><button className="btn btn-outline btn-small" onClick={()=>window.print()}>Print certificate</button></div>}</div></div>
      
      <section className="learning-tools-section"><div className="learning-tools-heading"><span className="section-kicker">PRACTICE & APPLY</span><h2>Quizzes and assignments</h2><p>Check your understanding and put what you learned into practice.</p></div>{quizzes.map(quiz => <article className="learning-tool-card" key={quiz._id}><div className="learning-tool-title"><ClipboardList size={18}/><div><strong>{quiz.title}</strong><small>{quiz.questions?.length || 0} questions · pass mark {quiz.passingScore}%</small></div></div>{quiz.questions?.map((q, qi)=><fieldset className="quiz-question" key={qi}><legend>{qi+1}. {q.prompt}</legend>{q.options?.map((option, oi)=><label key={oi}><input type="radio" name={`${quiz._id}-${qi}`} checked={String(quizAnswers[`${quiz._id}-${qi}`] ?? '')===String(oi)} onChange={()=>setQuizAnswers(old=>({...old,[`${quiz._id}-${qi}`]:oi}))}/>{option}</label>)}</fieldset>)}{quizResults[quiz._id] ? <div className="quiz-result"><strong>{quizResults[quiz._id].attempt.score}% · {quizResults[quiz._id].attempt.passed?'Passed':'Keep practicing'}</strong><p>{quizResults[quiz._id].explanations.filter(x=>!x.correct).length} answer(s) to review.</p></div> : <button className="btn btn-primary btn-small" onClick={()=>submitQuiz(quiz)}>Submit quiz</button>}</article>)}{!quizzes.length && <div className="learning-tool-empty">No quizzes have been added to this course yet.</div>}{assignments.map(a=><article className="learning-tool-card" key={a._id}><div className="learning-tool-title"><ClipboardList size={18}/><div><strong>{a.title}</strong><small>{a.dueAt?`Due ${new Date(a.dueAt).toLocaleDateString()}`:`${a.maxPoints} points`}</small></div></div><p>{a.instructions}</p>{submissions.some(s => String(s.assignment?._id || s.assignment)===String(a._id)) && <p className="submission-feedback">Submission saved. Grade: {submissions.find(s=>String(s.assignment?._id || s.assignment)===String(a._id))?.grade ?? 'Awaiting review'}</p>}<textarea rows={3} value={assignmentDrafts[a._id]||''} onChange={e=>setAssignmentDrafts(old=>({...old,[a._id]:e.target.value}))} placeholder="Write your submission…"/><button className="btn btn-outline btn-small" onClick={()=>submitAssignment(a)}>Submit assignment</button></article>)}</section>
</div></section>
      <aside className="lesson-sidebar"><div className="lesson-sidebar-head"><div><span className="section-kicker">YOUR CURRICULUM</span><h2>Course content</h2></div><span className="lesson-total-pill">{allLessons.length} lessons</span></div><div className="sidebar-progress"><div><span>Progress</span><strong>{enrollment?.progressPercent || 0}%</strong></div><div className="progress-track"><span style={{ width: `${enrollment?.progressPercent || 0}%` }} /></div></div><div className="lesson-section-list">{course.sections.map((section, index) => <div className="player-section" key={section._id || index}><button className="player-section-toggle" onClick={() => setExpanded(expanded === index ? -1 : index)}><span className="section-bullet">{String(index + 1).padStart(2, '0')}</span><span><strong>{section.title}</strong><small>{section.lessons.length} lessons</small></span><ChevronDown size={15} className={expanded === index ? 'rotate' : ''} /></button>{expanded === index && <div className="player-lesson-list">{section.lessons.map((lesson, lessonIndex) => {
        const done = completedIds.includes(lesson._id);
        const active = selectedId === lesson._id;
        return <button key={lesson._id} className={`player-lesson-item ${active ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => setSelectedId(lesson._id)}><span className="lesson-status-icon">{done ? <CheckCircle2 size={16} /> : active ? <Play size={15} fill="currentColor" /> : <Circle size={15} />}</span><span className="player-lesson-label"><strong>{lesson.title}</strong><small><Clock3 size={11} /> {lesson.durationMinutes || 0} min</small></span></button>;
      })}</div>}</div>)}</div><div className="sidebar-help"><Sparkles size={17} /><div><strong>Need a hand?</strong><p>Your AI Mentor is ready for questions.</p><Link to={`/ai-mentor?courseId=${course._id}`}>Ask the mentor <ArrowRight size={13} /></Link></div></div></aside></div>
  </main>;
}
