import { Link } from 'react-router-dom';
import { GraduationCap, Heart } from 'lucide-react';

export default function Footer() {
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div><Link className="brand footer-brand" to="/"><span className="brand-mark"><GraduationCap size={22} /></span><span>EDUNEXA<span className="brand-dot">.</span></span></Link><p>Practical learning for curious people. Build skills, create momentum, and learn at your own pace.</p></div>
      <div><strong>Learn</strong><Link to="/courses">Browse courses</Link><Link to="/ai-mentor">AI Mentor</Link><Link to="/dashboard">My learning</Link></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} EDUNEXA LMS</span><span>Made for learners <Heart size={13} fill="currentColor" /></span></div>
  </footer>;
}
