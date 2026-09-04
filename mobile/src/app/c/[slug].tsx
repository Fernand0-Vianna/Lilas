import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { compact } from '@/lib/format';
import PostCard from '@/components/PostCard';
import { Button } from '@/components/ui';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import ConfirmModal from '@/components/ConfirmModal';
import { colors, radius } from '@/lib/theme';

export default function CommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [userSaves, setUserSaves] = useState<Record<string, boolean>>({});
  const [joined, setJoined] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'posts' | 'about'>('posts');
  const [modOpen, setModOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<any>(null);
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  useEffect(() => {
    setLoading(true); setNotFound(false);
    (async () => {
      const { data: c } = await supabase.from('communities').select('*').eq('slug', slug).single();
      if (!c) { setNotFound(true); setLoading(false); return; }
      const cid = c.id;
      const [postsR, membersR, memR, modR] = await Promise.all([
        supabase.from('posts').select('*, author:profiles(*), community:communities(*)').eq('community_id', cid).order('created_at', { ascending: false }),
        supabase.from('profile_communities').select('profile:profiles(*)').eq('community_id', cid).limit(20),
        supabase.from('community_members').select('id').eq('community_id', cid).eq('user_id', user!.id).maybeSingle(),
        supabase.from('community_moderators').select('id').eq('community_id', cid).eq('user_id', user!.id).maybeSingle(),
      ]);
      const postIds = (postsR.data || []).map((p: any) => p.id);
      let votesMap: Record<string, number> = {};
      let savesMap: Record<string, boolean> = {};
      if (postIds.length) {
        const [lR, sR] = await Promise.all([
          supabase.from('likes').select('post_id, vote').in('post_id', postIds).eq('user_id', user!.id),
          supabase.from('saves').select('post_id').in('post_id', postIds).eq('user_id', user!.id),
        ]);
        (lR.data || []).forEach((r: any) => (votesMap[r.post_id] = r.vote));
        (sR.data || []).forEach((r: any) => (savesMap[r.post_id] = true));
      }
      setCommunity(c);
      setPosts(postsR.data || []);
      setMembers((membersR.data || []).map((m: any) => m.profile).filter(Boolean));
      setJoined(!!memR.data);
      setIsMod(!!modR.data);
      setIsOwner(c.creator_id === user?.id);
      setUserVotes(votesMap);
      setUserSaves(savesMap);
      setLoading(false);
    })();
  }, [slug, user?.id]);

  async function toggleJoin() {
    if (joined) {
      await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', user!.id);
      setJoined(false);
      setCommunity((c: any) => ({ ...c, members: Math.max(0, (c.members || 1) - 1) }));
    } else {
      await supabase.from('community_members').insert({ community_id: community.id, user_id: user!.id });
      setJoined(true);
      setCommunity((c: any) => ({ ...c, members: (c.members || 0) + 1 }));
    }
  }

  async function handleBan(m: any, days: number) {
    await supabase.from('community_bans').insert({ community_id: community.id, user_id: m.id, reason: `Ban moderador`, expires_at: new Date(Date.now() + days * 86400000).toISOString() });
    await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', m.id);
    setMembers((ms) => ms.filter((x) => x.id !== m.id));
    setBanTarget(null);
  }

  async function handleRemoveAsMod(m: any) {
    await supabase.from('community_moderators').delete().eq('community_id', community.id).eq('user_id', m.id);
    setMembers((ms) => ms.filter((x) => x.id !== m.id));
    setRemoveTarget(null);
  }

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (notFound || !community) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.muted }}>Comunidade não encontrada.</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ title: community.name, headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.banner}>
          <Text style={styles.bannerLetter}>{community.name.replace('r/', '').slice(0, 1)}</Text>
          {isMod && (
            <TouchableOpacity style={styles.modBtn} onPress={() => setModOpen(true)}>
              <Icon name="gear" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.infoWrap}>
          <Text style={styles.name}>{community.name}</Text>
          <Text style={styles.meta}>{compact(community.members)} membros · criada por u/{community.creator_username || 'criador'} · {community.category || ''}</Text>
          {community.description ? <Text style={styles.desc}>{community.description}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Button variant={joined ? 'outline' : 'primary'} onPress={toggleJoin}>
              {joined ? 'Membro' : 'Entrar'}
            </Button>
            {joined && <Button onPress={() => router.push('/criar')}>Criar post</Button>}
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'posts' && styles.tabActive]} onPress={() => setTab('posts')}>
            <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'about' && styles.tabActive]} onPress={() => setTab('about')}>
            <Text style={[styles.tabText, tab === 'about' && styles.tabTextActive]}>Sobre</Text>
          </TouchableOpacity>
        </View>

        {tab === 'posts' ? (
          posts.length === 0 ? (
            <Text style={styles.empty}>Nenhum post ainda.</Text>
          ) : (
            <View style={{ paddingHorizontal: 12 }}>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} userVote={userVotes[p.id]} userSaved={userSaves[p.id]} onDeleted={() => setPosts((ps) => ps.filter((x) => x.id !== p.id))} />
              ))}
            </View>
          )
        ) : (
          <View style={styles.aboutWrap}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Regras</Text>
              {community.rules?.length ? (
                community.rules.map((r: string, i: number) => (
                  <Text key={i} style={styles.rule}>{i + 1}. {r}</Text>
                ))
              ) : (
                <Text style={styles.aboutText}>Nenhuma regra definida.</Text>
              )}
            </View>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Membros</Text>
              {members.length === 0 ? <Text style={styles.aboutText}>Nenhum membro visível.</Text> : (
                <View style={{ gap: 10 }}>
                  {members.map((m) => (
                    <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Avatar apelido={m.apelido} avatarUrl={m.avatar_url} size={32} />
                      <Text style={styles.memberName}>{m.apelido}</Text>
                      {isMod && m.id !== user?.id && (
                        <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                          <Button variant="outline" style={{ paddingHorizontal: 8 }} onPress={() => setRemoveTarget(m)}>Tirar mod</Button>
                          <Button variant="danger" style={{ paddingHorizontal: 8 }} onPress={() => setBanTarget(m)}>Banir</Button>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {modOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Moderação</Text>
            <Text style={styles.modalText}>Você é moderador(a) e pode banir membros ou removê-los da moderação na aba "Sobre".</Text>
            <Button onPress={() => setModOpen(false)}>Fechar</Button>
          </View>
        </View>
      )}
      {banTarget && (
        <ConfirmModal
          title={`Banir ${banTarget.apelido}?`}
          message="O membro será removido e impedido de entrar na comunidade."
          confirmLabel="Banir"
          danger
          onConfirm={() => handleBan(banTarget, 7)}
          onClose={() => setBanTarget(null)}
        />
      )}
      {removeTarget && (
        <ConfirmModal
          title={`Remover ${removeTarget.apelido} da moderação?`}
          message="O usuário deixará de ser moderador desta comunidade."
          confirmLabel="Remover"
          onConfirm={() => handleRemoveAsMod(removeTarget)}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: { height: 120, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  bannerLetter: { fontSize: 56, fontWeight: '800', color: '#fff', opacity: 0.9 },
  modBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, padding: 8 },
  infoWrap: { paddingHorizontal: 16, paddingTop: 12 },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  desc: { fontSize: 13, color: colors.text, marginTop: 10, lineHeight: 19 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.muted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', padding: 32 },
  aboutWrap: { padding: 12, gap: 12 },
  aboutCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius, padding: 16 },
  aboutTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  rule: { fontSize: 13, color: colors.text, marginBottom: 6, lineHeight: 18 },
  aboutText: { fontSize: 13, color: colors.muted },
  memberName: { fontSize: 13, fontWeight: '600', color: colors.text },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalSheet: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  modalText: { fontSize: 13, color: colors.muted, lineHeight: 19 },
});
