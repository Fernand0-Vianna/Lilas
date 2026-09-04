import { supabase } from './supabase';

export async function fetchProfileByApelido(apelido: string) {
  return supabase
    .from('profiles')
    .select('id, apelido, avatar_url, bio, cover_url, banner_url, created_at')
    .eq('apelido', apelido)
    .maybeSingle();
}

export async function updateProfile(userId: string, opts: { apelido: string; bio: string }) {
  return supabase
    .from('profiles')
    .update({ apelido: opts.apelido.trim().replace(/^@/, ''), bio: opts.bio.trim() })
    .eq('id', userId);
}

export async function fetchUserPosts(userId: string) {
  return supabase
    .from('posts')
    .select(
      'id, author_id, title, body, image_url, tag, link_url, created_at, poll_options, poll_votes(option_idx), likes(vote), comments(count), profiles!posts_author_id_fkey(id, apelido, avatar_url), communities(name, slug)'
    )
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
}

export async function countCommentsOnPosts(postIds: string[]) {
  if (!postIds.length) return { count: 0, error: null };
  return supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .in('post_id', postIds);
}

export async function fetchUserKarma(userId: string) {
  return supabase.rpc('karma_of', { p_user: userId });
}

export async function countFollowers(userId: string) {
  return supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId);
}

export async function countFollowing(userId: string) {
  return supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('follower_id', userId);
}

export async function checkIsFollowing(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return { isFollowing: !!data, error };
}

export async function fetchFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id(id, apelido, avatar_url)')
    .eq('following_id', userId);
  const items = (data || []).map((r: any) => r.profiles).filter(Boolean);
  return { data: items, error };
}

export async function fetchFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles:following_id(id, apelido, avatar_url)')
    .eq('follower_id', userId);
  const items = (data || []).map((r: any) => r.profiles).filter(Boolean);
  return { data: items, error };
}

export async function fetchFollowingMap(followerId: string, targetIds: string[]) {
  if (!targetIds.length) return { data: {}, error: null };
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId)
    .in('following_id', targetIds);
  const map: Record<string, boolean> = {};
  (data || []).forEach((r: any) => {
    map[r.following_id] = true;
  });
  return { data: map, error };
}

export async function toggleFollow(followerId: string, followingId: string, isCurrentlyFollowing: boolean) {
  if (isCurrentlyFollowing) {
    return supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  }
  return supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
}

export async function fetchUserActivity(userId: string) {
  const [postsRes, myCommentsRes] = await Promise.all([
    supabase.from('posts').select('id').eq('author_id', userId),
    supabase
      .from('comments')
      .select('body, post_id, author_id, created_at, profiles:author_id(apelido, avatar_url)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  if (postsRes.error || myCommentsRes.error) return { data: [], error: postsRes.error || myCommentsRes.error };

  const postIds = (postsRes.data || []).map((p: any) => p.id);
  const { data: commentsOnMyPosts } = postIds.length
    ? await supabase
        .from('comments')
        .select('body, post_id, author_id, created_at, profiles:author_id(apelido, avatar_url)')
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };

  const items: any[] = [];
  const seen = new Set<string>();
  (commentsOnMyPosts || []).forEach((c: any) => {
    const key = `${c.author_id}-${c.post_id}-${c.created_at}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ type: 'comment', postId: c.post_id, user: c.profiles, body: c.body, created_at: c.created_at, isOwn: c.author_id === userId });
  });
  (myCommentsRes.data || []).forEach((c: any) => {
    const key = `${c.author_id}-${c.post_id}-${c.created_at}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ type: 'comment', postId: c.post_id, user: c.profiles, body: c.body, created_at: c.created_at, isOwn: true });
  });
  items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return { data: items.slice(0, 15), error: null };
}

export async function fetchSavedPosts(userId: string) {
  return supabase
    .from('saves')
    .select(
      'post_id, posts(id, author_id, title, body, image_url, tag, link_url, created_at, poll_options, poll_votes(option_idx), likes(vote), comments(count), profiles!posts_author_id_fkey(id, apelido, avatar_url), communities(name, slug))'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function uploadAvatar(userId: string, file: any) {
  const fileName = `${userId}/avatar_${Date.now()}.webp`;
  let uploadRes = await supabase.storage.from('posts').upload(`avatars/${fileName}`, file, { contentType: 'image/webp', upsert: true });
  let publicUrl = '';
  if (!uploadRes.error) {
    publicUrl = supabase.storage.from('posts').getPublicUrl(`avatars/${fileName}`).data.publicUrl;
  } else {
    const altRes = await supabase.storage.from('avatars').upload(fileName, file, { contentType: 'image/webp', upsert: true });
    if (altRes.error) return { url: null, error: altRes.error };
    publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
  }
  const bustUrl = `${publicUrl}?t=${Date.now()}`;
  const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: bustUrl }).eq('id', userId);
  if (dbErr) return { url: null, error: dbErr };
  return { url: bustUrl, error: null };
}

export async function uploadCover(userId: string, file: any) {
  const fileName = `${userId}/cover_${Date.now()}.webp`;
  const { error: uploadErr } = await supabase.storage.from('covers').upload(fileName, file, { contentType: 'image/webp', upsert: true });
  if (uploadErr) return { url: null, error: uploadErr };
  const publicUrl = supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
  const bustUrl = `${publicUrl}?t=${Date.now()}`;
  let { error: updateErr } = await supabase.from('profiles').update({ cover_url: bustUrl }).eq('id', userId);
  if (updateErr) {
    const res = await supabase.from('profiles').update({ banner_url: bustUrl }).eq('id', userId);
    if (res.error) return { url: null, error: res.error };
  }
  return { url: bustUrl, error: null };
}

export async function updateUserPassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function deleteAccount() {
  return supabase.rpc('delete_account');
}
