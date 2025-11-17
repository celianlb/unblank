// Message types for communication between extension components
export interface Message {
  type: string;
  payload?: any;
}

export interface BackgroundMessage extends Message {
  type: 'GET_DATA' | 'SAVE_DATA';
}

export interface ContentMessage extends Message {
  type: 'PING' | 'UPDATE_DOM';
}

// Storage types
export interface ExtensionStorage {
  apiUrl?: string;
  apiKey?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
}
