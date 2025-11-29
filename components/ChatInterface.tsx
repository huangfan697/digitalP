import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, Role } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isRecording: boolean;
  onConnect: () => void;
  onToggleRecord: () => void;
  onSendText: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isConnected,
  isRecording,
  onConnect,
  onToggleRecord,
  onSendText
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (inputText.trim()) {
            onSendText(inputText);
            setInputText('');
        }
    }
  };

  const getLastText = () => {
    // Filter for system messages that might clutter the main subtitle view if desired,
    // or just show the absolute last message.
    // Showing only Agent (llm) text in big subtitles is often more cinematic.
    const agentMessages = messages.filter(m => m.role === 'llm');
    const lastMsg = agentMessages[agentMessages.length - 1];
    return lastMsg ? lastMsg.text : "System initialized. Waiting for input...";
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header / Status */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-br-2xl clip-corner">
          <h1 className="text-2xl font-cyber text-cyan-400 tracking-wider">AVATAR<span className="text-white">AGENT</span></h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
            <span className="text-xs font-tech text-slate-300 uppercase tracking-widest">
              {isConnected ? 'System Online' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Subtitle / Caption Display (Removed overlay to avoid blocking avatar) */}

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between w-full pointer-events-auto">
        
        {/* Chat / Text Input Panel (Left) */}
        <div className="w-full md:w-96 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-tr-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="bg-slate-800/50 p-2 border-b border-slate-700/50 flex justify-between items-center">
            <span className="text-xs font-tech text-cyan-500 uppercase">Text Data Link</span>
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
            </div>
          </div>
          
          {/* Messages Log */}
          <div ref={scrollRef} className="h-48 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.length === 0 && (
                <div className="text-xs text-slate-500 font-tech italic text-center mt-10">
                    Awaiting Input...
                </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className={`text-[10px] uppercase font-bold mb-0.5 ${msg.role === 'user' ? 'text-pink-500' : 'text-cyan-500'}`}>
                  {msg.role === 'llm' ? 'Agent' : msg.role}
                </span>
                <div className={`p-2 rounded-lg text-sm max-w-[90%] border ${
                  msg.role === 'user' 
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-100' 
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Field */}
          <div className="p-2 border-t border-slate-700/50 bg-black/20">
             <div className="relative flex items-center">
                <span className="absolute left-3 text-cyan-500 font-tech text-lg">{'>'}</span>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ENTER COMMAND OR MESSAGE..."
                    className="w-full bg-slate-800/50 text-cyan-100 font-tech pl-8 pr-4 py-2 rounded border border-slate-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm placeholder-slate-500"
                />
             </div>
          </div>
        </div>

        {/* Voice Control Panel (Right) */}
        <div className="flex flex-col items-center gap-4 w-full md:w-auto">
          {!isConnected ? (
             <button 
                onClick={onConnect}
                className="group relative px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold uppercase tracking-widest clip-path-polygon transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
             >
                Initialize Link
                <div className="absolute inset-0 border border-white/20 group-hover:border-white/40 skew-x-12"></div>
             </button>
          ) : (
            <button 
                onMouseDown={onToggleRecord}
                onMouseUp={onToggleRecord}
                onTouchStart={onToggleRecord}
                onTouchEnd={onToggleRecord}
                className={`
                  relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${isRecording 
                    ? 'bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-110' 
                    : 'bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400'}
                `}
            >
              <div className={`w-10 h-10 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'} rounded-sm clip-mic transition-colors`} />
              
              {/* Ring animation */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></div>
              )}
            </button>
          )}
          <span className="text-xs font-tech text-slate-400 tracking-wider">
            {isConnected ? (isRecording ? 'TRANSMITTING VOICE...' : 'HOLD TO SPEAK') : 'AWAITING LINK'}
          </span>
        </div>
      </div>

      <style>{`
        .clip-corner { clip-path: polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%); }
        .clip-mic { clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
