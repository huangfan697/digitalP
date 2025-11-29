import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Scene } from './components/Scene';
import { ChatInterface } from './components/ChatInterface';
import { AudioManager } from './services/audioManager';
import { WebSocketMessage, ChatMessage, Role } from './types';

// Initialize audio manager outside component to persist across re-renders
const audioManager = new AudioManager();

const WS_URL = "ws://localhost:8899/ws/voice";
const HTTP_URL = "http://localhost:8899/api/chat-tts";

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [asrActive, setAsrActive] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  // Track if we are currently playing audio to show "Talking" state
  const speakingTimeoutRef = useRef<number | null>(null);

  const addMessage = (role: Role, text: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      role,
      text,
      timestamp: new Date()
    }]);
  };

  const connect = async () => {
    try {
      await audioManager.initialize();
      
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        setIsConnected(true);
        addMessage('system', 'Link Established. Voice Channel Active.');
        
        // Setup audio callback to send data to WS
        audioManager.onAudioData = (data) => {
           if (ws.readyState === WebSocket.OPEN) {
             ws.send(data);
           }
        };
      };

      ws.onmessage = async (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'TEXT':
              // Map backend ASR role to UI "user" for display
              addMessage(data.role === 'asr' ? 'user' : data.role, data.text);
              break;
            
            case 'AUDIO':
              // Play audio
              await audioManager.playChunk(data.audio);
              
              // Set talking state visual
              setIsTalking(true);
              if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
              // Simple timeout heuristic
              speakingTimeoutRef.current = window.setTimeout(() => {
                setIsTalking(false);
              }, 500); 
              break;
              
            case 'VISEME':
              break;
              
            case 'EVENT':
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

      ws.onclose = () => {
        setIsConnected(false);
        addMessage('system', 'Link Severed.');
        setIsTalking(false);
      };
      
      ws.onerror = (e) => {
        console.error("WebSocket error", e);
        setIsConnected(false);
      };

      wsRef.current = ws;

    } catch (e) {
      console.error("Failed to initialize audio or websocket", e);
      alert("Microphone access is required.");
    }
  };

  const sendText = async (text: string) => {
    if (!text.trim()) return;
    
    addMessage('user', text);

    // Option 1: Send via WebSocket if open (Preferred as it triggers full pipeline with streaming)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(text);
        return;
    }

    // Option 2: Fallback to HTTP if WS is not connected, but we still want interaction
    try {
        const response = await fetch(HTTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        if (data.reply) {
            addMessage('llm', data.reply);
        }
        if (data.audio) {
            await audioManager.initialize(); // Ensure context exists
            await audioManager.playChunk(data.audio);
            setIsTalking(true);
            setTimeout(() => setIsTalking(false), 2000); // Rough estimate if streaming isn't used
        }
    } catch (e) {
        console.error("Failed to send text via HTTP", e);
        addMessage('system', 'Error sending message. Check connection.');
    }
  };

  const toggleRecording = useCallback(async () => {
    if (!isConnected) {
        alert("Please Initialize Link first.");
        return;
    }
    
    if (!isRecording) {
      setIsRecording(true);
      // start ASR session
      wsRef.current?.send(JSON.stringify({ cmd: 'start_asr' }));
      await audioManager.startRecording();
    } else {
      setIsRecording(false);
      audioManager.stopRecording();
      wsRef.current?.send(JSON.stringify({ cmd: 'stop_asr' }));
      setAsrActive(false);
    }
  }, [isConnected, isRecording]);

  // Clean up
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      audioManager.stopRecording();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene audioManager={audioManager} isTalking={isTalking} />
      </div>

      {/* UI Overlay */}
      <ChatInterface 
        messages={messages}
        isConnected={isConnected}
        isRecording={isRecording}
        onConnect={connect}
        onToggleRecord={toggleRecording}
        onSendText={sendText}
      />
    </div>
  );
}
