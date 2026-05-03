import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Square, Globe } from 'lucide-react';

import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ChatInput = ({ onSendMessage, isGenerating, onStop }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isGenerating) {
      onSendMessage(input.trim(), attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target.result.split(',')[1];
          setAttachments(prev => [...prev, { type: 'image', name: file.name, data: base64Data, url: e.target.result }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += `\n--- Page ${i} ---\n${pageText}`;
            }
            setAttachments(prev => [...prev, { type: 'pdf', name: file.name, content: fullText }]);
          } catch (err) {
            console.error("PDF Extraction error:", err);
            setAttachments(prev => [...prev, { type: 'pdf', name: file.name, content: '[Error extracting PDF text]' }]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments(prev => [...prev, { type: 'text', name: file.name, content: e.target.result }]);
        };
        reader.readAsText(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 md:p-6 pb-6 md:pb-8 bg-gradient-to-t from-[#0f1115] via-[#0f1115] to-transparent shrink-0">
      <div className="max-w-4xl mx-auto relative">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 px-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-visible border border-[#2d3038] bg-[#1e2025] flex items-center gap-3 p-2 pr-4 shadow-md max-w-[200px]">
                {att.type === 'image' && (
                  <img src={att.url} alt="attachment" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                )}
                {att.type === 'pdf' && (
                  <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-lg flex items-center justify-center shrink-0">
                    <span className="font-bold text-[10px] uppercase">PDF</span>
                  </div>
                )}
                {att.type === 'text' && (
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                    <span className="font-bold text-[10px] uppercase">TXT</span>
                  </div>
                )}
                {(att.type === 'pdf' || att.type === 'text' || att.type === 'image') && (
                  <div className="text-xs text-gray-300 truncate w-full font-medium" title={att.name}>{att.name}</div>
                )}
                <button 
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-[#4b505f] hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <form 
          onSubmit={handleSubmit}
          className="bg-[#1e2025] rounded-3xl p-2 pl-4 flex items-end gap-2 shadow-xl border border-[#2d3038] focus-within:border-indigo-500/50 transition-all duration-300 focus-within:shadow-indigo-500/10"
        >
          <div className="flex gap-1 mb-1.5 shrink-0">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#2d3038] transition-colors cursor-pointer"
              title="Attach File"
            >
              <Paperclip size={20} />
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Local Llama..."
            className="w-full max-h-52 py-3.5 bg-transparent border-none focus:outline-none text-gray-100 placeholder-gray-500 resize-none overflow-y-auto text-[15px] leading-relaxed cursor-text"
            rows="1"
          />
          
          <div className="mb-1.5 shrink-0 pr-1">
            {isGenerating ? (
              <button 
                type="button"
                onClick={onStop}
                className="p-3 bg-[#404452] text-white hover:bg-[#4b505f] rounded-full transition-all flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Square size={18} fill="currentColor" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className={`p-3 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                  input.trim() || attachments.length > 0
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25 active:scale-95' 
                    : 'bg-[#2d3038] text-gray-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </form>
        <div className="text-center text-xs text-gray-500 mt-4 font-medium px-4">
          Local Llama may produce inaccurate information about people, places, or facts. Verify important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
