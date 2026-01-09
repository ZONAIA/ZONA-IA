
export type TabType = 'chat' | 'analysis' | 'maps' | 'voice';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'grounding';
  sources?: GroundingSource[];
  isThinking?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface IndustrialPart {
  name: string;
  category: string;
  specs: string;
  recommendations: string[];
}
