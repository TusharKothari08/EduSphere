import { Link } from 'react-router-dom';
import { GraduationCap, Heart, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-100">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-black text-xl tracking-tight text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/25">
                <GraduationCap size={18} />
              </span>
              <span className="font-extrabold text-xl font-['Manrope']">
                EDUNEXA<span className="text-violet-600">.</span>
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-slate-500 max-w-sm">
              Enterprise learning management system engineered for ambitious learners, engineers, and educators. Master skills through expert-led video curriculum and 24/7 AI Mentorship.
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                Verified Certificates
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Sparkles size={14} className="text-violet-500" />
                AI Mentor Powered
              </span>
            </div>
          </div>

          {/* Links Column 1: Learn */}
          <div className="md:col-span-2 space-y-3">
            <strong className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              Learn
            </strong>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link to="/courses" className="hover:text-violet-600 transition">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Development" className="hover:text-violet-600 transition">
                  Web & Software
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Data%20%26%20Analytics" className="hover:text-violet-600 transition">
                  Data & Analytics
                </Link>
              </li>
              <li>
                <Link to="/ai-mentor" className="hover:text-violet-600 transition">
                  AI Mentor
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Student */}
          <div className="md:col-span-2 space-y-3">
            <strong className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              Student Portal
            </strong>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link to="/dashboard" className="hover:text-violet-600 transition">
                  My Learning
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-violet-600 transition">
                  Active Courses
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-violet-600 transition">
                  Earned Certificates
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Teach */}
          <div className="md:col-span-3 space-y-3">
            <strong className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              Educator Studio
            </strong>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link to="/educator" className="hover:text-violet-600 transition">
                  Instructor Studio
                </Link>
              </li>
              <li>
                <Link to="/educator/new-course" className="hover:text-violet-600 transition">
                  Create New Course
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-violet-600 transition">
                  Become an Educator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} EDUNEXA LMS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              Built for curious minds <Heart size={13} className="text-violet-600 fill-violet-600" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
