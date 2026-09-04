import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/lib/theme';

type Props = {
  apelido?: string | null;
  avatarUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function Avatar({ apelido, avatarUrl, size = 28, style }: Props) {
  const initial = (apelido || '?')[0]?.toUpperCase() || '?';
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: colors.primaryDark }}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#dcd2f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
