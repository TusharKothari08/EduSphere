import { Link } from 'react-router-dom';
import { Star, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

const fallbackThumbnail =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

export default function CourseCard({ course }) {
  if (!course) return null;

  const totalLessons =
    course.lessonCount ??
    (course.sections || []).reduce(
      (total, section) => total + (section.lessons || []).length,
      0
    );

  const priceLabel =
    course.price === 0 || !course.price
      ? 'Free'
      : `$${Number(course.price).toFixed(0)}`;

  const rating =
    course.averageRating && course.averageRating > 0
      ? course.averageRating.toFixed(1)
      : '4.9';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl shadow-xs">
      {/* Thumbnail Container */}
      <Link
        to={`/courses/${course._id}`}
        className="relative aspect-video w-full overflow-hidden bg-slate-100 block"
        tabIndex={-1}
      >
        <img
          src={course.thumbnail || fallbackThumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = fallbackThumbnail;
          }}
        />

        {/* Category Pill Floating */}
        <span className="absolute left-3 top-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-xs">
          {course.category || 'Development'}
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Meta: Level & Rating */}
        <div className="mb-2.5 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md text-[11px]">
            {course.level || 'Beginner'}
          </span>
          <div className="flex items-center gap-1 font-bold text-amber-500">
            <Star size={13} fill="currentColor" />
            <span>{rating}</span>
            <span className="text-slate-400 font-normal text-[11px]">(24)</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/courses/${course._id}`} className="group-hover:text-violet-600 transition-colors">
          <h3 className="line-clamp-2 text-base font-bold text-slate-900 font-['Manrope'] leading-snug">
            {course.title}
          </h3>
        </Link>

        {/* Subtitle / Description */}
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {course.subtitle || course.description}
        </p>

        {/* Footer info: Educator, Lessons, Price */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
              <GraduationCap size={12} />
            </span>
            <span className="truncate text-xs font-medium text-slate-600">
              {course.educator?.name || 'EDUNEXA Instructor'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <BookOpen size={12} />
              {totalLessons} lessons
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {priceLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
