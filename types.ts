
import { ThreeElements } from '@react-three/fiber';

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

export interface CommandMessage {
  type: 'COMMAND';
  command: string;
}

export type WebSocketMessage = TextMessage | VisemeMessage | AudioMessage | EventMessage | CommandMessage;

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

// --- Environment Configuration Types ---

export type LocationType = 'space' | 'cyber' | 'studio' | 'nature' | 'beach' | 'daily';
export type WeatherType = 'clear' | 'rain' | 'snow';
export type TimeType = 'day' | 'night';

export interface EnvironmentConfig {
  location: LocationType;
  weather: WeatherType;
  time: TimeType;
  showStars: boolean;
  showNebula: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
