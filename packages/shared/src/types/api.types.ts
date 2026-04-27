export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Auth
export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// Server
export interface CreateServerRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

// Channel
export interface CreateChannelRequest {
  name: string;
  type?: "text" | "voice" | "announcement";
  categoryId?: string;
  topic?: string;
}

// Upload
export interface PresignRequest {
  filename: string;
  contentType: string;
  size: number;
}

export interface PresignResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}
