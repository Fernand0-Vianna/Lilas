import { Tabs } from 'expo-router';
import { colors } from '@/lib/theme';
import Icon from '@/components/Icon';
import Protected from '@/components/Protected';

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
