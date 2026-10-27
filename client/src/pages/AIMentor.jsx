
// import { useEffect, useRef, useState } from 'react';
// import {
//   ArrowLeft,
//   ArrowRight,
//   Bot,
//   BookOpen,
//   CornerDownLeft,
//   Lightbulb,
//   LoaderCircle,
//   RotateCcw,
//   Send,
//   Sparkles,
//   UserRound,
// } from 'lucide-react';
// import { Link, useSearchParams } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// import { api, getErrorMessage } from '../api';
// import { useSession } from '../auth/AuthProvider';
// import './mentor-markdown.css';

// const suggestions = [
//   {
//     icon: 'concept',
//     title: 'Explain a concept',
//     prompt:
//       'Explain a difficult technical concept to me in simple language with an example.',
//   },
//   {
//     icon: 'example',
//     title: 'Show me an example',
//     prompt:
//       'Give me a practical example and walk me through it step by step.',
//   },
//   {
//     icon: 'plan',
//     title: 'Make a learning plan',
//     prompt:
//       'Help me create a realistic 7-day learning plan for a new topic.',
//   },
// ];

// function MentorMarkdown({ content }) {
//   return (
//     <div className="mentor-markdown min-w-0 max-w-full">
//       <ReactMarkdown
//         remarkPlugins={[remarkGfm]}
//         components={{
//           h1: ({ children }) => (
//             <h1 className="text-2xl font-bold">{children}</h1>
//           ),
//           h2: ({ children }) => (
//             <h2 className="text-xl font-bold">{children}</h2>
//           ),
//           h3: ({ children }) => (
//             <h3 className="text-base font-semibold">{children}</h3>
//           ),
//           table: ({ children }) => (
//             <div className="mentor-table-wrap">
//               <table className="mentor-table">{children}</table>
//             </div>
//           ),
//           thead: ({ children }) => <thead>{children}</thead>,
//           th: ({ children }) => <th>{children}</th>,
//           td: ({ children }) => <td>{children}</td>,
//           a: ({ children, href }) => (
//             <a href={href} target="_blank" rel="noreferrer">
//               {children}
//             </a>
//           ),
//           code({ className, children, ...props }) {
//             const match = /language-([\w-]+)/.exec(className || '');
//             const code = String(children).replace(/\n$/, '');
//             const isBlock =
//               Boolean(match) || String(children).includes('\n');

//             if (!isBlock) {
//               return (
//                 <code className="mentor-inline-code" {...props}>
//                   {children}
//                 </code>
//               );
//             }

//             const copyCode = async () => {
//               try {
//                 await navigator.clipboard.writeText(code);
//                 toast.success('Code copied to clipboard!');
//               } catch {
//                 toast.error('Could not copy code. Please copy it manually.');
//               }
//             };

//             return (
//               <div className="mentor-code-block">
//                 <div className="mentor-code-header">
//                   <span>{match?.[1] || 'Code'}</span>
//                   <button type="button" onClick={copyCode}>
//                     Copy code
//                   </button>
//                 </div>

//                 <SyntaxHighlighter
//                   language={match?.[1] || 'text'}
//                   style={oneDark}
//                   PreTag="div"
//                   customStyle={{
//                     margin: 0,
//                     padding: '16px',
//                     background: 'transparent',
//                     fontSize: '13px',
//                     lineHeight: 1.6,
//                     overflowX: 'auto',
//                   }}
//                   wrapLongLines={false}
//                 >
//                   {code}
//                 </SyntaxHighlighter>
//               </div>
//             );
//           },
//         }}
//       >
//         {content || ''}
//       </ReactMarkdown>
//     </div>
//   );
// }

// export default function AIMentor() {
//   const { user } = useSession();
//   const [searchParams] = useSearchParams();
//   const courseId = searchParams.get('courseId') || '';

//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [courseName, setCourseName] = useState('');

//   const bottomRef = useRef(null);
//   const textareaRef = useRef(null);

//   useEffect(() => {
//     if (!courseId) {
//       setCourseName('');
//       return;
//     }

//     let cancelled = false;

//     api
//       .get(`/courses/${courseId}`)
//       .then(({ data }) => {
//         if (!cancelled) {
//           setCourseName(data.course?.title || '');
//         }
//       })
//       .catch(() => {
//         if (!cancelled) setCourseName('');
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [courseId]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: 'smooth',
//       block: 'end',
//     });
//   }, [messages, loading]);

//   const sendMessage = async (value = input) => {
//     const message = value.trim();

//     if (!message || loading) return;

