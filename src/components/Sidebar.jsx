import React from 'react';
import { MessageSquare, Plus, Settings, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="md:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.div 
        initial={false}
        animate={{ 
          width: isOpen ? '280px' : '0px', 
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed md:relative top-0 left-0 h-full bg-[#17181c] border-r border-[#2d3038] flex flex-col overflow-hidden whitespace-nowrap z-30 shrink-0 shadow-2xl md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-3 flex items-center justify-between mt-14 md:mt-0">
          <button className="flex-1 flex items-center gap-2 bg-[#2d3038] hover:bg-[#363a45] text-gray-100 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm active:scale-95 cursor-pointer">
            <Plus size={18} />
            <span>New Chat</span>
          </button>
          
          <button onClick={toggleSidebar} className="md:hidden ml-2 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2d3038] transition-colors cursor-pointer">
             <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
          <div className="text-xs font-bold text-gray-500 mb-3 px-2 uppercase tracking-widest">Recent</div>
          {[
            'Setup Llama model locally',
            'Explain Quantum Computing',
            'Vite vs Webpack comparison',
            'Create a React Dashboard'
          ].map((chat, idx) => (
            <button key={idx} className="w-full flex items-center gap-3 text-gray-300 hover:bg-[#2d3038] hover:text-white px-3 py-3 rounded-xl transition-colors text-sm text-left truncate group cursor-pointer">
              <MessageSquare size={16} className="shrink-0 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              <span className="truncate">{chat}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-[#2d3038] space-y-1 bg-[#17181c]">
          <button className="w-full flex items-center gap-3 text-gray-300 hover:bg-[#2d3038] hover:text-white px-3 py-3 rounded-xl transition-colors text-sm font-medium group cursor-pointer">
            <Settings size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 text-gray-300 hover:bg-[#2d3038] hover:text-white px-3 py-3 rounded-xl transition-colors text-sm font-medium group cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <User size={14} className="text-white" />
            </div>
            <span>My Profile</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
