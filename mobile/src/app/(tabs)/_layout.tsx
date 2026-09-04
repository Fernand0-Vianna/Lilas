import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';
import Icon from '@/components/Icon';
import Protected from '@/components/Protected';

function BellIcon({ color, size }: { color: any; size: number }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('unread_count').then(({ data }) => setUnread(data ?? 0));
    const i = setInterval(() => {
      supabase.rpc('unread_count').then(({ data }) => setUnread(data ?? 0));
    }, 30000);
    return () => clearInterval(i);
  }, [user?.id]);

  return (
    <View>
      <Icon name="bell" size={size} color={color} />
      {unread > 0 && (
        <View style={badgeStyles.dot}>
          <Text style={badgeStyles.txt}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  dot: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  txt: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

export default function TabsLayout() {
  return (
    <Protected>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryDark,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 56,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="comunidades"
          options={{
            title: 'Comunidades',
            tabBarIcon: ({ color, size }) => <Icon name="users" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="criar"
          options={{
            title: 'Criar',
            tabBarIcon: ({ color, size }) => <Icon name="add" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="alertas"
          options={{
            title: 'Alertas',
            tabBarIcon: ({ color, size }) => <BellIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color as string} />,
          }}
        />
      </Tabs>
    </Protected>
  );
}
