// Activity model for tracking user actions
export interface Activity {
  id: string;
  type: string;
  message?: string;
  content?: string;
  createdAt: Date;
  userId: string;
  userName?: string;
  username?: string;
  userImage?: string;
  userAvatar?: string;
  details?: Record<string, any>;
} 