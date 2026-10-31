import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Play,
  Sparkles,
  Users,
  Zap,
  GraduationCap,
  Award,
  Terminal,
  ShieldCheck,
  TrendingUp,
  Code2,
  Database,
  Layers,
  Cpu,
  Palette,
  Server,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import CourseCard from '../components/CourseCard';
import { useSession } from '../auth/AuthProvider';

const learningDomains = [
  {
    icon: Code2,
    name: 'Development',
    description: 'React, Node.js, TypeScript, Full-Stack Architecture',
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-300',
    borderColor: 'group-hover:border-violet-300 dark:group-hover:border-violet-700',
  },
  {
    icon: Database,
    name: 'Data & Analytics',
    description: 'SQL Queries, Data Pipelines, Python Analytics, BI',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300',
    borderColor: 'group-hover:border-indigo-300 dark:group-hover:border-indigo-700',
  },
  {
    icon: Server,
    name: 'Cloud & Systems',
    description: 'System Design, Microservices, Docker, Cloud APIs',
    color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300',
    borderColor: 'group-hover:border-sky-300 dark:group-hover:border-sky-700',
  },
  {
    icon: Palette,
    name: 'Design',
    description: 'UI/UX Architecture, Design Systems, Product Prototyping',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300',
    borderColor: 'group-hover:border-rose-300 dark:group-hover:border-rose-700',
  },
  {
    icon: Cpu,
    name: 'Core Computer Science',
    description: 'Algorithms, Data Structures, Concurrency & Operating Systems',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300',
    borderColor: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700',
  },
  {
    icon: TrendingUp,
    name: 'Business',
    description: 'Product Leadership, Strategy, Technical Project Delivery',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300',
    borderColor: 'group-hover:border-amber-300 dark:group-hover:border-amber-700',
  },
];

const platformPillars = [
  {
    icon: BookOpen,
    title: 'Curriculum-Driven Learning',
    description:
      'Step-by-step modular syllabi structured into logical learning milestones with zero fluff.',
  },
  {
    icon: Sparkles,
    title: 'Real-Time AI Mentorship',
    description:
      'Get instant contextual clarifications, code reviews, and deep-dive explanations anytime you get stuck.',
  },
  {
    icon: Terminal,
    title: 'Practical Hands-on Practice',
    description:
      'Reinforce theoretical knowledge through multiple-choice knowledge checks and submitted coding tasks.',
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    description:
      'Earn tamper-proof completion certificates with cryptographically verifiable ID codes upon 100% mastery.',
  },
];

