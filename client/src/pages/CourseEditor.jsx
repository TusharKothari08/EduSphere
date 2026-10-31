import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Plus,
  Trash2,
  UploadCloud,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';

const blankLesson = () => ({
  title: '',
  videoUrl: '',
  durationMinutes: 8,
  description: '',
  isPreview: false,
});

const blankSection = () => ({
  title: 'Section 1: Getting Started',
  lessons: [blankLesson()],
});

export default function CourseEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(Boolean(id));
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Development',
    level: 'Beginner',
    language: 'English',
    price: 0,
    thumbnail: '',
    tags: '',
    published: true,
    sections: [blankSection()],
  });

  useEffect(() => {
    if (!id) return;
    api
      .get(`/courses/${id}/content`)
      .then(({ data }) => {
        const course = data.course;
        setForm({
          title: course.title || '',
          subtitle: course.subtitle || '',
          description: course.description || '',
          category: course.category || 'Development',
          level: course.level || 'Beginner',
          language: course.language || 'English',
          price: course.price || 0,
          thumbnail: course.thumbnail || '',
          tags: (course.tags || []).join(', '),
          published: Boolean(course.published),
          sections: (course.sections || []).map((section) => ({
            _id: section._id,
            title: section.title,
            lessons: (section.lessons || []).map((lesson) => ({
              _id: lesson._id,
              title: lesson.title,
              videoUrl: lesson.videoUrl || '',
              durationMinutes: lesson.durationMinutes || 0,
              description: lesson.description || '',
              isPreview: Boolean(lesson.isPreview),
            })),
          })),
        });
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoadingCourse(false));
  }, [id]);

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const updateSection = (index, field, value) =>
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));

  const updateLesson = (sectionIndex, lessonIndex, field, value) =>
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, i) =>
        i !== sectionIndex
          ? section
          : {
              ...section,
              lessons: section.lessons.map((lesson, j) =>
                j === lessonIndex ? { ...lesson, [field]: value } : lesson,
              ),
            },
      ),
    }));

  const addSection = () =>
    setForm((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          title: `Section ${current.sections.length + 1}`,
          lessons: [blankLesson()],
        },
      ],
    }));

  const removeSection = (index) =>
    setForm((current) => ({
      ...current,
      sections: current.sections.filter((_, i) => i !== index),
    }));

  const addLesson = (sectionIndex) =>
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, lessons: [...section.lessons, blankLesson()] }
          : section,
      ),
    }));

  const removeLesson = (sectionIndex, lessonIndex) =>
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              lessons: section.lessons.filter((_, j) => j !== lessonIndex),
            }
          : section,
      ),
    }));

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('image', imageFile);
      const { data } = await api.post('/uploads/image', payload);
      update('thumbnail', data.url);
      setImageFile(null);
      toast.success('Course thumbnail uploaded.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const cleanedSections = form.sections.map((section) => ({
      ...section,
      lessons: section.lessons.filter((lesson) => lesson.title.trim()),
    }));

    if (
      !cleanedSections.length ||
      cleanedSections.every((section) => !section.lessons.length)
    )
      return toast.error('Add at least one lesson with a title.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        sections: cleanedSections,
      };

      const { data } = editing
        ? await api.put(`/courses/${id}`, payload)
        : await api.post('/courses', payload);

      toast.success(
        editing
          ? 'Course updated successfully.'
          : form.published
          ? 'Course is live in catalog!'
          : 'Course saved as draft.'
      );
      navigate(
        editing
          ? '/educator'
          : payload.published
          ? `/courses/${data.course._id}`
          : '/educator'
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Loading course editor…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/educator"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Educator Studio</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {editing ? 'Edit Course Curriculum' : 'Create a New Course'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize your course details, pricing, sections, and video lessons.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Card 1: Course Essentials */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center justify-center">
                01
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Course Details
                </h2>
                <p className="text-[11px] text-slate-500">
                  Basic information, category, and pricing.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. Modern React & TypeScript"
                  required
                  maxLength={180}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => update('subtitle', e.target.value)}
                  placeholder="What makes this course worth taking?"
                  maxLength={240}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe who this course is for, what it covers, and what learners will achieve…"
                  rows={4}
                  required
                  maxLength={8000}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => update('category', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {[
                      'Development',
                      'Data & Analytics',
                      'Design',
                      'Business',
                      'Marketing',
                      'Personal Growth',
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => update('level', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(
                      (lvl) => (
                        <option key={lvl}>{lvl}</option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0 for Free"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="React, Frontend, JavaScript"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Thumbnail */}
              <div className="pt-2 flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-32 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {form.thumbnail ? (
                    <img
                      src={form.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImagePlus size={24} className="text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    value={form.thumbnail}
                    onChange={(e) => update('thumbnail', e.target.value)}
                    placeholder="https://images.unsplash.com/…"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
                      <UploadCloud size={14} />
                      <span>Choose file</span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    {imageFile && (
                      <span className="text-[11px] text-slate-500 truncate max-w-xs">
                        {imageFile.name}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={uploadImage}
                      disabled={!imageFile || uploading}
                      className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 font-semibold text-xs hover:bg-violet-100 disabled:opacity-50 cursor-pointer"
                    >
                      {uploading ? 'Uploading…' : 'Upload Image'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Curriculum Builder */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center justify-center">
                  02
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Curriculum & Lessons
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Organize course into sections and video lessons.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-bold text-xs text-violet-600 dark:text-violet-400 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-5">
              {form.sections.map((section, sIndex) => (
                <div
                  key={sIndex}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-850 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                      Section {String(sIndex + 1).padStart(2, '0')}
                    </span>
                    {form.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sIndex)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove Section"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) =>
                        updateSection(sIndex, 'title', e.target.value)
                      }
                      placeholder="e.g. Component Architecture & Props"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Lessons */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Lessons:
                    </span>

                    {section.lessons.map((lesson, lIndex) => (
                      <div
                        key={lIndex}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            Lesson {lIndex + 1}
                          </span>
                          {section.lessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLesson(sIndex, lIndex)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(
                                sIndex,
                                lIndex,
                                'title',
                                e.target.value
                              )
                            }
                            placeholder="Lesson Title (e.g. Understanding State)"
                            required
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          />
                          <input
                            type="url"
                            value={lesson.videoUrl}
                            onChange={(e) =>
                              updateLesson(
                                sIndex,
                                lIndex,
                                'videoUrl',
                                e.target.value
                              )
                            }
                            placeholder="YouTube or Vimeo URL"
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <label className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>Duration (min):</span>
                            <input
                              type="number"
                              min="0"
                              value={lesson.durationMinutes}
                              onChange={(e) =>
                                updateLesson(
                                  sIndex,
                                  lIndex,
                                  'durationMinutes',
                                  e.target.value
                                )
                              }
                              className="w-16 px-2 py-0.5 rounded border border-slate-200 text-xs"
                            />
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={lesson.isPreview}
                              onChange={(e) =>
                                updateLesson(
                                  sIndex,
                                  lIndex,
                                  'isPreview',
                                  e.target.checked
                                )
                              }
                              className="accent-violet-600"
                            />
                            <span>Free Preview</span>
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLesson(sIndex)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add another lesson</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Publish Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                Publishing Status
              </strong>
              <label className="flex items-center gap-2 mt-1 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => update('published', e.target.checked)}
                  className="accent-violet-600"
                />
                <span>Publish course to public catalog immediately</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/educator"
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/25 transition cursor-pointer disabled:opacity-50"
              >
                <Check size={16} />
                <span>
                  {saving
                    ? 'Saving…'
                    : editing
                    ? 'Save Changes'
                    : form.published
                    ? 'Create & Publish'
                    : 'Save as Draft'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
