// src/types/index.ts

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
  human_readable_size?: string; // We added this in Phase 5
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
