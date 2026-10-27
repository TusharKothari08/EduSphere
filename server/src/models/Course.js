const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', maxlength: 2000 },
  videoUrl: { type: String, default: '' },
  durationMinutes: { type: Number, min: 0, default: 0 },
  isPreview: { type: Boolean, default: false },
  resources: [{ label: { type: String, trim: true }, url: { type: String, trim: true } }]
}, { timestamps: true });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  lessons: { type: [lessonSchema], default: [] }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subtitle: { type: String, default: '', maxlength: 240 },
  description: { type: String, required: true, maxlength: 8000 },
  category: { type: String, default: 'Development', trim: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All levels'], default: 'Beginner' },
  language: { type: String, default: 'English' },
  price: { type: Number, min: 0, default: 0 },
  thumbnail: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  sections: { type: [sectionSchema], default: [] },
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: false },
  averageRating: { type: Number, min: 0, max: 5, default: 0 }
}, { timestamps: true });

courseSchema.index({ published: 1, createdAt: -1 });
courseSchema.index({ title: 'text', subtitle: 'text', description: 'text', tags: 'text' });
courseSchema.virtual('lessonCount').get(function lessonCount() {
  return this.sections.reduce((count, section) => count + section.lessons.length, 0);
});
courseSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Course', courseSchema);
