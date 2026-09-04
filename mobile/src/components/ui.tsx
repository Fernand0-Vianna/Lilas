import { Pressable, Text, TextInput, View, StyleSheet, StyleProp, ViewStyle, TextStyle, KeyboardTypeOptions } from 'react-native';
import { ReactNode } from 'react';
import { colors, radius } from '@/lib/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  onPress,
  children,
  disabled,
  style,
  block,
}: {
  variant?: Variant;
  onPress?: () => void;
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  block?: boolean;
}) {
  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'danger' ? colors.danger
    : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        block && styles.btnBlock,
        variant === 'outline' && styles.btnOutline,
        variant === 'ghost' && { backgroundColor: colors.primarySoft },
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant !== 'primary' && variant !== 'danger' && { backgroundColor: 'transparent' },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.btnText, (variant === 'primary' || variant === 'danger') && styles.btnTextLight]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Field({
  label,
  children,
  style,
}: {
  label?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
    </View>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  onSubmitEditing,
  returnKeyType,
  autoCapitalize,
  autoComplete,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted2}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : undefined}
      onSubmitEditing={onSubmitEditing}
      returnKeyType={returnKeyType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete as any}
      style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }, style]}
    />
  );
}

export function ErrorBox({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <Text style={styles.error}>{msg}</Text>;
}

export function OkBox({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <Text style={styles.ok}>{msg}</Text>;
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  btnBlock: { width: '100%' },
  btnOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  btnText: { fontWeight: '600', fontSize: 13, color: colors.text },
  btnTextLight: { color: '#fff' },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 5, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.card,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    borderWidth: 1,
    borderColor: '#ffc9d6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 14,
  },
  ok: {
    backgroundColor: '#eefbf3',
    color: '#1a7f46',
    borderWidth: 1,
    borderColor: '#b8ecd0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 14,
  },
});
