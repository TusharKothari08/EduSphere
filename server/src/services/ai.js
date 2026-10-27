// const OpenAI = require('openai');

// let client;
// function getClient() {
//   if (!process.env.OPENAI_API_KEY) return null;
//   if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//   return client;
// }

// async function mentorReply({ message, history = [], courseContext = '' }) {
//   const openai = getClient();
//   if (!openai) {
//     const topic = courseContext ? ` for your course context (${courseContext})` : '';
//     return `Let's break that down${topic}.\n\n1. **Start with the idea:** identify the main concept in your question.\n2. **Connect it to an example:** try a small, concrete example before memorizing definitions.\n3. **Check your understanding:** explain the idea in your own words, then test it with a short exercise.\n\nYour question was: “${message.slice(0, 220)}”\n\nThis is the local demo response. Add OPENAI_API_KEY in server/.env to enable AI-generated explanations.`;
//   }

//   const messages = [
//     {
//       role: 'system',
//       content: `You are Edemy AI Mentor, a patient tutor. Explain in clear steps, adapt to a learner, use examples, and ask at most one useful follow-up question. Do not claim to know course material that is not provided. ${courseContext ? `Course context: ${courseContext}` : ''}`
//     },
//     ...history.filter((item) => ['user', 'assistant'].includes(item.role)).slice(-8).map((item) => ({ role: item.role, content: String(item.content).slice(0, 3000) })),
//     { role: 'user', content: message }
//   ];
//   const completion = await openai.chat.completions.create({
//     model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
//     messages,
//     temperature: 0.4,
//     max_tokens: 700
//   });
//   return completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response just now. Please try again.';
// }

// module.exports = { mentorReply };



const Groq = require('groq-sdk');

let client;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return client;
}

async function mentorReply({
  message,
  history = [],
  courseContext = '',
}) {
  const groq = getClient();

  if (!groq) {
    throw new Error(
      'Groq is not configured. Add GROQ_API_KEY to server/.env and restart the backend.'
    );
  }

  const messages = [
    {
      role: 'system',
      content: [
        'You are Edemy AI Mentor, a patient and supportive learning tutor.',
        'Explain concepts in clear steps and adapt explanations to the learner.',
        'Use practical examples and encourage understanding rather than memorization.',
        'Ask at most one useful follow-up question.',
        'Never claim to know course material that has not been provided.',
        'If the course context is insufficient, be transparent about that.',
        courseContext
          ? `Course context:\n${courseContext}`
          : 'No specific course context was provided.',
      ].join('\n\n'),
    },
    ...history
      .filter(
        (item) =>
          item &&
          ['user', 'assistant'].includes(item.role) &&
          typeof item.content === 'string'
      )
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 3000),
      })),
    {
      role: 'user',
      content: message,
    },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages,
      temperature: 0.4,
      max_tokens: 700,
    });

    const reply = completion.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('Groq returned an empty response.');
    }

    return reply.trim();
  } catch (error) {
    console.error(
      'Groq AI Mentor request failed:',
      error.status || '',
      error.message
    );

    if (error.status === 429) {
      throw new Error(
        'The AI Mentor has reached its current usage limit. Please try again shortly.'
      );
    }

    if (error.status === 401 || error.status === 403) {
      throw new Error(
        'Groq authentication failed. Check GROQ_API_KEY in server/.env.'
      );
    }

    throw new Error(
      'The AI Mentor could not generate a response. Please try again.'
    );
  }
}

module.exports = { mentorReply };
