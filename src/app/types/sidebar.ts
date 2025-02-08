export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  senderId: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  updatedAt: Date;
  unreadCount: number;
  isPinned: boolean;
}

export type Section = {
  id: string;
  title: string;
  conversations: Conversation[];
};