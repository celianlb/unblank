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
  username?: string;
  avatarUrl?: string;
  subscription?: UserSubscription;
}

// Subscription types
export type SubscriptionPlanType = 'free' | 'pro' | 'team';

export interface SubscriptionFeatures {
  monthlyLinksLimit: number; // -1 = unlimited
  canUseAITags: boolean;
  canCreateGroups: boolean;
  canShareWithEdit: boolean;
  maxShareMembers: number; // -1 = unlimited
  hasUnlimitedCollaboration?: boolean;
}

export interface UserSubscription {
  planType: SubscriptionPlanType;
  status: string;
  features: SubscriptionFeatures;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface UserUsage {
  linksThisMonth: number;
  linksLimit: number; // -1 = unlimited
  linksRemaining: number; // -1 = unlimited
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

export interface UserData {
  user: UserProfile;
  subscription: UserSubscription;
  usage: UserUsage;
}

// Storage types
export interface ExtensionStorage {
  apiUrl?: string;
  apiKey?: string;
  settings?: UserSettings;
  auth_session?: AuthSession;
  user_data?: UserData;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
}
