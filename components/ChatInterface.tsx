
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, Role, EnvironmentConfig, LocationType, WeatherType, TimeType } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isRecording: boolean;
  avatarUrl: string;
  config: EnvironmentConfig;
  onConnect: () => void;
  onToggleRecord: () => void;
  onSendText: (text: string) => void;
  onUpdateAvatar: (url: string) => void;
  onUpdateConfig: (config: EnvironmentConfig) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isConnected,
  isRecording,
  avatarUrl,
  config,
  onConnect,
  onToggleRecord,
  onSendText,
  onUpdateAvatar,
  onUpdateConfig
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Temp state for settings modal
  const [tempAvatarUrl, setTempAvatarUrl] = useState(avatarUrl);
  const [tempConfig, setTempConfig] = useState<EnvironmentConfig>(config);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync temp state when modal opens or props change
  useEffect(() => {
    setTempAvatarUrl(avatarUrl);
    setTempConfig(config);
  }, [avatarUrl, config, showSettings]);

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
    }
    onUpdateConfig(tempConfig);
    setShowSettings(false);
  };

  const getLastText = () => {
    const agentMessages = messages.filter(m => m.role === 'llm');
    const lastMsg = agentMessages[agentMessages.length - 1];
    return lastMsg ? lastMsg.text : "System initialized. Waiting for input...";
  };

  const updateTempConfig = (key: keyof EnvironmentConfig, value: any) => {
      setTempConfig(prev => ({ ...prev, [key]: value }));
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
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-cyan-900/40 border border-cyan-500/30 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
            title="System Configuration"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.15 1.006c.77.25 1.493.633 2.13 1.12l.983-.34c.528-.182 1.116.037 1.35.53l.546 1.144c.235.494.103 1.086-.33 1.46l-.757.653c.068.39.108.793.108 1.202 0 .408-.04.811-.108 1.2l.757.653c.433.374.565.966.33 1.46l-.546 1.144c-.234.494-.822.712-1.35.53l-.983-.34a9.07 9.07 0 01-2.13 1.12l-.15 1.006c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.15-1.006c-.77-.25-1.493-.633-2.13-1.12l-.983.34c-.528.182-1.116-.037-1.35-.53l-.546-1.144c-.234-.494-.103-1.086.33-1.46l.757-.653a9.08 9.08 0 01-.108-1.2c0-.409.04-.812.108-1.201l-.757-.653c-.433-.374-.565-.966-.33-1.46l.546-1.144c.234-.494.822-.712 1.35-.53l.983.34c.637-.487 1.36-1.87 2.13-1.12l.15-1.006z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtitle overlay removed to avoid blocking avatar */}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto p-4">
            <div className="bg-slate-900 border border-cyan-500 rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden flex flex-col max-h-[95vh]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                
                <h2 className="text-2xl font-cyber text-cyan-400 mb-6 flex items-center gap-2">
                    SYSTEM CONFIGURATION
                </h2>

                <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    
                    {/* Avatar Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-tech text-cyan-300 uppercase tracking-wider block border-b border-cyan-500/30 pb-1 mb-3">Identity Matrix</label>
                        <input 
                            type="text" 
                            value={tempAvatarUrl}
                            onChange={(e) => setTempAvatarUrl(e.target.value)}
                            className="w-full bg-black/40 border border-slate-600 focus:border-cyan-500 rounded p-3 text-cyan-100 font-mono text-xs outline-none"
                            placeholder="https://models.readyplayer.me/..."
                        />
                         <a 
                            href="https://readyplayer.me/avatar" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white font-tech text-xs uppercase tracking-wider rounded transition-colors"
                        >
                            Open Avatar Creator
                        </a>
                    </div>

                    {/* Environment Grid */}
                    <div className="space-y-4">
                        <label className="text-xs font-tech text-cyan-300 uppercase tracking-wider block border-b border-cyan-500/30 pb-1">Environment Simulation</label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Location */}
                            <div>
                                <span className="block text-[10px] text-slate-500 mb-1 uppercase">Location</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['space', 'cyber', 'nature', 'studio', 'beach', 'daily'] as LocationType[]).map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() => updateTempConfig('location', loc)}
                                            className={`p-2 text-xs font-tech uppercase rounded border transition-all ${
                                                tempConfig.location === loc 
                                                ? 'bg-cyan-600/40 border-cyan-400 text-cyan-200' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                            }`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Weather & Time */}
                            <div className="space-y-4">
                                <div>
                                    <span className="block text-[10px] text-slate-500 mb-1 uppercase">Time of Day</span>
                                    <div className="flex gap-2 bg-slate-800 p-1 rounded border border-slate-700">
                                        {(['day', 'night'] as TimeType[]).map(time => (
                                            <button
                                                key={time}
                                                onClick={() => updateTempConfig('time', time)}
                                                className={`flex-1 py-1 text-xs font-tech uppercase rounded ${
                                                    tempConfig.time === time 
                                                    ? 'bg-cyan-500 text-white shadow-sm' 
                                                    : 'text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <span className="block text-[10px] text-slate-500 mb-1 uppercase">Atmosphere</span>
                                    <div className="flex gap-2">
                                        {(['clear', 'rain', 'snow'] as WeatherType[]).map(w => (
                                            <button
                                                key={w}
                                                onClick={() => updateTempConfig('weather', w)}
                                                className={`flex-1 py-1 px-2 text-[10px] font-tech uppercase rounded border transition-all ${
                                                    tempConfig.weather === w 
                                                    ? 'bg-blue-600/40 border-blue-400 text-blue-200' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                                }`}
                                            >
                                                {w}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Effects */}
                        <div>
                             <span className="block text-[10px] text-slate-500 mb-2 uppercase">Visual Effects</span>
                             <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={tempConfig.showStars}
                                        onChange={(e) => updateTempConfig('showStars', e.target.checked)}
                                        className="w-4 h-4 bg-slate-800 border-slate-600 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="text-xs font-tech text-slate-300 group-hover:text-cyan-400 transition-colors">Cosmic Dust / Stars</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={tempConfig.showNebula}
                                        onChange={(e) => updateTempConfig('showNebula', e.target.checked)}
                                        className="w-4 h-4 bg-slate-800 border-slate-600 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="text-xs font-tech text-slate-300 group-hover:text-cyan-400 transition-colors">Nebula Fog</span>
                                </label>
                             </div>
                        </div>
                    </div>

                </div>

                <div className="flex gap-4 pt-6 mt-auto border-t border-slate-700/50">
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
      )}

      {/* Bottom Interface (Chat + Voice) */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between w-full pointer-events-auto">
        <div className="w-full md:w-96 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-tr-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="bg-slate-800/50 p-2 border-b border-slate-700/50 flex justify-between items-center">
            <span className="text-xs font-tech text-cyan-500 uppercase">Text Data Link</span>
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
            </div>
          </div>
          <div ref={scrollRef} className="h-48 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.length === 0 && <div className="text-xs text-slate-500 font-tech italic text-center mt-10">Awaiting Input...</div>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className={`text-[10px] uppercase font-bold mb-0.5 ${msg.role === 'user' ? 'text-pink-500' : 'text-cyan-500'}`}>{msg.role === 'llm' ? 'Agent' : msg.role}</span>
                <div className={`p-2 rounded-lg text-sm max-w-[90%] border ${msg.role === 'user' ? 'bg-pink-500/10 border-pink-500/30 text-pink-100' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-100'}`}>{msg.text}</div>
              </div>
            ))}
          </div>
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

        <div className="flex flex-col items-center gap-4 w-full md:w-auto">
          {!isConnected ? (
             <button onClick={onConnect} className="group relative px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold uppercase tracking-widest clip-path-polygon transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                Initialize Link
                <div className="absolute inset-0 border border-white/20 group-hover:border-white/40 skew-x-12"></div>
             </button>
          ) : (
            <button 
                onMouseDown={onToggleRecord} onMouseUp={onToggleRecord} onTouchStart={onToggleRecord} onTouchEnd={onToggleRecord}
                className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-110' : 'bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400'}`}
            >
              <div className={`w-10 h-10 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'} rounded-sm clip-mic transition-colors`} />
              {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></div>}
            </button>
          )}
          <span className="text-xs font-tech text-slate-400 tracking-wider">{isConnected ? (isRecording ? 'TRANSMITTING VOICE...' : 'HOLD TO SPEAK') : 'AWAITING LINK'}</span>
        </div>
      </div>
    </div>
  );
};
