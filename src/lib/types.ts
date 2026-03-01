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
}

export interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  category: Category;
  url: string;
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
  is_admin: boolean;
  created_at: string;
}
