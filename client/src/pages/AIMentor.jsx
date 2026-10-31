import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BookOpen,
  CornerDownLeft,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  Code2,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { api, getErrorMessage } from '../api';
import { useSession } from '../auth/AuthProvider';
import './mentor-markdown.css';

const mentorSuggestions = [
  {
    icon: 'concept',
    title: 'Explain a Concept',
    subtitle: 'Clear analogies & simple language',
    prompt:
      'Explain a difficult technical concept to me in simple language with an intuitive example and clear walkthrough.',
  },
  {
    icon: 'optimize',
    title: 'Code Review & Optimization',
    subtitle: 'Time & space complexity analysis',
    prompt:
      'How do I analyze the time and space complexity of an algorithm? Can you review a brute-force approach and explain how to optimize it to O(N)?',
  },
  {
    icon: 'interview',
    title: 'Technical Interview Prep',
    subtitle: 'Core CS, DBMS, OS & System Design',
    prompt:
      'Give me a core computer science interview question on DBMS indexing, ACID properties, or OS process scheduling, and evaluate my answer.',
  },
  {
    icon: 'example',
    title: 'Practical Code Example',
    subtitle: 'Step-by-step implementation',
    prompt:
      'Can you show me a practical code example of a real-world software pattern, explaining each part of the code step by step?',
  },
];

function MentorMarkdown({ content }) {
  return (
    <div className="mentor-markdown min-w-0 max-w-full text-slate-800 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900 dark:text-white font-['Manrope']">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-3 mb-2 text-slate-900 dark:text-white font-['Manrope']">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-2 mb-1 text-slate-800 dark:text-slate-100">
              {children}
            </h3>
          ),
          table: ({ children }) => (
            <div className="mentor-table-wrap overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="mentor-table w-full text-xs text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 border-b border-slate-200/60 dark:border-slate-800">
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-violet-600 dark:text-violet-400 underline font-medium hover:text-violet-700"
            >
              {children}
            </a>
          ),
          code({ className, children, ...props }) {
            const match = /language-([\w-]+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || String(children).includes('\n');

            if (!isBlock) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-300 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const copyCode = async () => {
              try {
                await navigator.clipboard.writeText(code);
                toast.success('Code copied to clipboard!');
              } catch {
                toast.error('Could not copy code. Please copy manually.');
              }
            };

            return (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                  <span className="font-mono flex items-center gap-1.5 font-semibold text-slate-300">
                    <Terminal size={12} className="text-violet-400" />
                    {match?.[1] || 'code'}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="hover:text-white transition font-medium cursor-pointer"
                  >
                    Copy
                  </button>
                </div>

                <SyntaxHighlighter
                  language={match?.[1] || 'text'}
                  style={oneDark}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '14px',
                    background: 'transparent',
                    fontSize: '12.5px',
                    lineHeight: 1.6,
                    overflowX: 'auto',
                  }}
                  wrapLongLines={false}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

export default function AIMentor() {
  const { user } = useSession();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') || '';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseName, setCourseName] = useState('');

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!courseId) {
      setCourseName('');
      return;
    }

    let cancelled = false;

    api
      .get(`/courses/${courseId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setCourseName(data.course?.title || '');
        }
      })
      .catch(() => {
        if (!cancelled) setCourseName('');
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, loading]);

  const sendMessage = async (value = input) => {
    const message = value.trim();

    if (!message || loading) return;

    if (!user) {
      toast.error('Please sign in to chat with your AI Mentor.');
      return;
    }

    const currentHistory = messages;
    const nextMessages = [
      ...currentHistory,
      { role: 'user', content: message },
    ];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/mentor', {
        message,
        courseId: courseId || undefined,
        history: currentHistory.slice(-8),
      });

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.reply,
          mode: data.mode,
        },
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error));

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'I encountered a small hiccup preparing that explanation. Please try sending your question again.',
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([]);
    setInput('');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-8 px-4 sm:px-6 transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to={courseId ? `/courses/${courseId}` : '/courses'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition mb-2"
            >
              <ArrowLeft size={14} />
              {courseId ? 'Back to course syllabus' : 'Explore courses'}
            </Link>

            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <Sparkles size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                    EDUNEXA AI Mentor
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] tracking-wide uppercase border border-emerald-300 dark:border-emerald-800">
                    Online
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your personal learning companion for coding, concepts, and technical questions.
                </p>
              </div>
            </div>
          </div>

          {courseName && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-xs font-semibold text-violet-700 dark:text-violet-300">
              <BookOpen size={14} />
              <span>
                Asking in context of: <strong>{courseName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Chat Window Shell */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[70vh] min-h-[500px] overflow-hidden">
          {/* Chat Window Subheader */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                AI Companion Active
              </span>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>New Session</span>
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-8">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 shadow-xs">
                  <Bot size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
                  Curiosity looks good on you.
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  I'm here to help you understand, not just memorize. Tell me what you're learning or where you got stuck.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 w-full text-left">
                  {mentorSuggestions.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => sendMessage(item.prompt)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 bg-slate-50/50 dark:bg-slate-850 hover:bg-violet-50/30 dark:hover:bg-violet-950/30 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-1 rounded-md bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                          {item.icon === 'concept' ? (
                            <Lightbulb size={13} />
                          ) : item.icon === 'optimize' ? (
                            <Code2 size={13} />
                          ) : item.icon === 'interview' ? (
                            <Cpu size={13} />
                          ) : (
                            <Layers size={13} />
                          )}
                        </span>
                        <strong className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                          {item.title}
                        </strong>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>{item.subtitle}</span>
                        <ArrowRight
                          size={11}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <span className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={16} />
                    </span>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MentorMarkdown content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <UserRound size={16} />
                    </span>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <span className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles size={16} />
                </span>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                  <LoaderCircle size={14} className="animate-spin text-violet-600" />
                  <span>Thinking through your question…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Composer Input Form */}
          <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form onSubmit={onSubmit} className="flex gap-2.5 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask a question or paste code you want to understand…"
                  rows={2}
                  maxLength={3000}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-slate-850 transition"
                />
                <div className="hidden sm:flex items-center justify-between px-1 pt-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CornerDownLeft size={10} />
                    Enter to send · Shift + Enter for new line
                  </span>
                  <span>{input.length}/3000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 sm:h-12 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {loading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={15} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Tip Note */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/60 text-violet-900 dark:text-violet-200 text-xs">
          <Lightbulb
            size={16}
            className="shrink-0 text-violet-600 dark:text-violet-400"
          />
          <span>
            <strong>Learning Tip:</strong> Great questions often begin with “why does this work?”, “what is the difference between X and Y?”, or “can you give me an example?”
          </span>
        </div>
      </div>
    </div>
  );
}
