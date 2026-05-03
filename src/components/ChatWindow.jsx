import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatWindow = ({ messages, isGenerating }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/20 relative">
             <Sparkles className="absolute -top-2 -right-2 text-yellow-300" size={20} />
             <Bot size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4 tracking-tight">How can I help you today?</h2>
          <p className="text-gray-400/80 font-medium mb-8">Ask me anything, or try one of the suggestions below.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
             <button className="p-4 rounded-2xl bg-[#1e2025] hover:bg-[#2d3038] border border-[#2d3038] hover:border-indigo-500/30 transition-all duration-300 group">
               <div className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-indigo-400 transition-colors">Summarize text</div>
               <div className="text-xs text-gray-500 line-clamp-2">Help me understand a long article or document quickly.</div>
             </button>
             <button className="p-4 rounded-2xl bg-[#1e2025] hover:bg-[#2d3038] border border-[#2d3038] hover:border-purple-500/30 transition-all duration-300 group">
               <div className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-purple-400 transition-colors">Write code</div>
               <div className="text-xs text-gray-500 line-clamp-2">Create a Python script to automate my daily tasks.</div>
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-8">
        {messages.map((msg, idx) => {
          if (isGenerating && idx === messages.length - 1 && msg.role === 'assistant' && msg.content === '') {
            return null;
          }
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center mt-1 shadow-md ${
                msg.role === 'user' ? 'bg-[#2d3038] text-gray-200' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-purple-500/30'
              }`}>
                {msg.role === 'user' ? <UserIcon size={18} /> : <Bot size={20} />}
              </div>
              
              <div className={`flex-1 overflow-hidden rounded-3xl px-5 py-4 text-[15px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#2d3038] text-gray-100 ml-8 md:ml-12 rounded-tr-sm' 
                  : 'bg-transparent text-gray-200 mr-8 md:mr-12'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.displayContent !== undefined ? msg.displayContent : msg.content}</div>
                ) : (
                  <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1a1b1e] prose-pre:border prose-pre:border-[#2d3038] max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="rounded-xl overflow-hidden my-6 border border-[#2d3038] bg-[#1a1b1e]">
                              <div className="flex items-center justify-between px-4 py-2 bg-[#2d3038]/50 border-b border-[#2d3038] text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                {match[1]}
                              </div>
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, background: 'transparent', padding: '1rem' }}
                                className="text-sm"
                              />
                            </div>
                          ) : (
                            <code {...props} className="bg-[#2d3038] px-1.5 py-0.5 rounded-md text-indigo-300 font-mono text-[0.9em]">
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {isGenerating && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content === '' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 md:gap-6"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center mt-1 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/30">
              <Bot size={20} />
            </div>
            <div className="flex items-center gap-1.5 px-5 py-5 text-gray-400">
               <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
               <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
               <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

export default ChatWindow;
