import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PostCard from '@/components/PostCard';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { colors, radius } from '@/lib/theme';
import { Community, Post, postScore } from '@/lib/types';

function hotScore(p: Post) {
  const score = postScore(p);
  const order = Math.log10(Math.max(Math.abs(score), 1)) * Math.sign(score);
  return order + new Date(p.created_at).getTime() / 1000 / 45000;
}

type FeedData = {
  posts: Post[];
  communities: Community[];
  users: any[];
  userVotes: Record<string, number>;
  userSaves: Record<string, boolean>;
  removePost: (id: string) => void;
};

function useFeed(q: string, scope: string): FeedData {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [userSaves, setUserSaves] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const userId = user?.id;

    const buildQuery = async () => {
      let query = supabase
        .from('posts')
        .select('*, profiles!posts_author_id_fkey(apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (scope === 'home' && userId) {
        const [commRes, followRes] = await Promise.all([
          supabase.from('community_members').select('community_id').eq('user_id', userId),
          supabase.from('follows').select('following_id').eq('follower_id', userId),
        ]);
        const communityIds = (commRes.data || []).map((r: any) => r.community_id);
        const followingIds = (followRes.data || []).map((r: any) => r.following_id);
        if (!communityIds.length && !followingIds.length) {
          return { data: [] };
        }
        const filters = [];
        if (communityIds.length) filters.push(`community_id.in.(${communityIds.join(',')})`);
        if (followingIds.length) filters.push(`author_id.in.(${followingIds.join(',')})`);
        query = (query as any).or(filters.join(','));
      }

      if (q) query = (query as any).or(`title.ilike.%${q}%,body.ilike.%${q}%`);
      return query;
    };
    const userSearch = q.replace(/^[uU@\/]+/, '').trim();
    const usersQuery = userSearch
      ? supabase.from('profiles').select('id, apelido, avatar_url, bio').ilike('apelido', `%${userSearch}%`).limit(10).then((r) => r, () => ({ data: [] }))
      : Promise.resolve({ data: [] });
    const communitiesQuery = q
      ? supabase.from('communities').select('*').ilike('name', `%${q}%`).limit(10).then((r) => r, () => ({ data: [] }))
      : supabase.from('communities').select('*').order('members', { ascending: false }).limit(10);

    Promise.all([buildQuery(), communitiesQuery, usersQuery]).then(
      async ([p, c, u]) => {
        const allPosts = (p.data || []) as Post[];
        setPosts(allPosts);
        setCommunities((c.data || []) as Community[]);
        setUsers(u.data || []);

        const postIds = allPosts.map((x) => x.id);
        if (postIds.length && user?.id) {
          const [likesRes, savesRes] = await Promise.all([
            supabase.from('likes').select('post_id, vote').in('post_id', postIds).eq('user_id', user.id),
            supabase.from('saves').select('post_id').in('post_id', postIds).eq('user_id', user.id),
          ]);
          const votesMap: Record<string, number> = {};
          (likesRes.data || []).forEach((r: any) => (votesMap[r.post_id] = r.vote));
          const savesMap: Record<string, boolean> = {};
          (savesRes.data || []).forEach((r: any) => (savesMap[r.post_id] = true));
          setUserVotes(votesMap);
          setUserSaves(savesMap);
        } else {
          setUserVotes({});
          setUserSaves({});
        }
      }
    ).catch(() => {
      setPosts([]);
      setCommunities([]);
      setUsers([]);
      setUserVotes({});
      setUserSaves({});
    });
  }, [q, scope, user?.id]);

  return { posts, communities, users, userVotes, userSaves, removePost: (id) => setPosts((p) => p.filter((x) => x.id !== id)) };
}

