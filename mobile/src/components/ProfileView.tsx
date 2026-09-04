import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Share, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth, Profile } from '@/lib/auth';
import { compact, timeAgo } from '@/lib/format';
import {
  fetchProfileByApelido,
  fetchUserPosts,
  fetchFollowers,
  fetchFollowing,
  fetchFollowingMap,
  toggleFollow,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAccount,
  fetchUserActivity,
  fetchSavedPosts,
  checkIsFollowing,
  updateUserPassword,
  countFollowers,
  countFollowing,
  fetchUserKarma,
  countCommentsOnPosts,
} from '@/lib/profile-service';
import PostCard from './PostCard';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';
import { Button, Field, Input, ErrorBox } from './ui';
import Icon from './Icon';
import { colors, radius, shadow } from '@/lib/theme';

function FollowersModal({ userId, type, onClose }: { userId: string; type: 'followers' | 'following'; onClose: () => void }) {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data: items } = type === 'followers' ? await fetchFollowers(userId) : await fetchFollowing(userId);
      setList(items || []);
      if (user && items?.length) {
        const ids = items.map((i: any) => i.id).filter((id: string) => id !== user.id);
        if (ids.length) {
          const { data: map } = await fetchFollowingMap(user.id, ids);
          setFollowingMap(map || {});
        }
      }
      setLoading(false);
    };
    run();
  }, [userId, type, user?.id]);

  async function handleToggle(targetId: string) {
    if (!user) return;
    const isFollowing = !!followingMap[targetId];
    await toggleFollow(user.id, targetId, isFollowing);
    if (isFollowing) {
      const n = { ...followingMap };
      delete n[targetId];
      setFollowingMap(n);
    } else {
      setFollowingMap((m) => ({ ...m, [targetId]: true }));
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{type === 'followers' ? 'Seguidores' : 'Seguindo'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Icon name="x-close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {loading ? <Text style={styles.modalEmpty}>Carregando...</Text> : list.length === 0 ? (
              <Text style={styles.modalEmpty}>{type === 'followers' ? 'Nenhum seguidor ainda.' : 'Não segue ninguém ainda.'}</Text>
            ) : (
              list.map((u) => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userLink}>
                    <Avatar apelido={u.apelido} avatarUrl={u.avatar_url} size={36} />
                    <Text style={styles.userName}>{u.apelido}</Text>
                  </View>
                  {u.id !== user?.id && (
                    <Button variant={followingMap[u.id] ? 'outline' : 'primary'} onPress={() => handleToggle(u.id)}>
                      {followingMap[u.id] ? 'Seguindo' : 'Seguir'}
                    </Button>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function ActivityFeed({ userId }: { userId: string }) {
  const router = useRouter();
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity(userId).then(({ data }) => {
      setActivity(data || []);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <Text style={styles.empty}>Carregando atividade...</Text>;
  if (!activity.length) return <Text style={styles.empty}>Nenhuma atividade recente.</Text>;

  return (
    <View style={{ gap: 8 }}>
      {activity.map((item, i) => (
        <TouchableOpacity key={i} style={styles.activityItem} onPress={() => router.push(`/post/${item.postId}`)}>
          <Avatar apelido={item.user?.apelido} avatarUrl={item.user?.avatar_url} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activityBody}>
              <Text style={{ fontWeight: '600' }}>{item.isOwn ? 'Você' : `@${item.user?.apelido}`}</Text> comentou em um post
            </Text>
            <Text style={styles.activityPreview} numberOfLines={2}>{item.body?.slice(0, 120)}</Text>
            <Text style={styles.activityTime}>{timeAgo(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProfileView({ apelido }: { apelido?: string }) {
  const router = useRouter();
  const { session, user, profile: authProfile, signOut, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [userSaves, setUserSaves] = useState<Record<string, boolean>>({});
  const [following, setFollowing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, likes: 0, comments: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [modal, setModal] = useState<'followers' | 'following' | null>(null);
  const [toast, setToast] = useState('');
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setTab('posts');

    const loadForUser = async (p: Profile) => {
      setProfile(p);
      const postsR = await fetchUserPosts(p.id);
      const postIds = postsR.data?.map((x: any) => x.id) || [];
      const [followersR, followingR, karmaR, commentsCount] = await Promise.all([
        countFollowers(p.id),
        countFollowing(p.id),
        fetchUserKarma(p.id),
        postIds.length ? countCommentsOnPosts(postIds) : Promise.resolve({ count: 0 }),
      ]);
      setPosts(postsR.data || []);
      setStats({
        posts: postsR.data?.length || 0,
        likes: karmaR.data ?? 0,
        comments: commentsCount.count || 0,
        followers: followersR.count || 0,
        following: followingR.count || 0,
      });
      if (postIds.length) {
        const [likesRes, savesRes] = await Promise.all([
          supabase.from('likes').select('post_id, vote').in('post_id', postIds).eq('user_id', user!.id),
          supabase.from('saves').select('post_id').in('post_id', postIds).eq('user_id', user!.id),
        ]);
        const votesMap: Record<string, number> = {};
        (likesRes.data || []).forEach((r: any) => (votesMap[r.post_id] = r.vote));
        const savesMap: Record<string, boolean> = {};
        (savesRes.data || []).forEach((r: any) => (savesMap[r.post_id] = true));
        setUserVotes(votesMap);
        setUserSaves(savesMap);
      }
      setLoading(false);
    };

    if (!apelido && authProfile) {
      setFollowing(false);
      loadForUser(authProfile);
      return;
    }

    if (!apelido) return;

    fetchProfileByApelido(apelido).then(async ({ data }) => {
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(data as Profile);
      const postsR = await fetchUserPosts(data.id);
      const postIds = postsR.data?.map((x: any) => x.id) || [];
      const [followR, followersR, followingR, karmaR, commentsCount] = await Promise.all([
        checkIsFollowing(user!.id, data.id),
        countFollowers(data.id),
        countFollowing(data.id),
        fetchUserKarma(data.id),
        postIds.length ? countCommentsOnPosts(postIds) : Promise.resolve({ count: 0 }),
      ]);
      setPosts(postsR.data || []);
      setFollowing(!!followR.isFollowing);
      setStats({
        posts: postsR.data?.length || 0,
        likes: karmaR.data ?? 0,
        comments: commentsCount.count || 0,
        followers: followersR.count || 0,
        following: followingR.count || 0,
      });
      if (postIds.length) {
        const [likesRes, savesRes] = await Promise.all([
          supabase.from('likes').select('post_id, vote').in('post_id', postIds).eq('user_id', user!.id),
          supabase.from('saves').select('post_id').in('post_id', postIds).eq('user_id', user!.id),
        ]);
        const votesMap: Record<string, number> = {};
        (likesRes.data || []).forEach((r: any) => (votesMap[r.post_id] = r.vote));
        const savesMap: Record<string, boolean> = {};
        (savesRes.data || []).forEach((r: any) => (savesMap[r.post_id] = true));
        setUserVotes(votesMap);
        setUserSaves(savesMap);
      }
      setLoading(false);
    });
  }, [apelido, user?.id, authProfile?.id]);

  useEffect(() => {
    if (tab !== 'saves' || !profile) return;
    fetchSavedPosts(profile.id).then(async ({ data }) => {
      const posts = (data || []).flatMap((d: any) => d.posts || []);
      setSavedPosts(posts);
      const postIds = posts.map((x: any) => x.id);
      if (postIds.length) {
        const [likesRes, savesRes] = await Promise.all([
          supabase.from('likes').select('post_id, vote').in('post_id', postIds).eq('user_id', user!.id),
          supabase.from('saves').select('post_id').in('post_id', postIds).eq('user_id', user!.id),
        ]);
        const votesMap: Record<string, number> = {};
        (likesRes.data || []).forEach((r: any) => (votesMap[r.post_id] = r.vote));
        const savesMap: Record<string, boolean> = {};
        (savesRes.data || []).forEach((r: any) => (savesMap[r.post_id] = true));
        setUserVotes(votesMap);
        setUserSaves(savesMap);
      }
    });
  }, [tab, profile?.id, user?.id]);

  async function handleToggleFollow() {
    if (!profile || !user) return;
    const { error } = await toggleFollow(user.id, profile.id, following);
    if (error) { showToast('Erro ao seguir usuário. Tente novamente.'); return; }
    setFollowing((f) => {
      setStats((s) => ({ ...s, followers: f ? s.followers - 1 : s.followers + 1 }));
      return !f;
    });
  }

  function handleShare() {
    const url = `https://lilas-two.vercel.app/u/${profile?.apelido}`;
    if (Platform.OS === 'web') navigator.clipboard?.writeText(url).then(() => showToast('Link copiado!'));
    else Share.share({ message: url }).catch(() => {});
  }

  async function pickAndUpload(kind: 'avatar' | 'cover') {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: kind === 'avatar' ? [1, 1] : [16, 9],
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const file = { uri: asset.uri, name: asset.fileName || `${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' };
    showToast('Enviando foto...');
    const { url, error } = kind === 'avatar' ? await uploadAvatar(profile!.id, file) : await uploadCover(profile!.id, file);
    if (error) { showToast('Erro ao atualizar foto.'); return; }
    setProfile((p) => (p ? { ...p, avatar_url: kind === 'avatar' ? url : p.avatar_url, cover_url: kind === 'cover' ? url : p.cover_url, banner_url: kind === 'cover' ? url : p.banner_url } : p));
    await refreshProfile();
    showToast('Foto atualizada!');
  }

  async function doDeleteAccount() {
    const { error } = await deleteAccount();
    setConfirmDeleteAccount(false);
    if (!error) {
      await signOut();
      router.replace('/login');
    } else {
      showToast('Erro ao excluir conta.');
    }
  }

  if (loading || (!notFound && !profile)) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.muted }}>Carregando...</Text></View>;
  }
  if (notFound) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.muted }}>Usuário não encontrado.</Text></View>;
  if (!profile) return null;

  const isMe = profile.id === user?.id;
  const initial = (profile.apelido || '?')[0].toUpperCase();
  const memberYear = profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();
  const memberMonth = profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long' }) : '';

  const coverUrl = profile.cover_url || profile.banner_url;

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.cover}>
        {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.coverImg} contentFit="cover" /> : null}
        {isMe && (
          <TouchableOpacity style={styles.coverBtn} onPress={() => pickAndUpload('cover')}>
            <Icon name="camera" size={15} color="#fff" />
            <Text style={styles.coverBtnText}>Trocar capa</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileWrap}>
        <View style={styles.avatarWrap}>
          <Avatar apelido={profile.apelido} avatarUrl={profile.avatar_url} size={80} style={styles.avatar} />
          {isMe && (
            <TouchableOpacity style={styles.avatarBtn} onPress={() => pickAndUpload('avatar')}>
              <Icon name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.name}>{profile.apelido}</Text>
        <Text style={styles.handle}>@{profile.apelido}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <Text style={styles.member}>Membro desde {memberMonth} {memberYear}</Text>

        <View style={styles.actionsRow}>
          {isMe ? (
            <Button variant="outline" onPress={() => setEditOpen(true)}>Editar perfil</Button>
          ) : (
            <Button variant={following ? 'outline' : 'primary'} onPress={handleToggleFollow}>
              {following ? 'Seguindo' : 'Seguir'}
            </Button>
          )}
          <Button variant="ghost" onPress={handleShare}>
            <Icon name="share" size={16} color={colors.primaryDark} />
          </Button>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statNum}>{compact(stats.posts)}</Text><Text style={styles.statLabel}>Posts</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{compact(stats.likes)}</Text><Text style={styles.statLabel}>Karma</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{compact(stats.comments)}</Text><Text style={styles.statLabel}>Comentários</Text></View>
        <TouchableOpacity style={styles.statBtn} onPress={() => setModal('followers')}><Text style={styles.statNum}>{compact(stats.followers)}</Text><Text style={styles.statLabel}>Seguidores</Text></TouchableOpacity>
        <TouchableOpacity style={styles.statBtn} onPress={() => setModal('following')}><Text style={styles.statNum}>{compact(stats.following)}</Text><Text style={styles.statLabel}>Seguindo</Text></TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[{ key: 'posts', label: 'Posts' }, { key: 'activity', label: 'Atividade' }, ...(isMe ? [{ key: 'saves', label: 'Salvos' }] : [])].map((t) => (
          <TouchableOpacity key={t.key} style={[styles.statTab, tab === t.key && styles.statTabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.statTabText, tab === t.key && styles.statTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: 12 }}>
        {tab === 'posts' && (
          posts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ color: colors.muted }}>Nenhuma publicação ainda.</Text>
              {isMe && <Button onPress={() => router.push('/criar')} style={{ marginTop: 12 }}>Criar primeiro post</Button>}
            </View>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onDeleted={() => setPosts((ps) => ps.filter((x) => x.id !== p.id))} userVote={userVotes[p.id]} userSaved={userSaves[p.id]} />)
          )
        )}
        {tab === 'activity' && profile && <ActivityFeed userId={profile.id} />}
        {tab === 'saves' && (
          savedPosts.length === 0 ? (
            <View style={styles.emptyCard}><Text style={{ color: colors.muted }}>Nenhum post salvo.</Text></View>
          ) : (
            savedPosts.map((p) => <PostCard key={p.id} post={p} onDeleted={() => setSavedPosts((ps) => ps.filter((x) => x.id !== p.id))} userVote={userVotes[p.id]} userSaved={userSaves[p.id]} />)
          )
        )}
      </View>

      {editOpen && profile && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={(a: string, b: string) => {
            setProfile((p) => (p ? { ...p, apelido: a, bio: b } : p));
            refreshProfile();
          }}
          onSignOut={async () => { setEditOpen(false); await signOut(); router.replace('/login'); }}
          onDeleteAccount={() => setConfirmDeleteAccount(true)}
        />
      )}
      {modal && profile && <FollowersModal userId={profile.id} type={modal} onClose={() => setModal(null)} />}
      {confirmDeleteAccount && (
        <ConfirmModal
          title="Excluir conta?"
          message="Sua conta, posts, curtidas e seguidores serão excluídos permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Excluir conta"
          danger
          onConfirm={doDeleteAccount}
          onClose={() => setConfirmDeleteAccount(false)}
        />
      )}
      {toast ? <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View> : null}
    </ScrollView>
  );
}

function EditModal({ profile, onClose, onSave, onSignOut, onDeleteAccount }: any) {
  const [apelido, setApelido] = useState(profile.apelido || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  async function handleSave() {
    setMsg('');
    if (!apelido.trim()) { setMsg('Escolha um apelido.'); return; }
    const { error } = await updateProfile(profile.id, { apelido, bio });
    if (error) { setMsg(error.message); return; }
    onSave(apelido.trim().replace(/^@/, ''), bio.trim());
    setMsg('Perfil atualizado.');
  }

  async function handleChangePw() {
    setPwMsg('');
    if (!pw1 || pw1.length < 6) { setPwMsg('A senha deve ter ao menos 6 caracteres.'); return; }
    if (pw1 !== pw2) { setPwMsg('As senhas não conferem.'); return; }
    const { error } = await updateUserPassword(pw1);
    if (error) { setPwMsg(error.message); return; }
    setPwMsg('Senha atualizada.');
    setPw1(''); setPw2('');
  }

  const isProfile = tab === 'profile';

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay2} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.editSheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Icon name="x-close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.editTabs}>
            <TouchableOpacity style={[styles.editTab, isProfile && styles.editTabActive]} onPress={() => setTab('profile')}>
              <Text style={[styles.editTabText, isProfile && styles.editTabTextActive]}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editTab, !isProfile && styles.editTabActive]} onPress={() => setTab('security')}>
              <Text style={[styles.editTabText, !isProfile && styles.editTabTextActive]}>Conta & Segurança</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {isProfile ? (
              <>
                <Field label="Apelido">
                  <Input value={apelido} onChangeText={setApelido} placeholder="nome_fantasia" />
                </Field>
                <Field label="Bio">
                  <Input value={bio} onChangeText={setBio} placeholder="Conte um pouco sobre você..." multiline numberOfLines={3} />
                </Field>
                <ErrorBox msg={msg.includes('atualizado') ? undefined : msg} />
                {msg.includes('atualizado') ? <View style={styles.ok}><Text style={styles.okText}>{msg}</Text></View> : null}
                <Button onPress={handleSave}>Salvar perfil</Button>
              </>
            ) : (
              <>
                <Text style={styles.editSectionTitle}>Alterar senha</Text>
                <Field label="Nova senha">
                  <Input value={pw1} onChangeText={setPw1} placeholder="Mínimo 6 caracteres" secureTextEntry />
                </Field>
                <Field label="Repetir senha">
                  <Input value={pw2} onChangeText={setPw2} placeholder="Confirme a senha" secureTextEntry />
                </Field>
                {pwMsg ? <ErrorBox msg={!pwMsg.includes('atualizada') ? pwMsg : undefined} /> : null}
                {pwMsg.includes('atualizada') ? <View style={styles.ok}><Text style={styles.okText}>{pwMsg}</Text></View> : null}
                <Button onPress={handleChangePw}>Salvar nova senha</Button>
                <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 8 }}>
                  <Button variant="outline" onPress={onSignOut}>Sair da conta</Button>
                  <Button variant="danger" onPress={onDeleteAccount}>Excluir conta definitivamente</Button>
                </View>
              </>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  cover: { height: 140, backgroundColor: colors.primary, justifyContent: 'flex-end' },
  coverImg: { ...StyleSheet.absoluteFill as any },
  coverBtn: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12,
    zIndex: 10,
  },
  coverBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  profileWrap: { alignItems: 'center', marginTop: -36, paddingHorizontal: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { borderWidth: 3, borderColor: '#fff', ...shadow },
  avatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 8 },
  handle: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  bio: { fontSize: 13, color: colors.text, marginTop: 6, textAlign: 'center' },
  member: { fontSize: 11, color: colors.muted2, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  stats: {
    flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius, paddingVertical: 12, marginTop: 16, marginHorizontal: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statBtn: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 15, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 10, fontWeight: '500', color: colors.muted },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 16 },
  statTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  statTabActive: { borderBottomColor: colors.primary },
  statTabText: { fontSize: 13, fontWeight: '500', color: colors.muted },
  statTabTextActive: { color: colors.primary, fontWeight: '700' },
  emptyCard: { backgroundColor: colors.card, borderRadius: radius, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  empty: { color: colors.muted, textAlign: 'center', padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalOverlay2: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%', padding: 16, width: '100%' },
  editSheet: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%', padding: 16, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  modalEmpty: { textAlign: 'center', padding: 24, color: colors.muted, fontSize: 13 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  userLink: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.text },
  activityItem: { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius, padding: 12 },
  activityBody: { fontSize: 13, lineHeight: 18, color: colors.text },
  activityPreview: { color: colors.muted, fontSize: 12, marginTop: 4 },
  activityTime: { fontSize: 11, color: colors.muted2, marginTop: 4 },
  editTabs: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  editTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  editTabActive: { backgroundColor: colors.primarySoft },
  editTabText: { fontSize: 13, fontWeight: '500', color: colors.muted },
  editTabTextActive: { color: colors.primaryDark, fontWeight: '700' },
  editSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, color: colors.text },
  ok: { backgroundColor: '#eefbf3', padding: 8, borderRadius: 8, marginBottom: 14 },
  okText: { color: '#1a7f46', fontSize: 12 },
  toast: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: colors.text, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
