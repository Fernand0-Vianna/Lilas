import { useLocalSearchParams } from 'expo-router';
import ProfileView from '@/components/ProfileView';

export default function UserProfileScreen() {
  const { apelido } = useLocalSearchParams<{ apelido: string }>();
  return <ProfileView apelido={apelido} />;
}
