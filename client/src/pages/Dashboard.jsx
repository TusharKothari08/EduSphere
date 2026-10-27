import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Flame, GraduationCap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';

const fallbackImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

export default function Dashboard() {
  const { user } = useSession();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [certificates, setCertificates] = useState([]);
  useEffect(() => { Promise.all([api.get('/enrollments/me'), api.get('/learning/certificates/me')]).then(([e,c]) => { setEnrollments(e.data.enrollments || []); setCertificates(c.data.certificates || []); }).catch((error) => toast.error(getErrorMessage(error))).finally(() => setLoading(false)); }, [refresh]);
  const completed = enrollments.filter((item) => item.progressPercent >= 100).length;
  const totalProgress = enrollments.length ? Math.round(enrollments.reduce((total, item) => total + item.progressPercent, 0) / enrollments.length) : 0;
  const continueCourse = enrollments.find((item) => item.progressPercent < 100) || enrollments[0];

  return <main className="container page-shell dashboard-page">
    <div className="dashboard-welcome"><div><span className="section-kicker">YOUR LEARNING SPACE</span><h1>Keep your momentum, <span className="highlight-text">{user?.name?.split(' ')[0] || 'learner'}.</span></h1><p>Every lesson is progress. Here's where your learning stands today.</p></div><Link className="btn btn-primary" to="/courses">Explore courses <ArrowRight size={16} /></Link></div>
    <div className="stats-grid student-stats"><div className="stat-card"><span className="stat-icon icon-violet"><BookOpen size={19} /></span><div><small>Courses enrolled</small><strong>{loading ? '—' : enrollments.length}</strong><span>your active learning paths</span></div></div><div className="stat-card"><span className="stat-icon icon-mint"><CheckCircle2 size={19} /></span><div><small>Courses completed</small><strong>{loading ? '—' : completed}</strong><span>milestones you've reached</span></div></div><div className="stat-card"><span className="stat-icon icon-peach"><Flame size={19} /></span><div><small>Overall progress</small><strong>{loading ? '—' : `${totalProgress}%`}</strong><span>across your courses</span></div></div></div>
    {certificates.length > 0 && <section className="certificate-library"><div className="dashboard-section-heading"><div><span className="section-kicker">YOUR ACHIEVEMENTS</span><h2>Certificates earned</h2></div></div><div className="certificate-library-grid">{certificates.map(c=><article key={c._id} className="certificate-library-card"><span className="certificate-medal"><GraduationCap size={22}/></span><div><strong>{c.course?.title || 'Completed course'}</strong><small>Issued {new Date(c.issuedAt).toLocaleDateString()}</small><code>{c.code}</code></div><button className="btn btn-outline btn-small" onClick={()=>window.print()}>Print</button></article>)}</div></section>}
    <div className="dashboard-content-grid"><section className="dashboard-main-column"><div className="dashboard-section-heading"><div><span className="section-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>Continue learning</h2></div><Link className="text-link" to="/courses">Browse more <ArrowRight size={15} /></Link></div>
      {loading ? <div className="dashboard-course-skeleton" /> : enrollments.length ? <div className="enrolled-list">{enrollments.map((item) => {
        const course = item.course; if (!course) return null;
        const lessonCount = (course.sections || []).reduce((total, section) => total + (section.lessons || []).length, 0);
        return <article className="enrolled-course" key={item._id}><Link to={`/learn/${course._id}`} className="enrolled-image"><img src={course.thumbnail || fallbackImage} alt="" onError={(event) => { event.currentTarget.src = fallbackImage; }} /></Link><div className="enrolled-details"><div className="enrolled-topline"><span>{course.category}</span><small>{item.progressPercent >= 100 ? 'Completed' : item.progressPercent > 0 ? 'In progress' : 'Ready to start'}</small></div><Link className="enrolled-title" to={`/learn/${course._id}`}>{course.title}</Link><p>By {course.educator?.name || 'Edemy educator'} · {lessonCount} lessons</p><div className="progress-label-row"><span>Course progress</span><strong>{item.progressPercent}%</strong></div><div className="progress-track"><span style={{ width: `${item.progressPercent}%` }} /></div></div><Link className="round-arrow" to={`/learn/${course._id}`} aria-label={`Continue ${course.title}`}><ArrowRight size={17} /></Link></article>;
      })}</div> : <div className="empty-state dashboard-empty"><span className="empty-illustration"><GraduationCap size={30} /></span><h3>Your learning journey starts here.</h3><p>Enroll in a course and your progress will show up here.</p><Link className="btn btn-primary" to="/courses">Explore the catalog <ArrowRight size={16} /></Link></div>}
      </section>
      <aside className="dashboard-side-column"><div className="next-step-card"><div className="next-step-icon"><CalendarDays size={20} /></div><span className="section-kicker">YOUR NEXT STEP</span><h3>{continueCourse ? (continueCourse.progressPercent >= 100 ? 'Choose what to learn next.' : 'One lesson at a time.') : 'Start with one small step.'}</h3><p>{continueCourse ? (continueCourse.progressPercent >= 100 ? 'You have completed a course. Explore a new topic to keep growing.' : `Continue ${continueCourse.course?.title || 'your course'} and build on the work you've already done.`) : 'Find a course that sparks your curiosity, then learn at a pace that feels right.'}</p><Link to={continueCourse && continueCourse.progressPercent < 100 ? `/learn/${continueCourse.course?._id}` : '/courses'} className="next-step-link">{continueCourse && continueCourse.progressPercent < 100 ? 'Continue course' : 'Find a course'} <ArrowRight size={15} /></Link><div className="next-step-decoration">✦</div></div><div className="mentor-mini-card"><div className="mentor-mini-icon"><Sparkles size={20} /></div><div><strong>Need a little clarity?</strong><p>Ask your AI Mentor to explain a concept in a new way.</p><Link to="/ai-mentor">Ask the mentor <ArrowRight size={14} /></Link></div></div><div className="learning-tip"><span className="tip-label">A SMALL LEARNING TIP</span><p>Try explaining a new concept out loud in your own words. Teaching it back is a simple way to check what has really clicked.</p></div></aside>
    </div>
  </main>;
}
