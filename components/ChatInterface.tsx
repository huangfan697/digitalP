import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, Role } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isRecording: boolean;
  avatarUrl: string;
  onConnect: () => void;
  onToggleRecord: () => void;
  onSendText: (text: string) => void;
  onUpdateAvatar: (url: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isConnected,
  isRecording,
  avatarUrl,
  onConnect,
  onToggleRecord,
  onSendText,
  onUpdateAvatar
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState(avatarUrl);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync temp url if prop changes externally
  useEffect(() => {
    setTempAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (inputText.trim()) {
            onSendText(inputText);
            setInputText('');
        }
    }
  };

  const handleSaveSettings = () => {
    if (tempAvatarUrl.trim()) {
        onUpdateAvatar(tempAvatarUrl.trim());
        setShowSettings(false);
    }
  };

  const getLastText = () => {
    const agentMessages = messages.filter(m => m.role === 'llm');
    const lastMsg = agentMessages[agentMessages.length - 1];
    return lastMsg ? lastMsg.text : "System initialized. Waiting for input...";
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header / Status */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-br-2xl clip-corner flex items-center gap-6">
          <div>
              <h1 className="text-2xl font-cyber text-cyan-400 tracking-wider">AVATAR<span className="text-white">AGENT</span></h1>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
                <span className="text-xs font-tech text-slate-300 uppercase tracking-widest">
                  {isConnected ? 'System Online' : 'Disconnected'}
                </span>
              </div>
          </div>
          
          {/* Settings Button */}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-cyan-900/40 border border-cyan-500/30 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
            title="System Configuration"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtitle overlay removed to avoid blocking avatar */}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto p-4">
            <div className="bg-slate-900 border border-cyan-500 rounded-xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden">
                {/* Decorative lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-cyan-500/20 rounded-br-xl"></div>

                <h2 className="text-2xl font-cyber text-cyan-400 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    SYSTEM CONFIGURATION
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-tech text-slate-400 uppercase tracking-wider mb-2">Avatar Source URL (.glb)</label>
                        <input 
                            type="text" 
                            value={tempAvatarUrl}
                            onChange={(e) => setTempAvatarUrl(e.target.value)}
                            className="w-full bg-black/40 border border-slate-600 focus:border-cyan-500 rounded p-3 text-cyan-100 font-mono text-xs outline-none transition-colors"
                            placeholder="https://models.readyplayer.me/..."
                        />
                        <p className="text-[10px] text-slate-500 mt-2">
                            Compatible with Ready Player Me avatars.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
                        <p className="text-sm text-slate-300 font-tech mb-3">Design your own digital identity:</p>
                        <a 
                            href="https://readyplayer.me/avatar" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded text-xs uppercase tracking-widest transition-colors"
                        >
                            Launch Avatar Creator
                        </a>
                        <p className="text-[10px] text-slate-500 mt-2 text-center">
                            After creating, copy the GLB link and paste it above.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-700">
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="flex-1 py-3 border border-slate-600 hover:bg-slate-800 text-slate-300 font-tech uppercase tracking-wider rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveSettings}
                            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold uppercase tracking-wider rounded transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        >
                            Apply Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

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
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
