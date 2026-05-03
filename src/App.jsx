import React, { useState, useRef, useEffect } from 'react';
import { Menu, PanelLeftClose, ChevronDown } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3.1');
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOllamaStream = async (userMessage, attachments = []) => {
    setIsGenerating(true);

    // Construct the full prompt content including attachments
    let fullContent = userMessage;
    const textAttachments = attachments.filter(a => a.type === 'text' || a.type === 'pdf');
    if (textAttachments.length > 0) {
      fullContent += '\n\n' + textAttachments.map(a => `--- Content of ${a.name} ---\n${a.content}\n---------------------------`).join('\n\n');
    }

    const images = attachments.filter(a => a.type === 'image').map(a => a.data);

    const newUserMsg = {
      role: 'user',
      content: fullContent,
      displayContent: userMessage,
      ...(images.length > 0 && { images })
    };

    const apiMessages = [...messages, newUserMsg].map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.images && { images: msg.images })
    }));

    setMessages(prev => [...prev, newUserMsg, { role: 'assistant', content: '' }]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // The last element might be an incomplete JSON string
          buffer = lines.pop();

          for (const line of lines) {
            if (line.trim() === '') continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content: newMessages[lastIndex].content + parsed.message.content
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Error parsing stream line:", line, e);
            }
          }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log("Generation stopped by user.");
      } else {
        console.error("Failed to fetch from Ollama:", e);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          lastMsg.content = `**Error:** Failed to connect to Ollama. Make sure the Ollama server is running locally on \`http://localhost:11434\` and the model \`${selectedModel}\` is installed.\n\n\`\`\`bash\nollama run ${selectedModel}\n\`\`\`\n\n*Details: ${e.message}*`;
          return newMessages;
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0f1115] overflow-hidden text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header / Top Bar */}
        <header className="h-14 flex items-center px-4 border-b border-[#1e2025] shrink-0 sticky top-0 z-10 bg-[#0f1115]/80 backdrop-blur-md">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2d3038] transition-colors cursor-pointer"
          >
            {isSidebarOpen ? <PanelLeftClose size={20} className="hidden md:block" /> : <Menu size={20} />}
            {isSidebarOpen && <Menu size={20} className="md:hidden" />}
          </button>

          <div className="flex-1 flex justify-center">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl hover:bg-[#2d3038] transition-colors font-medium text-[15px] text-gray-200 group cursor-pointer">
              <span className="truncate max-w-[120px] sm:max-w-xs capitalize">{selectedModel}</span>
              <ChevronDown size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
            </button>
          </div>

          <div className="w-9" /> {/* Spacer to center the model name */}
        </header>

        {/* Chat Area */}
        <ChatWindow messages={messages} isGenerating={isGenerating} />

        {/* Input Area */}
        <ChatInput onSendMessage={handleOllamaStream} isGenerating={isGenerating} onStop={handleStop} />
      </div>
    </div>
  );
}

export default App;
