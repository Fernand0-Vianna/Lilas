import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { compact } from '@/lib/format';
import { Community } from '@/lib/types';
import { Button } from '@/components/ui';
import { colors, radius } from '@/lib/theme';

export default function CommunitiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('communities').select('*').order('members', { ascending: false }),
      supabase.from('community_members').select('community_id').eq('user_id', user!.id),
    ]).then(([c, j]) => {
      setCommunities((c.data || []) as Community[]);
      const map: Record<string, boolean> = {};
      (j.data || []).forEach((m: any) => (map[m.community_id] = true));
      setJoined(map);
    });
  }, [user?.id]);

  async function toggle(c: Community) {
    if (joined[c.id]) {
      const { error } = await supabase.from('community_members').delete().eq('community_id', c.id).eq('user_id', user!.id);
      if (!error) setJoined((j) => ({ ...j, [c.id]: false }));
    } else {
      const { error } = await supabase.from('community_members').insert({ community_id: c.id, user_id: user!.id });
      if (!error) setJoined((j) => ({ ...j, [c.id]: true }));
    }
  }

  const q = query.trim().toLowerCase();
  const list = q
    ? communities.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
    : communities;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.heading}>Comunidades</Text>
        <Pressable onPress={() => router.push('/criar-comunidade')}>
          <Text style={styles.create}>Criar</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          placeholder="Buscar comunidades..."
          placeholderTextColor={colors.muted2}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        {list.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Pressable onPress={() => router.push(`/c/${c.slug}`)}>
                <View style={styles.row}>
                  <Text style={styles.banner}>{c.name.replace('r/', '').slice(0, 1)}</Text>
                  <Text style={styles.name}>{c.name}</Text>
                </View>
                <Text style={styles.meta}>
                  {compact(c.members)} membros{c.category ? ` · ${c.category}` : ''}
                </Text>
                {c.description ? <Text style={styles.desc} numberOfLines={2}>{c.description}</Text> : null}
              </Pressable>
            </View>
            <Button variant={joined[c.id] ? 'outline' : 'primary'} onPress={() => toggle(c)}>
              {joined[c.id] ? 'Entrou' : 'Entrar'}
            </Button>
          </View>
        ))}
        {list.length === 0 && (
          <Text style={styles.empty}>Nenhuma comunidade encontrada.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  create: { fontSize: 13, fontWeight: '700', color: colors.primary },
  content: { padding: 12 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: colors.card,
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  banner: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    overflow: 'hidden',
  },
  name: { fontSize: 13, fontWeight: '600', color: colors.text },
  meta: { fontSize: 11, color: colors.muted2, marginTop: 2 },
  desc: { fontSize: 11, color: colors.muted, lineHeight: 15, marginTop: 4 },
  empty: { color: colors.muted, textAlign: 'center', padding: 24 },
});
