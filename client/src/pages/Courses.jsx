import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, BookOpen, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import CourseCard from '../components/CourseCard';

const categoryOptions = ['All categories', 'Development', 'Data & Analytics', 'Design', 'Business', 'Marketing'];
const levelOptions = ['All levels', 'Beginner', 'Intermediate', 'Advanced'];

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All categories');
  const [level, setLevel] = useState(params.get('level') || 'All levels');
  const [sort, setSort] = useState('newest');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true); setError('');
      const nextParams = {};
      if (query.trim()) nextParams.q = query.trim();
      if (category !== 'All categories') nextParams.category = category;
      if (level !== 'All levels') nextParams.level = level;
      setParams(nextParams, { replace: true });
      api.get('/courses', { params: { q: query, category, level, sort, limit: 30 } })
        .then(({ data }) => setCourses(data.courses || []))
        .catch((err) => { setCourses([]); setError(err.userMessage || 'Could not load courses. Make sure the API and database are running.'); })
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(timer);
  }, [query, category, level, sort, setParams]);

  const clearFilters = () => { setQuery(''); setCategory('All categories'); setLevel('All levels'); setSort('newest'); };
  const hasFilters = query || category !== 'All categories' || level !== 'All levels';

  return <main className="container page-shell">
    <section className="page-intro courses-intro"><div><span className="section-kicker">THE COURSE LIBRARY</span><h1>Find your next <span className="highlight-text">learning path.</span></h1><p>Practical skills, expert perspectives, and room to learn at your own pace.</p></div><div className="library-count"><BookOpen size={18} /><span>Explore at your own pace</span></div></section>
    <section className="catalog-layout"><aside className="filter-panel"><div className="filter-heading"><span><SlidersHorizontal size={17} /> Filters</span>{hasFilters && <button className="clear-filters" onClick={clearFilters}>Clear all</button>}</div>
      <label className="field-label" htmlFor="catalog-search">Search courses</label><div className="search-field"><Search size={16} /><input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try React, SQL…" /></div>
      <label className="field-label" htmlFor="category-filter">Topic</label><select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select>
      <label className="field-label" htmlFor="level-filter">Difficulty</label><select id="level-filter" value={level} onChange={(event) => setLevel(event.target.value)}>{levelOptions.map((option) => <option key={option}>{option}</option>)}</select>
      <div className="filter-note"><SparklesIcon /><p>Not sure where to start? Ask your AI Mentor for a learning path.</p><a href="/ai-mentor">Get a recommendation →</a></div>
    </aside>
    <div className="catalog-main"><div className="catalog-toolbar"><div><strong>{loading ? 'Finding courses…' : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`}</strong><span> to explore</span></div><label className="sort-select">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="rating">Top rated</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></label></div>
      {loading ? <div className="course-grid catalog-course-grid">{[1,2,3,4,5,6].map((n) => <div className="course-skeleton" key={n}><div /><span /><span /></div>)}</div> : error ? <div className="empty-state"><BookOpen size={30} /><h3>The course library couldn't load</h3><p>{error}</p><button className="btn btn-primary" onClick={() => setQuery((value) => `${value} `)}>Try again</button></div> : courses.length ? <div className="course-grid catalog-course-grid">{courses.map((course) => <CourseCard course={course} key={course._id} />)}</div> : <div className="empty-state"><Search size={30} /><h3>No courses found</h3><p>Try another search or clear your filters to see the full library.</p>{hasFilters && <button className="btn btn-outline" onClick={clearFilters}><X size={15} /> Clear filters</button>}</div>}
    </div></section>
  </main>;
}

function SparklesIcon() { return <span className="sparkles-mini">✦</span>; }
