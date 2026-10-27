import { ArrowUpRight, Clock3, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const fallbackImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

export default function CourseCard({ course, compact = false }) {
  const educator = typeof course.educator === 'object' ? course.educator?.name : 'EDUNEXA educator';
  const lessonCount = course.lessonCount ?? (course.sections || []).reduce((total, section) => total + (section.lessons || []).length, 0);
  return <article className={`course-card ${compact ? 'course-card-compact' : ''}`}>
    <Link className="course-image-wrap" to={`/courses/${course._id}`}>
      <img className="course-image" src={course.thumbnail || fallbackImage} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
      <span className="course-category">{course.category || 'Learning'}</span><span className="image-arrow"><ArrowUpRight size={17} /></span>
    </Link>
    <div className="course-card-body">
      <div className="course-meta"><span>{course.level || 'All levels'}</span><span className="rating"><Star size={13} fill="currentColor" /> {Number(course.averageRating || 4.8).toFixed(1)}</span></div>
      <Link to={`/courses/${course._id}`} className="course-title">{course.title}</Link>
      <p className="course-subtitle">{course.subtitle || course.description?.slice(0, 96)}</p>
      <div className="course-card-foot"><span className="instructor">By {educator}</span><span className="lesson-count"><Clock3 size={13} /> {lessonCount} lessons</span></div>
      <div className="course-price-row"><strong>{course.price > 0 ? `$${Number(course.price).toFixed(0)}` : 'Free'}</strong><Link to={`/courses/${course._id}`} className="text-link">View course <ArrowUpRight size={14} /></Link></div>
    </div>
  </article>;
}
