export type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  tag: string | null;
  link_url: string | null;
  created_at: string;
  poll_options: string[] | null;
  is_sensitive?: boolean;
  edited_at?: string | null;
  poll_votes?: { option_idx: number }[];
  likes?: { vote: number }[];
  comments?: { count: number }[];
  profiles?: { id?: string; apelido: string; avatar_url?: string | null };
  communities?: { name: string; slug: string };
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  members: number;
  rules: string | null;
  banner_url: string | null;
  created_at: string;
};

export function postScore(post: Post): number {
  return (post.likes || []).reduce((s, l) => s + (l.vote || 0), 0);
}

export function postCommentCount(post: Post): number {
  return post.comments?.[0]?.count ?? 0;
}