//     if (!user) {
//       toast.error('Sign in to start a conversation with your AI Mentor.');
//       return;
//     }

//     const currentHistory = messages;
//     const nextMessages = [
//       ...currentHistory,
//       { role: 'user', content: message },
//     ];

//     setMessages(nextMessages);
//     setInput('');
//     setLoading(true);

//     try {
//       const { data } = await api.post('/ai/mentor', {
//         message,
//         courseId: courseId || undefined,
//         history: currentHistory.slice(-8),
//       });

//       setMessages((previous) => [
//         ...previous,
//         {
//           role: 'assistant',
//           content: data.reply,
//           mode: data.mode,
//         },
//       ]);
//     } catch (error) {
//       toast.error(getErrorMessage(error));

//       setMessages((previous) => [
//         ...previous,
//         {
//           role: 'assistant',
//           content:
//             'I hit a small snag while preparing that explanation. Please try sending your question again.',
//         },
//       ]);
//     } finally {
//       setLoading(false);
//       textareaRef.current?.focus();
//     }
//   };

//   const reset = () => {
//     setMessages([]);
//     setInput('');
//   };

//   const onSubmit = (event) => {
//     event.preventDefault();
//     sendMessage();
//   };

//   const onKeyDown = (event) => {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <main className="mentor-page">
//       <div className="container mentor-page-container">
//         <div className="mentor-page-heading">
//           <Link
//             to={courseId ? `/courses/${courseId}` : '/courses'}
//             className="back-link"
//           >
//             <ArrowLeft size={15} />
//             {courseId ? 'Back to course' : 'Explore courses'}
//           </Link>

//           <div className="mentor-heading-main">
//             <div className="mentor-page-mark">
//               <Sparkles size={25} />
//             </div>

//             <div>
//               <span className="section-kicker">
//                 YOUR PERSONAL LEARNING COMPANION
//               </span>
//               <h1>
//                 Let's figure it out{' '}
//                 <span className="highlight-text">together.</span>
//               </h1>
//               <p>
//                 Ask a question, get a fresh explanation, and keep moving
//                 forward.
//               </p>
//             </div>
//           </div>

//           {courseName && (
//             <div className="mentor-course-context">
//               <BookOpen size={15} />
//               Asking in context of <strong>{courseName}</strong>
//             </div>
//           )}
//         </div>

//         <div className="mentor-chat-shell">
//           <div className="mentor-chat-top">
//             <div className="mentor-online-avatar">
//               <Bot size={19} />
//               <span />
//             </div>

//             <div>
//               <strong>Edemy AI Mentor</strong>
//               <small>
//                 <span className="online-dot" />
//                 Here to help you learn
//               </small>
//             </div>

//             <div className="chat-top-spacer" />

//             {messages.length > 0 && (
//               <button
//                 type="button"
//                 className="btn btn-ghost btn-small"
//                 onClick={reset}
//               >
//                 <RotateCcw size={14} />
//                 New chat
//               </button>
//             )}

//             <span className="private-chip">Learning support</span>
//           </div>

//           <div
//             className={`mentor-chat-body ${
//               messages.length ? 'has-messages' : ''
//             }`}
//           >
//             {!messages.length ? (
//               <div className="mentor-welcome-state">
//                 <div className="mentor-welcome-art">
//                   <div className="welcome-sparkle sparkle-left">✦</div>
//                   <div className="welcome-robot">
//                     <Bot size={37} />
//                   </div>
//                   <div className="welcome-sparkle sparkle-right">✧</div>
//                 </div>

//                 <h2>Curiosity looks good on you.</h2>
//                 <p>
//                   I'm here to help you understand, not just memorize. Tell me
//                   what you're learning or where you got stuck.
//                 </p>

//                 <div className="suggestion-grid">
//                   {suggestions.map((suggestion) => (
//                     <button
//                       type="button"
//                       className="suggestion-card"
//                       key={suggestion.title}
//                       onClick={() => sendMessage(suggestion.prompt)}
//                     >
//                       <span
//                         className={`suggestion-icon ${suggestion.icon}`}
//                       >
//                         {suggestion.icon === 'concept' ? (
//                           <Lightbulb size={18} />
//                         ) : suggestion.icon === 'example' ? (
//                           <BookOpen size={18} />
//                         ) : (
//                           <Sparkles size={18} />
//                         )}
//                       </span>

