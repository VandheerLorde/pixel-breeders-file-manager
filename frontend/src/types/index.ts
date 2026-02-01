// src/types/index.ts

// --- Data Models ---
export interface User {
  id: number;
  email: string;
  date_joined: string;
}

export interface FileItem {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  human_readable_size?: string;
  created_at: string;
  storage_key?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

// --- Auth Payloads ---
export interface RegisterCredentials {
  email: string;
  password: string;
  password_confirm: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// --- Context Interfaces ---
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
}