export default function Home() {
  const { user } = useSession();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/courses', { params: { limit: 3, sort: 'rating' } })
      .then(({ data }) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const isEducator = user?.role === 'educator';

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800">
        {/* Subtle Background Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-500/10 dark:bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800/80 text-violet-800 dark:text-violet-300 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
                <span>ENTERPRISE LEARNING SYSTEM</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] font-['Manrope']">
                Master the skills that{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500">
                  shape your future.
                </span>
              </h1>

              {/* Lede Paragraph */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Structured curriculum tracks taught by experienced instructors.
                Build real-world competence with self-paced video modules,
                practical assessments, and 24/7 AI Mentor assistance.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02]"
                >
                  <BookOpen size={17} />
                  <span>Explore Course Catalog</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/ai-mentor"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition shadow-xs"
                >
                  <Sparkles size={16} className="text-violet-600 dark:text-violet-400" />
                  <span>Try AI Mentor</span>
                </Link>
              </div>

              {/* Social Proof / Metrics */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-6 sm:gap-10 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-900">
                      A
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-900">
                      R
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-900">
                      S
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-900">
                      +
                    </span>
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">
                      10,000+ Students
                    </strong>
                    <span className="text-slate-500 text-[11px]">Actively enrolled</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">
                      4.9 / 5.0 Rating
                    </strong>
                    <span className="text-slate-500 text-[11px]">Verified reviews</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">
                      Verified Credentials
                    </strong>
                    <span className="text-slate-500 text-[11px]">Tamper-proof IDs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Column: Interactive LMS Course Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                      <GraduationCap size={18} />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                        Interactive Studio
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Modern React & TypeScript
                      </strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    In Progress
                  </span>
                </div>

                {/* Video Stage Preview */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=900&q=85"
                    alt="React code and interface"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/40 hover:scale-110 transition-transform">
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                    <span className="font-semibold">Module 3 · State & Hooks</span>
                    <span>12:45 / 18:20</span>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Course Completion</span>
                    <strong className="text-violet-600 dark:text-violet-400 font-bold">
                      75%
                    </strong>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all"
                      style={{ width: '75%' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>9 of 12 lessons completed</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      On track
                    </span>
                  </div>
                </div>

                {/* Floating AI Mentor Pill */}
                <div className="p-3 rounded-xl bg-violet-50/80 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0">
                      <Sparkles size={14} />
                    </span>
                    <p className="text-xs text-violet-900 dark:text-violet-200 truncate">
                      <strong>AI Mentor:</strong> Need an explanation of `useEffect` dependencies?
                    </p>
                  </div>
                  <Link
                    to="/ai-mentor"
                    className="text-[11px] font-bold text-violet-600 dark:text-violet-300 hover:underline shrink-0"
                  >
                    Ask now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-12 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Domains */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Course Catalog Domains
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                Explore Structured Curriculum Tracks
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Engineered for practical mastery and industry-aligned technical skill.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700"
            >
              <span>View full catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {learningDomains.map((domain) => {
              const Icon = domain.icon;
              return (
                <Link
                  key={domain.name}
                  to={`/courses?category=${encodeURIComponent(domain.name)}`}
                  className={`group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${domain.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${domain.color}`}
                    >
                      <Icon size={20} />
                    </span>
                    <ArrowRight
                      size={15}
                      className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition">
                    {domain.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {domain.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses Grid */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Top-Rated Tracks
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                Featured Courses
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Hand-picked tracks with comprehensive video lectures, notes, and interactive assessments.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700"
            >
              <span>Explore all courses</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
              <BookOpen size={32} className="mx-auto text-violet-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Course catalog is expanding
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Our educators are currently publishing new curriculum tracks. Check back shortly or browse available courses.
              </p>
              <Link
                to="/courses"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
              >
                Browse Catalog
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* AI Mentor Feature Spotlight */}
      <section className="py-20 relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-radial-at-t from-violet-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/60 border border-violet-700/60 text-violet-300 text-xs font-bold">
                <Sparkles size={14} className="text-violet-400" />
                <span>INTELLIGENT TUTORING</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Manrope'] leading-[1.18]">
                Stuck on a concept? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
                  Your AI Mentor is ready.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                Never wait for office hours. Ask complex architectural questions,
                request code explanations with syntax-highlighted examples, and
                receive tailored walkthroughs instantly.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/30 text-violet-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </span>
                  <span>Step-by-step code analysis and complexity optimization</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/30 text-violet-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </span>
                  <span>Syntax-highlighted markdown responses with one-click copy</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/30 text-violet-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </span>
                  <span>Contextual awareness of your active course modules</span>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  to="/ai-mentor"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:scale-[1.02]"
                >
                  <Sparkles size={16} />
                  <span>Start a Conversation</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* AI Mock Dialogue Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white">
                      <Sparkles size={14} />
                    </span>
                    <strong className="text-xs font-bold text-white">
                      EDUNEXA AI Mentor
                    </strong>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ● Connected & Online
                  </span>
                </div>

                {/* User Prompt */}
                <div className="flex gap-3 items-start justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-violet-600 text-white p-3.5 text-xs leading-relaxed">
                    How does database indexing actually improve query performance, and what is the trade-off?
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3 items-start">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-violet-400 shrink-0 mt-1">
                    <Sparkles size={14} />
                  </span>
                  <div className="flex-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 p-4 text-xs text-slate-200 space-y-2.5">
                    <p className="leading-relaxed">
                      Indexes work like a book's index: instead of scanning every page (Sequential Scan, <strong>O(N)</strong>), the database searches a balanced tree (B-Tree, <strong>O(log N)</strong>) to jump straight to row pointers.
                    </p>
                    <div className="rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-400 border border-slate-800">
                      CREATE INDEX idx_users_email ON users(email);
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      <strong>The Trade-off:</strong> Writes (`INSERT`, `UPDATE`, `DELETE`) become slightly slower because index trees must be rebalanced, and additional storage is consumed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Sided Platform: Educator Callout */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-violet-50/20 to-white dark:from-slate-900 dark:via-violet-950/20 dark:to-slate-900 p-8 sm:p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Share Your Expertise
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                Teach on EDUNEXA and Inspire Thousands
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Whether you are a senior software architect, data scientist, or designer, EDUNEXA provides the authoring studio, quiz builder, assignment grading queue, and Stripe payment pipeline you need to launch impactful courses.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-violet-600" />
                  Full Curriculum Studio
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-violet-600" />
                  Automated Student Enrollments
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-violet-600" />
                  Integrated Stripe Checkout
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              {isEducator ? (
                <Link
                  to="/educator"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-violet-700 transition"
                >
                  <GraduationCap size={16} />
                  <span>Go to Educator Studio</span>
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-violet-700 transition"
                >
                  <GraduationCap size={16} />
                  <span>Register as Educator</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
