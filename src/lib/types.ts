export type Profile = {
  id: number;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
};

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  icon_url: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type SessionData = {
  admin: true;
  exp: number;
};
