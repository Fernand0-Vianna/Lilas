import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { compact } from '@/lib/format';
import PostCard from '@/components/PostCard';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ConfirmModal from '@/components/ConfirmModal';
import { Button } from '@/components/ui';
import { colors, radius } from '@/lib/theme';

function CommentVote({ comment }: any) {
  const { user } = useAuth();
  const [vote, setVote] = useState(comment.vote ?? 0);
  const [score, setScore] = useState(comment.comment_votes?.[0]?.vote ?? 0);
  if (!user) return null;

  async function cast(v: number) {
    if (vote === v) v = 0;
    const prev = vote;
    setVote(v);
    const { data } = await supabase.rpc('vote_comment' as any, { p_comment_id: comment.id, p_vote: v });
    if (data != null) setScore(data as number);
    else setVote(prev);
  }

  return (
    <View style={styles.voteCol}>
      <TouchableOpacity onPress={() => cast(1)} hitSlop={6}>
        <Icon name="up" size={13} color={vote === 1 ? colors.up : colors.muted2} filled={vote === 1} />
      </TouchableOpacity>
      <Text style={styles.voteScore}>{compact(score)}</Text>
      <TouchableOpacity onPress={() => cast(-1)} hitSlop={6}>
        <Icon name="down" size={13} color={vote === -1 ? colors.down : colors.muted2} filled={vote === -1} />
      </TouchableOpacity>
    </View>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, profile } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [isMod, setIsMod] = useState(false);
  const [userVote, setUserVote] = useState<number | undefined>(undefined);
  const [userSaved, setUserSaved] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [reportComment, setReportComment] = useState<any>(null);
  const [reportReason, setReportReason] = useState('');
  const [sortMode, setSortMode] = useState('melhor');

  useEffect(() => {
    Promise.all([
      supabase
        .from('posts')
        .select('*, profiles!posts_author_id_fkey(apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx)')
        .eq('id', id)
        .single(),
      supabase.from('comments')
        .select('*, profiles(apelido, avatar_url), comment_votes(vote)')
        .eq('post_id', id)
        .order('created_at'),
    ]).then(async ([p, c]) => {
      const data = p.data;
      if (data) {
        setPost(data);
        supabase.rpc('is_mod_of' as any, { p_community: data.community_id }).then(({ data: mod }) => setIsMod(!!mod));
        if (session?.user?.id) {
          const [likesRes, savesRes] = await Promise.all([
            supabase.from('likes').select('vote').eq('post_id', data.id).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('saves').select('post_id').eq('post_id', data.id).eq('user_id', session.user.id).maybeSingle(),
          ]);
          setUserVote(likesRes.data?.vote ?? 0);
          setUserSaved(!!savesRes.data);
        }
      }
      const list = (c.data || []).map((x: any) => ({ ...x, vote: 0 }));
      if (session && list.length) {
        const my = await supabase.from('comment_votes').select('comment_id, vote').in('comment_id', list.map((x: any) => x.id)).eq('user_id', session.user.id);
        const map = Object.fromEntries((my.data || []).map((m: any) => [m.comment_id, m.vote]));
        list.forEach((x: any) => { x.vote = map[x.id] || 0; });
      }
      setComments(list);
      setLoading(false);
    });
  }, [id, session?.user?.id]);

  async function addComment() {
    if (!body.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, author_id: session!.user.id, body: body.trim() })
      .select('*, profiles(apelido, avatar_url)')
      .single();
    if (error) return;
    setComments((c) => [...c, data]);
    setBody('');
  }

  async function sendReply() {
    if (!replyBody.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, author_id: session!.user.id, body: replyBody.trim(), parent_id: replyTo })
      .select('*, profiles(apelido, avatar_url)')
      .single();
    if (error) return;
    setComments((c) => [...c, data]);
    setReplyBody('');
    setReplyTo(null);
  }

  function doDeleteComment() {
    const commentId = confirmDeleteId!;
    supabase.from('comments').delete().eq('id', commentId).then(() => {
      setComments((cs) => cs.filter((x) => x.id !== commentId));
      setConfirmDeleteId(null);
    });
  }

  async function saveEdit() {
    if (!editBody.trim()) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from('comments').update({ body: editBody.trim(), edited_at: now }).eq('id', editingId);
    if (error) return;
    setComments((cs) => cs.map((x) => (x.id === editingId ? { ...x, body: editBody.trim(), edited_at: now } : x)));
    setEditingId(null);
    setEditBody('');
  }

  async function sendReportComment() {
    if (!reportComment) return;
    const { error } = await supabase.from('reports').insert({ comment_id: reportComment.id, reporter_id: session!.user.id, reason: reportReason.trim() });
    if (!error) setReportComment(null);
    setReportReason('');
  }

  const rows = useMemo(() => {
    const score = (c: any) => (c.comment_votes || []).reduce((a: number, v: any) => a + (v.vote || 0), 0);
    const list = [...comments];
    if (sortMode === 'novo') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else list.sort((a, b) => score(b) - score(a) || +new Date(a.created_at) - +new Date(b.created_at));
    const byParent: Record<string, any[]> = {};
    list.forEach((c) => { (byParent[c.parent_id || 'root'] = byParent[c.parent_id || 'root'] || []).push(c); });
    const out: { c: any; depth: number }[] = [];
    const walk = (pid: string, depth: number) => (byParent[pid] || []).forEach((c) => { out.push({ c, depth }); walk(c.id, depth + 1); });
    walk('root', 0);
    return out;
  }, [comments, sortMode]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!post) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.muted }}>Post não encontrado.</Text></View>;
  }

  const replyForm = (onSend: () => void, value: string, setValue: (s: string) => void, onClose?: () => void) => (
    <View style={styles.compose}>
      <TextInput
        placeholder="Compartilhe apoio..."
        placeholderTextColor={colors.muted2}
        style={styles.composeInput}
        value={value}
        onChangeText={setValue}
        multiline
        autoFocus
      />
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
        <Button onPress={onSend}>Responder</Button>
        {onClose && <Button variant="outline" onPress={onClose}>Cancelar</Button>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ title: 'Publicação', headerShown: true }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 40 }}>
          <PostCard post={post} canModerate={isMod} onDeleted={() => router.replace('/')} userVote={userVote} userSaved={userSaved} />

          <View style={styles.commentsCard}>
            <Text style={styles.commentsTitle}>Comentários</Text>
            <View style={styles.sortTabs}>
              {(['melhor', 'topo', 'novo'] as const).map((k) => (
                <Pressable key={k} style={[styles.sortTab, sortMode === k && styles.sortTabActive]} onPress={() => setSortMode(k)}>
                  <Text style={[styles.sortTabText, sortMode === k && styles.sortTabTextActive]}>{k === 'melhor' ? 'Melhor' : k === 'topo' ? 'Topo' : 'Novo'}</Text>
                </Pressable>
              ))}
            </View>
            {session && replyForm(addComment, body, setBody)}

            {rows.length === 0 ? (
              <Text style={styles.noComments}>Nenhum comentário ainda.</Text>
            ) : (
              rows.map(({ c, depth }) => (
                <View key={c.id} style={[styles.commentRow, depth > 0 && { marginLeft: Math.min(depth, 3) * 14 }]}>
                  <CommentVote comment={c} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.cMetaRow}>
                      <TouchableOpacity onPress={() => c.profiles?.apelido && router.push(`/u/${c.profiles.apelido}`)}>
                        <Avatar apelido={c.profiles?.apelido} avatarUrl={c.profiles?.avatar_url} size={20} />
                      </TouchableOpacity>
                      <Text style={styles.cMeta}>u/{c.profiles?.apelido}</Text>
                    </View>
                    {editingId === c.id ? (
                      <View style={styles.compose}>
                        <TextInput style={styles.composeInput} value={editBody} onChangeText={setEditBody} multiline autoFocus />
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                          <Button onPress={saveEdit}>Salvar</Button>
                          <Button variant="outline" onPress={() => setEditingId(null)}>Cancelar</Button>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.cBody}>{c.body}{c.edited_at ? <Text style={styles.editedMark}> · editado</Text> : null}</Text>
                    )}
                    {editingId !== c.id && (
                      <View style={{ flexDirection: 'row', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                        {session && (
                          <TouchableOpacity style={styles.cAction} onPress={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody(''); }}>
                            <Icon name="comment" size={11} color={colors.muted} />
                            <Text style={styles.cActionText}>Responder</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cAction} onPress={() => setReportComment(c)}>
                          <Icon name="flag" size={11} color={colors.muted} />
                          <Text style={styles.cActionText}>Denunciar</Text>
                        </TouchableOpacity>
                        {c.author_id === session?.user.id && editingId !== c.id && (
                          <TouchableOpacity style={styles.cAction} onPress={() => { setEditingId(c.id); setEditBody(c.body); }}>
                            <Icon name="pen" size={11} color={colors.muted} />
                            <Text style={styles.cActionText}>Editar</Text>
                          </TouchableOpacity>
                        )}
                        {(isMod || profile?.is_admin || c.author_id === session?.user.id) && editingId !== c.id && (
                          <TouchableOpacity style={styles.cAction} onPress={() => setConfirmDeleteId(c.id)}>
                            <Icon name="x-close" size={11} color={colors.danger} />
                            <Text style={[styles.cActionText, { color: colors.danger }]}>Excluir</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {replyTo === c.id && replyForm(sendReply, replyBody, setReplyBody, () => setReplyTo(null))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {confirmDeleteId && (
        <ConfirmModal
          title="Excluir comentário?"
          message="Respostas deste comentário também serão excluídas."
          confirmLabel="Excluir"
          danger
          onConfirm={doDeleteComment}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}

      {reportComment && (
        <View style={styles.reportOverlay}>
          <View style={styles.reportSheet}>
            <Text style={styles.reportTitle}>Denunciar comentário</Text>
            <TextInput
              placeholder="Motivo da denúncia..."
              placeholderTextColor={colors.muted2}
              style={styles.reportInput}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" onPress={() => setReportComment(null)}>Cancelar</Button>
              <Button onPress={sendReportComment} disabled={!reportReason.trim()}>Enviar</Button>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  commentsCard: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 12 },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sortTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  sortTab: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  sortTabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  sortTabText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  sortTabTextActive: { color: colors.primaryDark },
  noComments: { color: colors.muted, fontSize: 14, paddingVertical: 8 },
  compose: { marginTop: 8, marginBottom: 8 },
  composeInput: { minHeight: 52, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 11, fontSize: 14, color: colors.text, textAlignVertical: 'top' },
  commentRow: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  cMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cMeta: { fontSize: 12, fontWeight: '700', color: colors.text },
  cBody: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 2 },
  editedMark: { fontSize: 11, color: colors.muted },
  cAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cActionText: { fontSize: 11, color: colors.muted },
  voteCol: { alignItems: 'center', gap: 4, paddingTop: 2 },
  voteScore: { fontSize: 12, fontWeight: '600', color: colors.muted },
  reportOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  reportSheet: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12 },
  reportTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  reportInput: { minHeight: 80, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14, color: colors.text, textAlignVertical: 'top' },
});
