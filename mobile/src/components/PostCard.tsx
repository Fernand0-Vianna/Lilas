import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity, Linking, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { compact, timeAgo, domHost } from '@/lib/format';
import { Post, postScore, postCommentCount } from '@/lib/types';
import Icon from './Icon';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';
import { Button } from './ui';
import { colors, radius, shadow } from '@/lib/theme';

const blurredStyle = { filter: 'blur(10px)', opacity: 0.2 } as const;

function Poll({ post }: { post: Post }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<number[]>([]);
  const [mine, setMine] = useState(-1);

  useEffect(() => {
    const rows = post.poll_votes || [];
    const c = (post.poll_options || []).map((_, i) => rows.filter((r) => r.option_idx === i).length);
    setCounts(c);
  }, [post.id]);

  useEffect(() => {
    if (!post.poll_options || !user) return;
    supabase
      .from('poll_votes')
      .select('option_idx')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setMine(data?.option_idx ?? -1));
  }, [post.id, user?.id]);

  async function vote(i: number) {
    if (mine === i) return;
    const prevMine = mine;
    setMine(i);
    setCounts((c) => c.map((x, j) => (j === i ? x + 1 : prevMine !== -1 && j === prevMine ? x - 1 : x)));
    const { error } = await supabase.from('poll_votes').upsert({ post_id: post.id, user_id: user!.id, option_idx: i });
    if (error) {
      setMine(prevMine);
      setCounts((c) => c.map((x, j) => (j === i ? x - 1 : prevMine !== -1 && j === prevMine ? x + 1 : x)));
    }
  }

  const total = counts.reduce((s, n) => s + n, 0);
  return (
    <View style={{ marginTop: 8 }}>
      {(post.poll_options || []).map((opt, i) => {
        const pct = total ? Math.round((counts[i] || 0) / total * 100) : 0;
        return (
          <Pressable
            key={i}
            onPress={() => vote(i)}
            style={[styles.pollOpt, mine === i && { borderColor: colors.primary }]}
          >
            {total > 0 && (
              <View style={[styles.pollFill, { width: `${pct}%` }]} />
            )}
            <Text style={styles.pollLabel} numberOfLines={2}>{opt}</Text>
            <Text style={styles.pollPct}>{total ? `${pct}%` : ''}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.commHint}>{compact(total)} voto{total === 1 ? '' : 's'}</Text>
    </View>
  );
}

type Props = {
  post: Post;
  onDeleted?: () => void;
  canModerate?: boolean;
  userVote?: number;
  userSaved?: boolean;
};

export default function PostCard({ post, onDeleted, canModerate, userVote, userSaved }: Props) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [vote, setVote] = useState<number>(userVote ?? 0);
  const [score, setScore] = useState(0);
  const [comments, setComments] = useState(0);
  const [saved, setSaved] = useState(userSaved ?? false);
  const [revealed, setRevealed] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [reported, setReported] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ title: '', body: '' });
  const [edited, setEdited] = useState<any>(null);

  useEffect(() => {
    setScore(postScore(post));
    setComments(postCommentCount(post));
    setVote(userVote ?? 0);
    setSaved(userSaved ?? false);

    if ((userVote === undefined || userSaved === undefined) && user) {
      const queries: Array<PromiseLike<any>> = [];
      if (userVote === undefined)
        queries.push(supabase.from('likes').select('vote').eq('post_id', post.id).eq('user_id', user.id).maybeSingle().then((r) => ({ type: 'vote', data: r.data?.vote ?? 0 })));
      if (userSaved === undefined)
        queries.push(supabase.from('saves').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle().then((r) => ({ type: 'save', data: !!r.data })));
      Promise.all(queries).then((results) => {
        results.forEach(({ type, data }) => {
          if (type === 'vote') setVote(data);
          if (type === 'save') setSaved(data);
        });
      });
    }
  }, [post.id, userVote, userSaved, user?.id]);

  async function castVote(v: number) {
    if (!user) return;
    if (vote === v) v = 0;
    const prev = vote;
    setVote(v);
    const { data } = await supabase.rpc('vote_post', { p_post_id: post.id, p_vote: v });
    if (data != null) setScore(data as number);
    else setVote(prev);
  }

  async function toggleSave() {
    if (!user) return;
    const prev = saved;
    setSaved(!saved);
    const { error } = prev
      ? await supabase.from('saves').delete().eq('post_id', post.id).eq('user_id', user.id)
      : await supabase.from('saves').insert({ post_id: post.id, user_id: user.id });
    if (error) setSaved(prev);
  }

  async function sendReport() {
    if (!user) return;
    const { error } = await supabase.from('reports').insert({ post_id: post.id, reporter_id: user.id, reason: reason.trim() });
    if (!error) {
      setReported(true);
      setReporting(false);
      setReason('');
    }
  }

  async function doDeletePost() {
    await supabase.from('posts').delete().eq('id', post.id);
    setConfirmDelete(false);
    if (onDeleted) onDeleted();
    else router.replace('/');
  }

  const host = post.link_url ? domHost(post.link_url) : '';
  const canDelete = profile?.is_admin || post.author_id === user?.id || !!canModerate;
  const isModRemoval = !!canModerate && post.author_id !== user?.id;
  const canEditPost = !!user && post.author_id === user.id && Date.now() - new Date(post.created_at).getTime() < 24 * 3600 * 1000;
  const view = { ...post, ...edited };

  async function saveEdit() {
    if (!edit.title.trim()) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('posts')
      .update({ title: edit.title.trim(), body: edit.body.trim() || null, edited_at: now })
      .eq('id', post.id);
    if (error) return;
    setEdited({ title: edit.title.trim(), body: edit.body.trim() || null, edited_at: now });
    setEditing(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Votação */}
        <View style={styles.voteCol}>
          <Pressable style={[styles.voteBtn, vote === 1 && styles.voteUpOn]} onPress={() => castVote(1)} hitSlop={6}>
            <Icon name="up" size={14} color={vote === 1 ? colors.up : colors.muted2} filled={vote === 1} />
          </Pressable>
          <Text style={[styles.score, vote === 1 ? { color: colors.up } : vote === -1 ? { color: colors.down } : null]}>
            {compact(score)}
          </Text>
          <Pressable style={[styles.voteBtn, vote === -1 && styles.voteDownOn]} onPress={() => castVote(-1)} hitSlop={6}>
            <Icon name="down" size={14} color={vote === -1 ? colors.down : colors.muted2} filled={vote === -1} />
          </Pressable>
        </View>

        <View style={styles.main}>
          <View style={styles.head}>
            <Pressable onPress={() => router.push(`/u/${post.profiles?.apelido}`)} style={styles.authorRow}>
              <Avatar apelido={post.profiles?.apelido} avatarUrl={post.profiles?.avatar_url} size={22} />
              <Text style={styles.authorName}>@{post.profiles?.apelido}</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/c/${post.communities?.slug}`)}>
              <Text style={styles.commBadge}>{post.communities?.name}</Text>
            </Pressable>
            <Text style={styles.time}> · {timeAgo(post.created_at)}</Text>
            {post.edited_at && <Text style={styles.editedMark}> · editado</Text>}
            {canEditPost && !editing && (
              <TouchableOpacity style={styles.more} onPress={() => { setEdit({ title: post.title, body: post.body || '' }); setEditing(true); }} hitSlop={6}>
                <Icon name="pen" size={16} color={colors.muted2} />
              </TouchableOpacity>
            )}
            {canDelete && !editing && (
              <TouchableOpacity style={styles.more} onPress={() => setConfirmDelete(true)} hitSlop={6}>
                <Icon name="more" size={16} color={colors.muted2} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bodySlot}>
            {editing ? (
              <View style={styles.editPost}>
                <TextInput style={styles.editInput} value={edit.title} onChangeText={(t) => setEdit({ ...edit, title: t })} placeholder="Título" placeholderTextColor={colors.muted2} />
                <TextInput style={[styles.editInput, styles.editBodyInput]} value={edit.body} onChangeText={(t) => setEdit({ ...edit, body: t })} placeholder="Texto (opcional)" placeholderTextColor={colors.muted2} multiline />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Button onPress={saveEdit}>Salvar</Button>
                  <Button variant="outline" onPress={() => setEditing(false)}>Cancelar</Button>
                </View>
              </View>
            ) : (
            <>
            {post.is_sensitive && !revealed && (
              <Pressable style={styles.revealOverlay} onPress={() => setRevealed(true)}>
                <Icon name="eye" size={18} color={colors.muted} />
                <Text style={styles.revealText}>Conteúdo sensível — tocar para revelar</Text>
              </Pressable>
            )}
            <View style={post.is_sensitive && !revealed ? styles.blurred : undefined} pointerEvents={post.is_sensitive && !revealed ? 'none' : 'auto'}>
            {host ? (
              <>
                <Text style={styles.title}>{view.title}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(post.link_url!)} style={styles.linkCard}>
                  <View style={styles.linkText}>
                    <Text style={styles.linkHost}>{host}</Text>
                    <Text style={styles.linkUrl} numberOfLines={1}>{view.link_url}</Text>
                  </View>
                </TouchableOpacity>
                {view.body ? <Text style={styles.body}>{view.body}</Text> : null}
              </>
            ) : (
              <Pressable onPress={() => router.push(`/post/${post.id}`)}>
                <Text style={styles.title}>
                  {post.tag ? <Text style={styles.tagChip} onPress={() => router.push(`/?q=${encodeURIComponent(post.tag as string)}`)}>{post.tag} </Text> : null}
                  {view.title}
                </Text>
                {view.body ? <Text style={styles.body} numberOfLines={3}>{view.body}</Text> : null}
                {post.image_url && (
                  <Image source={{ uri: post.image_url }} style={styles.postImg} contentFit="cover" transition={150} />
                )}
                {post.poll_options && <Poll post={post} />}
              </Pressable>
            )}
            </View>
            </>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => router.push(`/post/${post.id}`)}>
              <Icon name="comment" size={14} color={colors.muted} />
              <Text style={styles.actionText}>{compact(comments)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={toggleSave}>
              <Icon name="bookmark" size={14} color={saved ? colors.accent : colors.muted} filled={saved} />
            </TouchableOpacity>
            <View style={styles.reportWrap}>
              <TouchableOpacity style={styles.action} onPress={() => setReporting((o) => !o)}>
                <Icon name="flag" size={14} color={colors.muted} />
              </TouchableOpacity>
              {reporting && !reported && (
                <View style={styles.reportPop}>
                  <TextInput
                    placeholder="Motivo da denúncia..."
                    placeholderTextColor={colors.muted2}
                    value={reason}
                    onChangeText={setReason}
                    style={styles.inputSmall}
                  />
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                    <TouchableOpacity style={[styles.btnSmall, styles.btnPrimary]} onPress={sendReport}>
                      <Text style={styles.btnTextLight}>Enviar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnSmall, styles.btnOutline]} onPress={() => setReporting(false)}>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {reported && <Text style={styles.reportOk}>Denúncia enviada.</Text>}
            </View>
          </View>
        </View>
      </View>

      {confirmDelete && (
        <ConfirmModal
          title={isModRemoval ? 'Remover publicação?' : 'Excluir publicação?'}
          message={isModRemoval ? 'Tem certeza que deseja remover esta publicação como moderação?' : 'Tem certeza que deseja excluir esta publicação?'}
          confirmLabel={isModRemoval ? 'Remover' : 'Excluir'}
          danger
          onConfirm={doDeletePost}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, marginBottom: 12, ...shadow },
  row: { flexDirection: 'row' },
  voteCol: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, width: 36 },
  voteBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  voteUpOn: { backgroundColor: colors.primarySoft },
  voteDownOn: { backgroundColor: '#e7effe' },
  score: { fontSize: 11, fontWeight: '700', color: colors.muted, lineHeight: 16 },
  main: { flex: 1, minWidth: 0, padding: 10, paddingTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 12, fontWeight: '600', color: colors.text },
  commBadge: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
    overflow: 'hidden',
  },
  time: { fontSize: 11, color: colors.muted2 },
  more: { marginLeft: 'auto', padding: 2 },
  title: { fontSize: 14, fontWeight: '500', marginBottom: 4, lineHeight: 19, color: colors.text },
  tagChip: { backgroundColor: colors.primarySoft, color: colors.primaryDark, borderRadius: 999, paddingHorizontal: 8, fontSize: 10, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  postImg: { width: '100%', borderRadius: 8, height: 220, marginBottom: 8, backgroundColor: colors.bg },
  bodySlot: { position: 'relative' },
  editedMark: { fontSize: 11, color: colors.muted },
  editPost: { gap: 8 },
  editInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.bg,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.text,
  },
  editBodyInput: { minHeight: 70, textAlignVertical: 'top' },
  blurred: blurredStyle as any,
  revealOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.muted, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.bg,
  },
  revealText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  linkCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, marginBottom: 8 },
  linkText: { flex: 1 },
  linkHost: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  linkUrl: { fontSize: 12, color: colors.text },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 6, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 5, gap: 4, borderRadius: 6 },
  actionText: { fontSize: 11, color: colors.muted, fontWeight: '500' },
  reportWrap: { position: 'relative', marginLeft: 'auto' },
  reportPop: {
    position: 'absolute',
    right: 0,
    bottom: 32,
    zIndex: 50,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    width: 220,
    ...shadow,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.card,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.card,
  },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnTextLight: { color: '#fff', fontSize: 12, fontWeight: '600' },
  reportOk: { fontSize: 11, color: colors.accent, marginLeft: 6 },
  pollOpt: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, marginBottom: 6, overflow: 'hidden' },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primarySoft },
  pollLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.text },
  pollPct: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  commHint: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
