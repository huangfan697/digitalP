import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Scene } from './components/Scene';
import { ChatInterface } from './components/ChatInterface';
import { AudioManager } from './services/audioManager';
import { WebSocketMessage, ChatMessage, Role, EnvironmentConfig } from './types';

// Initialize audio manager outside component to persist across re-renders
const audioManager = new AudioManager();

const WS_URL = "ws://localhost:8899/ws/voice";
const HTTP_URL = "http://localhost:8899/api/chat-tts";

// Default Avatar URL
const DEFAULT_AVATAR = "https://models.readyplayer.me/64e3055495439dfcf3f0b665.glb";

// Default Config
const DEFAULT_CONFIG: EnvironmentConfig = {
  location: 'beach',
  weather: 'clear',
  time: 'day',
  showStars: false,
  showNebula: false
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [asrActive, setAsrActive] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [config, setConfig] = useState<EnvironmentConfig>(DEFAULT_CONFIG);
  
  const wsRef = useRef<WebSocket | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);

  const addMessage = (role: Role, text: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === text) {
        return prev;
      }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        role,
        text,
        timestamp: new Date()
      }];
    });
  };

  const connect = async () => {
    try {
      await audioManager.initialize();
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        setIsConnected(true);
        addMessage('system', 'Link Established. Voice Channel Active.');
        audioManager.onAudioData = (data) => {
           if (ws.readyState === WebSocket.OPEN) ws.send(data);
        };
      };

      ws.onmessage = async (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          switch (data.type) {
            case 'TEXT': addMessage(data.role === 'asr' ? 'user' : data.role, data.text); break;
            case 'AUDIO':
              await audioManager.playChunk(data.audio);
              setIsTalking(true);
              if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
              speakingTimeoutRef.current = window.setTimeout(() => setIsTalking(false), 500); 
              break;
            case 'COMMAND':
              if (data.command === 'asr_started') setAsrActive(true);
              if (data.command === 'asr_stopped') setAsrActive(false);
              break;
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => { setIsConnected(false); addMessage('system', 'Link Severed.'); setIsTalking(false); };
      ws.onerror = (e) => { console.error("WebSocket error", e); setIsConnected(false); };
      wsRef.current = ws;

    } catch (e) {
      console.error("Failed to initialize audio or websocket", e);
      alert("Microphone access is required.");
    }
  };

  const sendText = async (text: string) => {
    if (!text.trim()) return;
    addMessage('user', text);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(text);
        return;
    }
    try {
        const response = await fetch(HTTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (data.reply) addMessage('llm', data.reply);
        if (data.audio) {
            await audioManager.initialize();
            await audioManager.playChunk(data.audio);
            setIsTalking(true);
            setTimeout(() => setIsTalking(false), 2000);
        }
    } catch (e) {
        console.error("Failed to send text via HTTP", e);
        addMessage('system', 'Error sending message. Check connection.');
    }
  };

  const toggleRecording = useCallback(async () => {
    if (!isConnected) { alert("Please Initialize Link first."); return; }
    if (!isRecording) { 
      setIsRecording(true); 
      wsRef.current?.send(JSON.stringify({ cmd: 'start_asr' }));
      await audioManager.startRecording(); 
    } else { 
      setIsRecording(false); 
      audioManager.stopRecording(); 
      wsRef.current?.send(JSON.stringify({ cmd: 'stop_asr' }));
      setAsrActive(false);
    }
  }, [isConnected, isRecording]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      audioManager.stopRecording();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Scene 
            audioManager={audioManager} 
            isTalking={isTalking} 
            avatarUrl={avatarUrl}
            config={config}
        />
      </div>
      <ChatInterface 
        messages={messages}
        isConnected={isConnected}
        isRecording={isRecording}
        avatarUrl={avatarUrl}
        config={config}
        onConnect={connect}
        onToggleRecord={toggleRecording}
        onSendText={sendText}
        onUpdateAvatar={setAvatarUrl}
        onUpdateConfig={setConfig}
      />
    </div>
  );
}
