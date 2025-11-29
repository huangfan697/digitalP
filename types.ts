export type Role = 'asr' | 'llm' | 'system' | 'user';

export interface TextMessage {
  type: 'TEXT';
  role: Role;
  text: string;
  emotion?: string;
}

export interface VisemeData {
  phoneme: string;
  start: number;
  end: number;
}

export interface VisemeMessage {
  type: 'VISEME';
  viseme: VisemeData;
}

export interface AudioMessage {
  type: 'AUDIO';
  audio: string; // Base64 PCM
}

export interface EventMessage {
  type: 'EVENT';
  event: string;
}

export type WebSocketMessage = TextMessage | VisemeMessage | AudioMessage | EventMessage;

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}