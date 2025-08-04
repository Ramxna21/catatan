export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: 'love' | 'happy' | 'sad' | 'hopeful' | 'grateful';
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onGoogleLogin: (user: User) => void;
}

export interface ShareModalProps {
  isOpen: boolean;
  entry: DiaryEntry;
  onClose: () => void;
}