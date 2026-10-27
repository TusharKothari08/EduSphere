import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, GraduationCap, LogOut, Menu, Moon, Sparkles, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '../auth/AuthProvider';

export default function Navbar() {
  const { user, logout, isClerk } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('edemy_theme') === 'dark');
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('edemy_theme', dark ? 'dark' : 'light'); }, [dark]);
  const navigate = useNavigate();
  const endSession = async () => { await logout(); navigate('/'); setMenuOpen(false); };
  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return <header className="site-header">
    <div className="container nav-wrap">
      <Link className="brand" to="/" aria-label="Edemy home"><span className="brand-mark"><GraduationCap size={23} strokeWidth={2.4} /></span><span>EDUNEXA<span className="brand-dot">.</span></span></Link>
      <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
        <NavLink className={navClass} to="/courses" onClick={() => setMenuOpen(false)}>Explore courses</NavLink>
        {user && <NavLink className={navClass} to={user.role === 'admin' ? '/admin' : user.role === 'educator' ? '/educator' : '/dashboard'} onClick={() => setMenuOpen(false)}>{user.role === 'admin' ? 'Admin console' : user.role === 'educator' ? 'Educator studio' : 'My learning'}</NavLink>}
        <NavLink className={navClass} to="/ai-mentor" onClick={() => setMenuOpen(false)}><Sparkles size={15} /> AI Mentor</NavLink>
      </nav>
      <div className="nav-actions">
        <button className="theme-toggle" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark(value => !value)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        {user ? <div className="user-menu">
          <button className="user-pill" onClick={() => setMenuOpen((value) => !value)}>
            <span className="avatar">{(user.name || 'L').slice(0, 1).toUpperCase()}</span><span className="user-name">{user.name?.split(' ')[0] || 'Learner'}</span><ChevronDown size={15} />
          </button>
          {menuOpen && <div className="dropdown-menu"><div className="dropdown-user"><strong>{user.name}</strong><span>{user.email || user.role}</span></div><button onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'educator' ? '/educator' : '/dashboard')}><BookOpen size={16} /> My workspace</button><button onClick={endSession}><LogOut size={16} /> {isClerk ? 'Sign out' : 'Log out'}</button></div>}
        </div> : <><Link className="btn btn-ghost btn-small" to="/login">Log in</Link><Link className="btn btn-primary btn-small" to="/signup">Get started</Link></>}
        <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen((value) => !value)}><Menu size={22} /></button>
      </div>
    </div>
  </header>;
}
