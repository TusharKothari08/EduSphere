import { useEffect, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import CourseCard from '../components/CourseCard';

const categoryOptions = [
  'All categories',
  'Development',
  'Data & Analytics',
  'Design',
  'Business',
  'Marketing',
];

const levelOptions = ['All levels', 'Beginner', 'Intermediate', 'Advanced'];

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(
    params.get('category') || 'All categories'
  );
  const [level, setLevel] = useState(params.get('level') || 'All levels');
  const [sort, setSort] = useState('newest');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      const nextParams = {};
      if (query.trim()) nextParams.q = query.trim();
      if (category !== 'All categories') nextParams.category = category;
      if (level !== 'All levels') nextParams.level = level;
      setParams(nextParams, { replace: true });

      api
        .get('/courses', {
          params: { q: query, category, level, sort, limit: 30 },
        })
        .then(({ data }) => setCourses(data.courses || []))
        .catch((err) => {
          setCourses([]);
          setError(
            err.userMessage ||
              'Could not load courses. Make sure the API and database are running.'
          );
        })
        .finally(() => setLoading(false));
    }, 220);

    return () => clearTimeout(timer);
  }, [query, category, level, sort, setParams]);

  const clearFilters = () => {
    setQuery('');
    setCategory('All categories');
    setLevel('All levels');
    setSort('newest');
  };

  const hasFilters =
    query || category !== 'All categories' || level !== 'All levels';

  return (
    <main className="min-h-screen bg-slate-50/60 dark:bg-slate-900/60 py-8 sm:py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <section className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              The Course Library
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white font-['Manrope']">
              Find your next <span className="text-violet-600">learning path.</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Practical skills, expert perspectives, and room to learn at your own pace.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <BookOpen size={16} className="text-violet-600" />
            <span>
              {loading
                ? 'Loading catalog…'
                : `${courses.length} ${
                    courses.length === 1 ? 'course' : 'courses'
                  } available`}
            </span>
          </div>
        </section>

        {/* Catalog Main Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  <SlidersHorizontal size={14} className="text-violet-600" />
                  Filters
                </span>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label
                  htmlFor="catalog-search"
                  className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Search Courses
                </label>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="catalog-search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. React, SQL, Design…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-violet-400"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category-filter"
                  className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Topic Category
                </label>
                <select
                  id="category-filter"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label
                  htmlFor="level-filter"
                  className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Difficulty Level
                </label>
                <select
                  id="level-filter"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {levelOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Recommendation Card */}
            <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900/60 dark:bg-violet-950/40 space-y-2">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Sparkles size={16} />
                <strong className="text-xs font-bold">Unsure where to start?</strong>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ask your AI Mentor for a custom learning path tailored to your goals.
              </p>
              <Link
                to="/ai-mentor"
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 dark:text-violet-300"
              >
                <span>Ask the Mentor</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </aside>

          {/* Courses Grid / Catalog */}
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Showing{' '}
                <strong className="text-slate-900 dark:text-white">
                  {courses.length}
                </strong>{' '}
                courses
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort courses by"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Top Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <BookOpen size={32} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Course library temporarily unavailable
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => setQuery((v) => `${v} `)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard course={course} key={course._id} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <Search size={32} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  No courses found
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Try adjusting your search query or clear the active filters.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <X size={14} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