//                       <strong>{suggestion.title}</strong>
//                       <span>
//                         Start here <ArrowRight size={13} />
//                       </span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="chat-messages">
//                 {messages.map((message, index) => (
//                   <div
//                     className={`chat-message ${message.role}`}
//                     key={`${message.role}-${index}`}
//                   >
//                     <span
//                       className={`chat-message-avatar ${message.role}`}
//                     >
//                       {message.role === 'assistant' ? (
//                         <Sparkles size={16} />
//                       ) : (
//                         <UserRound size={16} />
//                       )}
//                     </span>

//                     <div className="chat-message-content">
//                       <span className="chat-sender">
//                         {message.role === 'assistant'
//                           ? 'Edemy AI Mentor'
//                           : 'You'}
//                       </span>

//                       {message.role === 'assistant' ? (
//                         <MentorMarkdown content={message.content} />
//                       ) : (
//                         <p className="mentor-user-message">
//                           {message.content}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 ))}

//                 {loading && (
//                   <div className="chat-message assistant">
//                     <span className="chat-message-avatar assistant">
//                       <Sparkles size={16} />
//                     </span>

//                     <div className="chat-message-content">
//                       <span className="chat-sender">Edemy AI Mentor</span>
//                       <div className="typing-indicator">
//                         <i />
//                         <i />
//                         <i />
//                         <span>Thinking through your question</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div ref={bottomRef} />
//               </div>
//             )}
//           </div>

//           <form className="mentor-composer" onSubmit={onSubmit}>
//             <div className="composer-input-wrap">
//               <textarea
//                 ref={textareaRef}
//                 value={input}
//                 onChange={(event) => setInput(event.target.value)}
//                 onKeyDown={onKeyDown}
//                 rows={1}
//                 placeholder="Ask your learning question…"
//                 maxLength={3000}
//                 disabled={loading}
//               />

//               <div className="composer-meta">
//                 <span>
//                   <CornerDownLeft size={12} />
//                   Enter to send · Shift + Enter for a new line
//                 </span>
//                 <span>{input.length}/3000</span>
//               </div>
//             </div>

//             <button
//               className="send-button"
//               type="submit"
//               disabled={!input.trim() || loading}
//               aria-label="Send message"
//             >
//               {loading ? (
//                 <LoaderCircle size={19} className="spinning" />
//               ) : (
//                 <Send size={18} />
//               )}
//             </button>
//           </form>

//           <div className="mentor-disclaimer">
//             AI explanations can make mistakes. Use them as a learning aid and
//             verify important details with trusted resources.
//           </div>
//         </div>

//         <div className="mentor-bottom-note">
//           <span>
//             <Lightbulb size={16} />
//             Learning tip
//           </span>
//           <p>
//             Good questions often begin with “why”, “how”, or “can you show me
//             an example?”
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }




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
import './mentor-page.css';

const suggestions = [
  {
    icon: 'concept',
    title: 'Explain a concept',
    prompt:
      'Explain a difficult technical concept to me in simple language with an example.',
  },
  {
    icon: 'example',
    title: 'Show me an example',
    prompt:
      'Give me a practical example and walk me through it step by step.',
  },
  {
    icon: 'plan',
    title: 'Make a learning plan',
    prompt:
      'Help me create a realistic 7-day learning plan for a new topic.',
  },
];

