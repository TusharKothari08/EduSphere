import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  Plus,
  Sparkles,
  X,
  ShieldAlert,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '../auth/AuthProvider';

export default function Navbar() {
  const { user, logout, isClerk } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();

  const endSession = async () => {
    await logout();
    navigate('/');
    setUserDropdown(false);
    setMenuOpen(false);
  };

  const isEducator = user?.role === 'educator';
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student' || (!isEducator && !isAdmin && Boolean(user));

  const roleDestination = isAdmin
    ? '/admin'
    : isEducator
    ? '/educator'
    : '/dashboard';

  const roleLabel = isAdmin
    ? 'Admin Console'
    : isEducator
    ? 'Educator Studio'
    : 'My Learning';

  const navLinkStyle = ({ isActive }) =>
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-violet-50 text-violet-700 shadow-xs ring-1 ring-violet-200/80 font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-black text-xl tracking-tight text-slate-900 group"
            aria-label="EDUNEXA Home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25 transition-transform group-hover:scale-105">
              <GraduationCap size={22} strokeWidth={2.4} />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-['Manrope']">
                EDUNEXA<span className="text-violet-600">.</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200/70">
                LMS
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <NavLink className={navLinkStyle} to="/courses">
            <BookOpen size={15} />
            <span>Explore Courses</span>
          </NavLink>

          {user && (
            <NavLink className={navLinkStyle} to={roleDestination}>
              {isEducator ? (
                <GraduationCap size={16} />
              ) : isAdmin ? (
                <ShieldAlert size={15} />
              ) : (
                <LayoutDashboard size={15} />
              )}
              <span>{roleLabel}</span>
            </NavLink>
          )}

          <NavLink className={navLinkStyle} to="/ai-mentor">
            <Sparkles size={15} className="text-violet-600" />
            <span>AI Mentor</span>
          </NavLink>
        </nav>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Educator Quick Action: Create Course */}
          {isEducator && (
            <Link
              to="/educator/new-course"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-violet-500/25 transition hover:scale-[1.01]"
            >
              <Plus size={14} />
              <span>Create Course</span>
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white p-1 pr-3 text-xs font-bold text-slate-700 shadow-xs transition hover:border-violet-300 hover:bg-slate-50 cursor-pointer"
                onClick={() => setUserDropdown((prev) => !prev)}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-white text-[11px] shadow-xs ${
                    isEducator
                      ? 'bg-violet-600'
                      : isAdmin
                      ? 'bg-amber-600'
                      : 'bg-indigo-600'
                  }`}
                >
                  {(user.name || 'L').slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate text-slate-800 font-semibold">
                  {user.name?.split(' ')[0] || 'Learner'}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    isEducator
                      ? 'bg-violet-100 text-violet-700'
                      : isAdmin
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isEducator ? 'Educator' : isAdmin ? 'Admin' : 'Student'}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="border-b border-slate-100 p-2.5">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {user.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {user.email || 'Account verified'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isEducator
                            ? 'bg-violet-100 text-violet-700'
                            : isAdmin
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isEducator ? (
                          <>
                            <GraduationCap size={11} /> Educator Account
                          </>
                        ) : isAdmin ? (
                          <>
                            <ShieldAlert size={11} /> Administrator
                          </>
                        ) : (
                          <>
                            <BookOpen size={11} /> Student Account
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5 pt-1.5">
                    {/* Primary Role Workspace */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        navigate(roleDestination);
                        setUserDropdown(false);
                      }}
                    >
                      {isEducator ? (
                        <GraduationCap size={15} className="text-violet-600" />
                      ) : isAdmin ? (
                        <ShieldAlert size={15} className="text-amber-600" />
                      ) : (
                        <LayoutDashboard size={15} className="text-indigo-600" />
                      )}
                      <span>{roleLabel}</span>
                    </button>

                    {/* Educator Course Creation */}
                    {isEducator && (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                        onClick={() => {
                          navigate('/educator/new-course');
                          setUserDropdown(false);
                        }}
                      >
                        <Plus size={15} className="text-emerald-600" />
                        <span>Create New Course</span>
                      </button>
                    )}

                    {/* Browse courses */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        navigate('/courses');
                        setUserDropdown(false);
                      }}
                    >
                      <BookOpen size={15} />
                      <span>Browse Course Catalog</span>
                    </button>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer"
                        onClick={endSession}
                      >
                        <LogOut size={15} />
                        <span>{isClerk ? 'Sign Out' : 'Log Out'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-block rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-violet-600 transition"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-500/25 transition hover:bg-violet-700 hover:shadow-md"
              >
                <span>Get Started Free</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white p-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1.5">
            <Link
              to="/courses"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setMenuOpen(false)}
            >
              <BookOpen size={16} />
              <span>Explore Courses</span>
            </Link>

            {user && (
              <Link
                to={roleDestination}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                <GraduationCap size={16} />
                <span>{roleLabel}</span>
              </Link>
            )}

            {isEducator && (
              <Link
                to="/educator/new-course"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 bg-violet-50"
                onClick={() => setMenuOpen(false)}
              >
                <Plus size={16} />
                <span>Create New Course</span>
              </Link>
            )}

            <Link
              to="/ai-mentor"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setMenuOpen(false)}
            >
              <Sparkles size={16} className="text-violet-600" />
              <span>AI Mentor</span>
            </Link>

            {!user && (
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs font-bold text-slate-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-violet-600 px-3 py-2.5 text-center text-xs font-bold text-white shadow-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