function HelpBanner() {
  return (
    <View style={styles.helpBanner}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.helpBadge}>Apoio 24h</Text>
        <Text style={styles.helpText}>
          Precisa de ajuda? Ligue <Text style={{ fontWeight: '700' }}>180</Text> (gratuito)
        </Text>
      </View>
      <TouchableOpacity style={styles.helpBtn} onPress={() => Linking.openURL('tel:180')}>
        <Text style={styles.helpBtnText}>Ligar 180</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState('hot');
  const [feedScope, setFeedScope] = useState('home');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { posts, communities, users, userVotes, userSaves, removePost } = useFeed(query, query ? 'all' : feedScope);

  const sorted = [...posts];
  if (tab === 'top') sorted.sort((a, b) => postScore(b) - postScore(a));
  if (tab === 'new') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (tab === 'hot') sorted.sort((a, b) => hotScore(b) - hotScore(a));
  const visible = tab === 'top' ? sorted.filter((p) => postScore(p) > 0) : sorted;

  const TABS = [
    { key: 'hot', label: 'Em alta' },
    { key: 'new', label: 'Novo' },
    { key: 'top', label: 'Mais votado' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.logo}>Lilás</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.searchTrigger} onPress={() => setSearchOpen(true)} hitSlop={8}>
            <Icon name="search" size={20} color={colors.muted} />
          </Pressable>
          <Pressable style={styles.searchTrigger} onPress={() => router.push('/alertas')} hitSlop={8}>
            <Icon name="bell" size={20} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <HelpBanner />

        {query ? <Text style={styles.resultsTitle}>Resultados para "{query}"</Text> : null}
        {query && users.length > 0 ? (
          <View style={styles.peopleCard}>
            <Text style={styles.peopleTitle}>Pessoas</Text>
            {users.map((u) => (
              <Pressable key={u.id} style={styles.peopleRow} onPress={() => router.push(`/u/${u.apelido}`)}>
                <Avatar apelido={u.apelido} avatarUrl={u.avatar_url} size={28} />
                <Text style={styles.peopleName}>@{u.apelido}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!query ? (
          <View style={styles.tabs}>
            {[
              { key: 'home', label: 'Home' },
              { key: 'all', label: 'Tudo' },
            ].map((t) => (
              <Pressable key={t.key} style={[styles.tab, feedScope === t.key && styles.tabActive]} onPress={() => { setFeedScope(t.key); setTab('hot'); }}>
                <Text style={[styles.tabText, feedScope === t.key && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {visible.map((p) => (
          <PostCard key={p.id} post={p} onDeleted={() => removePost(p.id)} userVote={userVotes[p.id]} userSaved={userSaves[p.id]} />
        ))}

        {visible.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{query ? 'Nada encontrado' : 'Nada por aqui ainda'}</Text>
            <Text style={styles.emptyText}>{query ? 'Tente outra palavra-chave.' : 'Seja a primeira a compartilhar algo inspirador.'}</Text>
            {!query && (
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/criar')}>
                <Text style={styles.emptyBtnText}>Criar post</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={searchOpen} animationType="slide" transparent onRequestClose={() => setSearchOpen(false)}>
        <View style={styles.searchOverlay}>
          <View style={styles.searchSheet}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Buscar no Lilás</Text>
              <Pressable onPress={() => setSearchOpen(false)} hitSlop={8}>
                <Icon name="x-close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <TextInput
              autoFocus
              placeholder="Pesquisar posts, temas, relatos..."
              placeholderTextColor={colors.muted2}
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => {
                setQuery(searchText.trim());
                setSearchOpen(false);
              }}
            />
            <Pressable
              style={[styles.searchBtn, !searchText.trim() && { opacity: 0.5 }]}
              onPress={() => {
                if (searchText.trim()) {
                  setQuery(searchText.trim());
                  setSearchOpen(false);
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Pesquisar</Text>
            </Pressable>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.suggestTitle}>Tópicos sugeridos:</Text>
              <View style={styles.suggestWrap}>
                {['Apoio', 'História Real', 'Desabafo', 'Dúvida', 'Lei Maria da Penha'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.chip}
                    onPress={() => {
                      setQuery(t);
                      setSearchOpen(false);
                    }}
                  >
                    <Text style={styles.chipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  searchTrigger: { padding: 6 },
  content: { padding: 12 },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  helpBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  helpText: { fontSize: 12, lineHeight: 16, color: '#fff' },
  helpBtn: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  helpBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: 11 },
  resultsTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginVertical: 12 },
  peopleCard: { backgroundColor: colors.card, borderRadius: radius, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  peopleTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: colors.muted, fontWeight: '700', marginBottom: 8 },
  peopleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  peopleName: { fontSize: 13, fontWeight: '500', color: colors.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
  tab: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.muted },
  tabTextActive: { color: colors.primaryDark, fontWeight: '700' },
  emptyCard: { backgroundColor: colors.card, borderRadius: radius, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { color: colors.muted, fontSize: 13 },
  emptyBtn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  searchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  searchSheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  searchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  searchInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  suggestTitle: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 },
  suggestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
});
