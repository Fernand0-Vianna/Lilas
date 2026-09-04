import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { colors, radius } from '@/lib/theme';

type Notification = {
  id: string;
  type: 'comment' | 'follow' | 'mention';
  from_user_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  from?: { apelido: string; avatar_url: string | null } | null;
  post?: { title: string } | null;
};

function describe(n: Notification): string {
  const who = n.from ? `@${n.from.apelido}` : 'Alguém';
  switch (n.type) {
    case 'comment':
      return `${who} comentou no seu post`;
    case 'follow':
      return `${who} começou a te seguir`;
    case 'mention':
      return `${who} te mencionou`;
    default:
      return 'Nova atividade';
  }
}

function navigateTarget(n: Notification): string | null {
  if (n.type === 'comment' && n.post_id) return `/post/${n.post_id}`;
  if (n.type === 'follow' && n.from?.apelido) return `/u/${n.from.apelido}`;
  if (n.type === 'mention' && n.post_id) return `/post/${n.post_id}`;
  return null;
}

export default function AlertasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, from:from_user_id(apelido, avatar_url), post:post_id(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as any[]) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    if (!user) return;
    await supabase.rpc('mark_notifications_read');
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  }

  function handleTap(n: Notification) {
    const target = navigateTarget(n);
    if (target) router.push(target as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.heading}>Alertas</Text>
        {notifications.some((n) => !n.read) && (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markRead}>Marcar como lidas</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.empty}>Carregando...</Text>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="bell" size={32} color={colors.muted2} />
            <Text style={styles.emptyTitle}>Nenhum alerta ainda</Text>
            <Text style={styles.emptyText}>Quando alguém comentar nos seus posts ou começar a te seguir, você recebe um alerta aqui.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <Pressable
              key={n.id}
              style={[styles.row, !n.read && styles.rowUnread]}
              onPress={() => handleTap(n)}
            >
              <Avatar apelido={n.from?.apelido} avatarUrl={n.from?.avatar_url} size={36} />
              <View style={styles.rowMain}>
                <Text style={styles.rowText}>{describe(n)}</Text>
                {n.post?.title ? (
                  <Text style={styles.rowContext} numberOfLines={1}>{n.post.title}</Text>
                ) : null}
                <Text style={styles.rowTime}>{timeAgo(n.created_at)}</Text>
              </View>
              {!n.read && <View style={styles.dot} />}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  markRead: { fontSize: 12, fontWeight: '600', color: colors.primary },
  content: { padding: 12 },
  empty: { color: colors.muted, textAlign: 'center', padding: 24 },
  emptyCard: {
    backgroundColor: colors.card, borderRadius: radius, padding: 40,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: radius,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 8,
  },
  rowUnread: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  rowMain: { flex: 1, minWidth: 0 },
  rowText: { fontSize: 13, fontWeight: '500', color: colors.text, lineHeight: 18 },
  rowContext: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rowTime: { fontSize: 11, color: colors.muted2, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
