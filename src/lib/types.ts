export type Category = "key-event" | "memory" | "birthday" | "music" | "movie-tv" | "gaming";

export interface Memory {
  id: number | string;
  title: string;
  description: string;
  date: string;
  image: string;
  url: string;
  category: Category;
  preset?: boolean;
  communitySubmission?: boolean;
  submittedBy?: string;
  isPrivate?: boolean;
  userId?: string;
}

export interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  category: Category;
  url: string;
  image_url: string;
  is_public: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  users?: {
    display_name: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_admin: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  memory_id: string;
  memory_type: "preset" | "submission";
  user_id: string;
  content: string;
  created_at: string;
  users?: {
    display_name: string;
    email: string;
    avatar_url: string;
  };
  flag_count?: number;
}

export interface CommentFlag {
  id: string;
  comment_id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  memory_id: string;
  memory_type: "preset" | "submission";
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "submission_approved" | "submission_rejected" | "upvote";
  submission_id: string | null;
  actor_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export interface FlaggedComment extends Comment {
  flags: {
    id: string;
    reason: string;
    created_at: string;
    users?: { display_name: string; email: string };
  }[];
}