function MentorMarkdown({ content }) {
  return (
    <div className="mentor-markdown min-w-0 max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold">{children}</h3>
          ),
          table: ({ children }) => (
            <div className="mentor-table-wrap">
              <table className="mentor-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          code({ className, children, ...props }) {
            const match = /language-([\w-]+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            const isBlock =
              Boolean(match) || String(children).includes('\n');

            if (!isBlock) {
              return (
                <code className="mentor-inline-code" {...props}>
                  {children}
                </code>
              );
            }

            const copyCode = async () => {
              try {
                await navigator.clipboard.writeText(code);
                toast.success('Code copied to clipboard!');
              } catch {
                toast.error('Could not copy code. Please copy it manually.');
              }
            };

            return (
              <div className="mentor-code-block">
                <div className="mentor-code-header">
                  <span>{match?.[1] || 'Code'}</span>
                  <button type="button" onClick={copyCode}>
                    Copy code
                  </button>
                </div>

                <SyntaxHighlighter
                  language={match?.[1] || 'text'}
                  style={oneDark}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    background: 'transparent',
                    fontSize: '13px',
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
      toast.error('Sign in to start a conversation with your AI Mentor.');
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
            'I hit a small snag while preparing that explanation. Please try sending your question again.',
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
    <main className="mentor-page">
      <div className="container mentor-page-container">
        <div className="mentor-page-heading">
          <Link
            to={courseId ? `/courses/${courseId}` : '/courses'}
            className="back-link"
          >
            <ArrowLeft size={15} />
            {courseId ? 'Back to course' : 'Explore courses'}
          </Link>

          <div className="mentor-heading-main">
            <div className="mentor-page-mark">
              <Sparkles size={25} />
            </div>

            <div>
              <span className="section-kicker">
                YOUR PERSONAL LEARNING COMPANION
              </span>
              <h1>
                Let's figure it out{' '}
                <span className="highlight-text">together.</span>
              </h1>
              <p>
                Ask a question, get a fresh explanation, and keep moving
                forward.
              </p>
            </div>
          </div>

          {courseName && (
            <div className="mentor-course-context">
              <BookOpen size={15} />
              Asking in context of <strong>{courseName}</strong>
            </div>
          )}
        </div>

        <div className="mentor-chat-shell">
          <div className="mentor-chat-top">
            <div className="mentor-online-avatar">
              <Bot size={19} />
              <span />
            </div>

            <div>
              <strong>Edemy AI Mentor</strong>
              <small>
                <span className="online-dot" />
                Here to help you learn
              </small>
            </div>

            <div className="chat-top-spacer" />

            {messages.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={reset}
              >
                <RotateCcw size={14} />
                New chat
              </button>
            )}

            <span className="private-chip">Learning support</span>
          </div>

          <div
            className={`mentor-chat-body ${
              messages.length ? 'has-messages' : ''
            }`}
          >
            {!messages.length ? (
              <div className="mentor-welcome-state">
                <div className="mentor-welcome-art">
                  <div className="welcome-sparkle sparkle-left">✦</div>
                  <div className="welcome-robot">
                    <Bot size={37} />
                  </div>
                  <div className="welcome-sparkle sparkle-right">✧</div>
                </div>

                <h2>Curiosity looks good on you.</h2>
                <p>
                  I'm here to help you understand, not just memorize. Tell me
                  what you're learning or where you got stuck.
                </p>

                <div className="suggestion-grid">
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      className="suggestion-card"
                      key={suggestion.title}
                      onClick={() => sendMessage(suggestion.prompt)}
                    >
                      <span
                        className={`suggestion-icon ${suggestion.icon}`}
                      >
                        {suggestion.icon === 'concept' ? (
                          <Lightbulb size={18} />
                        ) : suggestion.icon === 'example' ? (
                          <BookOpen size={18} />
                        ) : (
                          <Sparkles size={18} />
                        )}
                      </span>

                      <strong>{suggestion.title}</strong>
                      <span>
                        Start here <ArrowRight size={13} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div
                    className={`chat-message ${message.role}`}
                    key={`${message.role}-${index}`}
                  >
                    <span
                      className={`chat-message-avatar ${message.role}`}
                    >
                      {message.role === 'assistant' ? (
                        <Sparkles size={16} />
                      ) : (
                        <UserRound size={16} />
                      )}
                    </span>

                    <div className="chat-message-content">
                      <span className="chat-sender">
                        {message.role === 'assistant'
                          ? 'Edemy AI Mentor'
                          : 'You'}
                      </span>

                      {message.role === 'assistant' ? (
                        <MentorMarkdown content={message.content} />
                      ) : (
                        <p className="mentor-user-message">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="chat-message assistant">
                    <span className="chat-message-avatar assistant">
                      <Sparkles size={16} />
                    </span>

                    <div className="chat-message-content">
                      <span className="chat-sender">Edemy AI Mentor</span>
                      <div className="typing-indicator">
                        <i />
                        <i />
                        <i />
                        <span>Thinking through your question</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form className="mentor-composer" onSubmit={onSubmit}>
            <div className="composer-input-wrap">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask your learning question…"
                maxLength={3000}
                disabled={loading}
              />

              <div className="composer-meta">
                <span>
                  <CornerDownLeft size={12} />
                  Enter to send · Shift + Enter for a new line
                </span>
                <span>{input.length}/3000</span>
              </div>
            </div>

            <button
              className="send-button"
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              {loading ? (
                <LoaderCircle size={19} className="spinning" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>

          <div className="mentor-disclaimer">
            AI explanations can make mistakes. Use them as a learning aid and
            verify important details with trusted resources.
          </div>
        </div>

        <div className="mentor-bottom-note">
          <span>
            <Lightbulb size={16} />
            Learning tip
          </span>
          <p>
            Good questions often begin with “why”, “how”, or “can you show me
            an example?”
          </p>
        </div>
      </div>
    </main>
  );
}
