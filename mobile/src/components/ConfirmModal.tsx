import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors, radius } from '@/lib/theme';

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="x-close" size={20} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={onClose}>
              <Text style={[styles.btnText, { color: colors.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[styles.btn, danger ? styles.btnDanger : styles.btnPrimary]} onPress={onConfirm}>
              <Text style={styles.btnTextLight}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  message: { fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    minWidth: 100,
    alignItems: 'center',
  },
  btnOutline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnPrimary: { backgroundColor: colors.primary },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { fontWeight: '600', fontSize: 13 },
  btnTextLight: { fontWeight: '600', fontSize: 13, color: '#fff' },
});
