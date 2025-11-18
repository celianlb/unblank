// Message types for communication between extension components
export interface Message {
  type: string;
  payload?: any;
}

export interface BackgroundMessage extends Message {
  type: 'GET_DATA' | 'SAVE_DATA' | 'AUTH_SESSION' | 'AUTH_SUCCESS';
}

export interface ContentMessage extends Message {
  type: 'PING' | 'UPDATE_DOM' | 'TOGGLE_OVERLAY';
}

// Auth types
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}

// Storage types
export interface ExtensionStorage {
  apiUrl?: string;
  apiKey?: string;
  settings?: UserSettings;
  auth_session?: AuthSession;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
}
