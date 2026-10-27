require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/db');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');

async function run() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const educator = await User.findOneAndUpdate(
    { email: 'educator@edemy.local' },
    { $set: { name: 'Aarav Sharma', role: 'educator' }, $setOnInsert: { email: 'educator@edemy.local', passwordHash } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const student = await User.findOneAndUpdate(
    { email: 'student@edemy.local' },
    { $set: { name: 'Riya Verma', role: 'student' }, $setOnInsert: { email: 'student@edemy.local', passwordHash } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  // Ensure a known password works when the seed is rerun.
  await User.updateOne({ _id: educator._id }, { $set: { passwordHash } });
  await User.updateOne({ _id: student._id }, { $set: { passwordHash } });

  // Optional development administrator: only created when both credentials are explicitly supplied.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    const adminHash = await bcrypt.hash(adminPassword, 12);
    await User.findOneAndUpdate({ email: adminEmail }, { $set: { name: 'Edemy Administrator', role: 'admin', active: true, passwordHash: adminHash }, $setOnInsert: { email: adminEmail } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`Development administrator configured for ${adminEmail}`);
  } else {
    console.log('Admin seed skipped. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to create a development administrator.');
  }

  const courses = [
    {
      slug: 'modern-react-and-typescript', title: 'Modern React & TypeScript', subtitle: 'Build polished, maintainable interfaces from the ground up.',
      description: 'Learn component design, hooks, data fetching, TypeScript fundamentals, routing, accessibility, and how to ship a complete React application. This course is designed for developers who know basic JavaScript and want to build real projects.',
      category: 'Development', level: 'Intermediate', language: 'English', price: 39,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=85', tags: ['React', 'TypeScript', 'Frontend'], published: true,
      sections: [
        { title: 'Get set up', lessons: [
          { title: 'Welcome and course map', description: 'What we will build and how to use the course.', videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk', durationMinutes: 5, isPreview: true },
          { title: 'A useful React mental model', description: 'Components, props, state, and rendering.', videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk', durationMinutes: 14 }
        ]},
        { title: 'Build interactive UI', lessons: [
          { title: 'State, events, and forms', description: 'Create predictable interactive components.', videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk', durationMinutes: 21 },
          { title: 'Reusable component patterns', description: 'Composition, props, and component boundaries.', videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk', durationMinutes: 18 }
        ]}
      ]
    },
    {
      slug: 'sql-for-data-analysis', title: 'SQL for Data Analysis', subtitle: 'Go from SELECT queries to confident business insights.',
      description: 'Practice filtering, joins, CTEs, window functions, grouping, and analytical problem solving with realistic sales and customer datasets. Includes a repeatable approach to turning a question into a query.',
      category: 'Data & Analytics', level: 'Beginner', language: 'English', price: 0,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85', tags: ['SQL', 'Analytics', 'Databases'], published: true,
      sections: [
        { title: 'SQL foundations', lessons: [
          { title: 'Welcome to analytical SQL', description: 'How to approach a business question with data.', videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', durationMinutes: 6, isPreview: true },
          { title: 'Filtering and grouping', description: 'WHERE, GROUP BY, and HAVING in practice.', videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', durationMinutes: 19 }
        ]},
        { title: 'Analyze real data', lessons: [
          { title: 'Join customers and orders', description: 'Combine related tables safely.', videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', durationMinutes: 23 },
          { title: 'Window functions', description: 'Rank, compare, and calculate running totals.', videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', durationMinutes: 25 }
        ]}
      ]
    },
    {
      slug: 'product-design-foundations', title: 'Product Design Foundations', subtitle: 'Turn ambiguous ideas into clear, usable experiences.',
      description: 'Learn user interviews, problem framing, journey maps, information architecture, prototyping, usability checks, and how to communicate design decisions to a product team.',
      category: 'Design', level: 'Beginner', language: 'English', price: 29,
      thumbnail: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=85', tags: ['UX', 'Product Design', 'Research'], published: true,
      sections: [
        { title: 'Understand the problem', lessons: [
          { title: 'Start with the user', description: 'The basics of user-centered product thinking.', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', durationMinutes: 7, isPreview: true },
          { title: 'Map the user journey', description: 'Find friction points and unmet needs.', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', durationMinutes: 16 }
        ]},
        { title: 'Prototype and learn', lessons: [
          { title: 'Low-fidelity prototypes', description: 'Explore ideas before polishing the pixels.', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', durationMinutes: 20 }
        ]}
      ]
    }
  ];

  const savedCourses = [];
  for (const data of courses) {
    const { slug, ...payload } = data;
    const course = await Course.findOneAndUpdate(
      { slug },
      { $set: { ...payload, slug, educator: educator._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    savedCourses.push(course);
  }

  const paidCourse = savedCourses.find((course) => course.slug === 'modern-react-and-typescript');
  await Enrollment.findOneAndUpdate(
    { user: student._id, course: paidCourse._id },
    { $setOnInsert: { user: student._id, course: paidCourse._id, paymentStatus: 'demo', progressPercent: 25, completedLessonIds: [String(paidCourse.sections[0].lessons[0]._id)] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('\nDemo data ready.');
  console.log('Student:  student@edemy.local / demo1234');
  console.log('Educator: educator@edemy.local / demo1234');
  console.log('Seeded courses:', savedCourses.length);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
