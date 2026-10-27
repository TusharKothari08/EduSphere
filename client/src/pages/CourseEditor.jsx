import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';

const blankLesson = () => ({ title: '', videoUrl: '', durationMinutes: 8, description: '', isPreview: false });
const blankSection = () => ({ title: 'Getting started', lessons: [blankLesson()] });

export default function CourseEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(Boolean(id));
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', description: '', category: 'Development', level: 'Beginner', language: 'English', price: 0, thumbnail: '', tags: '', published: true, sections: [blankSection()] });

  useEffect(() => {
    if (!id) return;
    api.get(`/courses/${id}/content`).then(({ data }) => {
      const course = data.course;
      setForm({ title: course.title || '', subtitle: course.subtitle || '', description: course.description || '', category: course.category || 'Development', level: course.level || 'Beginner', language: course.language || 'English', price: course.price || 0, thumbnail: course.thumbnail || '', tags: (course.tags || []).join(', '), published: Boolean(course.published), sections: (course.sections || []).map((section) => ({ _id: section._id, title: section.title, lessons: (section.lessons || []).map((lesson) => ({ _id: lesson._id, title: lesson.title, videoUrl: lesson.videoUrl || '', durationMinutes: lesson.durationMinutes || 0, description: lesson.description || '', isPreview: Boolean(lesson.isPreview) })) })) });
    }).catch((error) => toast.error(getErrorMessage(error))).finally(() => setLoadingCourse(false));
  }, [id]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateSection = (index, field, value) => setForm((current) => ({ ...current, sections: current.sections.map((section, i) => i === index ? { ...section, [field]: value } : section) }));
  const updateLesson = (sectionIndex, lessonIndex, field, value) => setForm((current) => ({ ...current, sections: current.sections.map((section, i) => i !== sectionIndex ? section : { ...section, lessons: section.lessons.map((lesson, j) => j === lessonIndex ? { ...lesson, [field]: value } : lesson) }) }));
  const addSection = () => setForm((current) => ({ ...current, sections: [...current.sections, { title: `Section ${current.sections.length + 1}`, lessons: [blankLesson()] }] }));
  const removeSection = (index) => setForm((current) => ({ ...current, sections: current.sections.filter((_, i) => i !== index) }));
  const addLesson = (sectionIndex) => setForm((current) => ({ ...current, sections: current.sections.map((section, i) => i === sectionIndex ? { ...section, lessons: [...section.lessons, blankLesson()] } : section) }));
  const removeLesson = (sectionIndex, lessonIndex) => setForm((current) => ({ ...current, sections: current.sections.map((section, i) => i === sectionIndex ? { ...section, lessons: section.lessons.filter((_, j) => j !== lessonIndex) } : section) }));

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    try { const payload = new FormData(); payload.append('image', imageFile); const { data } = await api.post('/uploads/image', payload); update('thumbnail', data.url); setImageFile(null); toast.success('Thumbnail uploaded.'); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setUploading(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    const cleanedSections = form.sections.map((section) => ({ ...section, lessons: section.lessons.filter((lesson) => lesson.title.trim()) }));
    if (!cleanedSections.length || cleanedSections.every((section) => !section.lessons.length)) return toast.error('Add at least one lesson with a title.');
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), sections: cleanedSections };
      delete payload.tagsText;
      const { data } = editing ? await api.put(`/courses/${id}`, payload) : await api.post('/courses', payload);
      toast.success(editing ? 'Course updated.' : form.published ? 'Your course is live!' : 'Course saved as a draft.');
      navigate(editing ? '/educator' : (payload.published ? `/courses/${data.course._id}` : '/educator'));
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setSaving(false); }
  };

  return <main className="container page-shell editor-page"><Link to="/educator" className="back-link"><ArrowLeft size={15} /> Back to educator studio</Link><div className="editor-heading"><div><span className="section-kicker">COURSE BUILDER</span><h1>{editing ? <>Make your course <span className="highlight-text">even better.</span></> : <>Bring your knowledge <span className="highlight-text">to life.</span></>}</h1><p>Give learners a clear outcome, then break the journey into lessons they can follow.</p></div><div className="editor-step-badge"><span>01</span> Course details <ArrowRight size={14} /> <span>02</span> Lessons</div></div>
    {loadingCourse ? <div className="page-loading"><span className="spinner" /><p>Loading your course…</p></div> : <form className="course-editor-form" onSubmit={submit}>
      <section className="editor-card"><div className="editor-card-heading"><span className="editor-section-number">01</span><div><h2>Course essentials</h2><p>Help the right learners understand what they'll take away.</p></div></div>
        <div className="form-grid"><label className="form-field full-field">Course title<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Modern React & TypeScript" required maxLength={180} /></label><label className="form-field full-field">Short summary<input value={form.subtitle} onChange={(event) => update('subtitle', event.target.value)} placeholder="What makes this course worth taking?" maxLength={240} /></label><label className="form-field full-field">Course description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe who this course is for, what it covers, and what learners will be able to do…" rows={5} required maxLength={8000} /></label>
        <label className="form-field">Topic<select value={form.category} onChange={(event) => update('category', event.target.value)}>{['Development', 'Data & Analytics', 'Design', 'Business', 'Marketing', 'Personal Growth'].map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-field">Difficulty<select value={form.level} onChange={(event) => update('level', event.target.value)}>{['Beginner', 'Intermediate', 'Advanced', 'All levels'].map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-field">Language<input value={form.language} onChange={(event) => update('language', event.target.value)} required /></label><label className="form-field">Price (USD)<div className="input-with-prefix"><span>$</span><input type="number" value={form.price} onChange={(event) => update('price', event.target.value)} min="0" step="0.01" required /></div><small>Set to 0 for a free course.</small></label><label className="form-field full-field">Tags <small>Separate tags with commas</small><input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="React, Frontend, JavaScript" /></label></div>
        <div className="thumbnail-row"><div className="thumbnail-preview">{form.thumbnail ? <img src={form.thumbnail} alt="Course thumbnail preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <ImagePlus size={25} />}</div><div className="thumbnail-fields"><label className="form-field">Thumbnail image URL<input value={form.thumbnail} onChange={(event) => update('thumbnail', event.target.value)} placeholder="https://…" /></label><div className="upload-control"><label className="btn btn-outline btn-small"><UploadCloud size={15} /> Choose image<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label>{imageFile && <span>{imageFile.name}</span>}<button className="btn btn-ghost btn-small" type="button" onClick={uploadImage} disabled={!imageFile || uploading}>{uploading ? 'Uploading…' : 'Upload to Cloudinary'}</button></div><small>Use a public image URL or configure Cloudinary to upload one here.</small></div></div>
      </section>
      <section className="editor-card"><div className="editor-card-heading"><span className="editor-section-number">02</span><div><h2>Build your curriculum</h2><p>Organize the course into sections and short, focused lessons.</p></div></div>
        <div className="curriculum-builder">{form.sections.map((section, sectionIndex) => <div className="builder-section" key={sectionIndex}><div className="builder-section-top"><span className="builder-section-count">SECTION {String(sectionIndex + 1).padStart(2, '0')}</span>{form.sections.length > 1 && <button type="button" className="icon-button danger-icon" title="Remove section" onClick={() => removeSection(sectionIndex)}><Trash2 size={16} /></button>}</div><label className="form-field">Section title<input value={section.title} onChange={(event) => updateSection(sectionIndex, 'title', event.target.value)} required /></label>
          {section.lessons.map((lesson, lessonIndex) => <div className="lesson-builder-row" key={lessonIndex}><span className="lesson-builder-number">{String(lessonIndex + 1).padStart(2, '0')}</span><div className="lesson-builder-fields"><label className="form-field">Lesson title<input value={lesson.title} onChange={(event) => updateLesson(sectionIndex, lessonIndex, 'title', event.target.value)} placeholder="e.g. Understand React state" required /></label><div className="lesson-field-grid"><label className="form-field">Video URL<input type="url" value={lesson.videoUrl} onChange={(event) => updateLesson(sectionIndex, lessonIndex, 'videoUrl', event.target.value)} placeholder="https://youtube.com/watch?v=…" /></label><label className="form-field short-input">Duration (min)<input type="number" min="0" value={lesson.durationMinutes} onChange={(event) => updateLesson(sectionIndex, lessonIndex, 'durationMinutes', event.target.value)} /></label></div><label className="form-field">Lesson notes<textarea value={lesson.description} onChange={(event) => updateLesson(sectionIndex, lessonIndex, 'description', event.target.value)} placeholder="Optional notes or learning goals" rows={2} /></label><label className="check-field"><input type="checkbox" checked={lesson.isPreview} onChange={(event) => updateLesson(sectionIndex, lessonIndex, 'isPreview', event.target.checked)} /> Make this lesson available as a free preview</label></div>{section.lessons.length > 1 && <button type="button" className="icon-button danger-icon lesson-remove" title="Remove lesson" onClick={() => removeLesson(sectionIndex, lessonIndex)}><Trash2 size={15} /></button>}</div>)}
          <button type="button" className="add-lesson-button" onClick={() => addLesson(sectionIndex)}><Plus size={15} /> Add another lesson</button>
        </div>)}</div><button type="button" className="btn btn-outline add-section-button" onClick={addSection}><Plus size={16} /> Add a section</button>
      </section>
      <section className="editor-publish-card"><div><strong>Ready to share your knowledge?</strong><p>{form.published ? 'Your course will appear in the public course catalog after you save.' : 'Save this course privately as a draft and publish it when ready.'}</p><label className="check-field publish-check"><input type="checkbox" checked={form.published} onChange={(event) => update('published', event.target.checked)} /> Publish course after saving</label></div><div className="editor-actions"><Link to="/educator" className="btn btn-ghost">Cancel</Link><button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving course…' : editing ? 'Save changes' : form.published ? 'Create and publish' : 'Save as draft'} <Check size={17} /></button></div></section>
    </form>}
  </main>;
}
