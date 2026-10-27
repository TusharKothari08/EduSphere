import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Play, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import CourseCard from '../components/CourseCard';

const categories = [
  { icon: '01', name: 'Development', text: 'Ship websites, apps, and ideas.' },
  { icon: '02', name: 'Data & Analytics', text: 'Find the story hidden in data.' },
  { icon: '03', name: 'Design', text: 'Make useful things feel simple.' },
  { icon: '04', name: 'Business', text: 'Build skills that move work forward.' }
];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/courses', { params: { limit: 3, sort: 'rating' } }).then(({ data }) => setCourses(data.courses || [])).catch(() => setCourses([])).finally(() => setLoading(false));
  }, []);

  return <>
    <section className="hero-section">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pulse" /> A better way to keep growing</div>
          <h1>Make your next skill<br /><span className="highlight-text">your strongest one.</span></h1>
          <p className="hero-lede">Expert-led courses, a learning path that fits your life, and an AI mentor for the moments you get stuck.</p>
          <div className="hero-actions"><Link className="btn btn-primary btn-lg" to="/courses">Explore courses <ArrowRight size={17} /></Link><Link className="btn btn-white btn-lg" to="/signup"><Play size={15} fill="currentColor" /> Start learning free</Link></div>
          <div className="hero-trust"><div className="avatar-stack"><span>R</span><span>A</span><span>M</span><span>+</span></div><div><strong>Small steps. Real momentum.</strong><span>Learn at your pace, on your terms.</span></div></div>
        </div>
        <div className="hero-visual" aria-label="Learning dashboard preview">
          <div className="visual-glow" />
          <div className="floating-note note-top"><span className="note-icon mint"><CheckCircle2 size={17} /></span><div><strong>One more lesson</strong><small>You're building a habit.</small></div></div>
          <div className="learning-panel">
            <div className="panel-topline"><div><span className="panel-overline">YOUR LEARNING SPACE</span><h3>Keep the spark going.</h3></div><span className="tiny-avatar">R</span></div>
            <div className="panel-course-image"><img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=900&q=85" alt="Code displayed on a laptop" /><span className="play-button"><Play size={18} fill="currentColor" /></span></div>
            <div className="panel-course-info"><div><strong>Modern React & TypeScript</strong><small>Module 2 · Build interactive UI</small></div><span className="progress-label">25%</span></div>
            <div className="progress-track"><span style={{ width: '25%' }} /></div>
            <div className="panel-bottom"><span><BookOpen size={14} /> 4 lessons in this path</span><span className="mini-badge"><Zap size={12} fill="currentColor" /> Keep going</span></div>
          </div>
          <div className="floating-note note-bottom"><span className="note-icon violet"><Sparkles size={17} /></span><div><strong>Your AI Mentor</strong><small>Concepts made clearer.</small></div><ArrowUpRight size={16} className="note-arrow" /></div>
          <div className="visual-caption"><span className="caption-dot" /> LEARNING THAT MOVES WITH YOU</div>
        </div>
      </div>
      <div className="hero-bottom-fade" />
    </section>

    <section className="trust-strip"><div className="container trust-inner"><span>BUILT FOR CURIOUS MINDS</span><div><Users size={17} /> A learner-first experience</div><div><Sparkles size={17} /> Support when you need it</div><div><CheckCircle2 size={17} /> Progress you can see</div></div></section>

    <section className="section-pad categories-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">FIND YOUR DIRECTION</span><h2>Learn what moves you.</h2><p>Start with a curiosity. Leave with a skill you can use.</p></div><Link to="/courses" className="text-link larger-link">Browse all topics <ArrowRight size={17} /></Link></div>
      <div className="category-grid">{categories.map((item) => <Link to={`/courses?category=${encodeURIComponent(item.name)}`} className="category-tile" key={item.name}><span className="category-number">{item.icon}</span><div><h3>{item.name}</h3><p>{item.text}</p></div><ArrowUpRight className="category-arrow" size={17} /></Link>)}</div>
    </div></section>

    <section className="section-pad featured-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">A GOOD PLACE TO BEGIN</span><h2>Popular learning paths.</h2><p>Thoughtful courses to help you make your next move.</p></div><Link to="/courses" className="text-link larger-link">See all courses <ArrowRight size={17} /></Link></div>
      {loading ? <div className="course-grid">{[1,2,3].map((n) => <div className="course-skeleton" key={n}><div /><span /><span /></div>)}</div> : courses.length ? <div className="course-grid">{courses.slice(0, 3).map((course) => <CourseCard course={course} key={course._id} />)}</div> : <div className="empty-inline"><BookOpen size={21} /><div><strong>Your next course is waiting.</strong><p>Connect the database and run the seed script to load the sample catalog.</p></div></div>}
    </div></section>

    <section className="mentor-band"><div className="container mentor-band-inner"><div className="mentor-art"><div className="mentor-orbit orbit-a" /><div className="mentor-orbit orbit-b" /><div className="mentor-center"><Sparkles size={39} /></div><span className="orbit-chip chip-one">Explain it simply</span><span className="orbit-chip chip-two">Try an example</span><span className="orbit-chip chip-three">Ask anything</span></div><div className="mentor-copy"><span className="section-kicker light-kicker">MEET YOUR LEARNING COMPANION</span><h2>Stuck on a concept?<br /><em>Don't stop there.</em></h2><p>Your AI Mentor can unpack tricky ideas, give examples, and help you find a next step—all without leaving your learning space.</p><Link className="btn btn-lime btn-lg" to="/ai-mentor">Meet the AI Mentor <ArrowRight size={17} /></Link><div className="mentor-points"><span><CheckCircle2 size={15} /> Clear explanations</span><span><CheckCircle2 size={15} /> Step-by-step guidance</span></div></div></div></section>

    <section className="section-pad final-cta"><div className="container final-cta-inner"><div><span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>Progress beats perfect.<br /><span>Start where you are.</span></h2></div><div><p>Choose a course, set your own pace, and let every lesson move you forward.</p><Link className="btn btn-primary btn-lg" to="/courses">Find your first course <ArrowRight size={17} /></Link></div></div></section>
  </>;
}
