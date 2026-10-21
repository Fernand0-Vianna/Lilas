import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button, Field, Input, ErrorBox } from '@/components/ui';
import { colors } from '@/lib/theme';

export default function CreateCommunityScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const slug = useMemo(
    () => name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    [name],
  );

  async function submit() {
    setError('');
    const n = name.trim();
    if (!n || n.length < 2) { setError('Dê um nome com ao menos 2 letras.'); return; }
    if (!slug || slug.length < 2) { setError('Use apenas letras e números (acentos são removidos).'); return; }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('communities')
      .insert({
        name: n.startsWith('r/') ? n : `r/${n}`,
        slug,
        description: description.trim(),
        category: category.trim(),
      })
      .select('slug')
      .single();
    setLoading(false);
    if (e) {
      if (e.code === '23505' || (e.message || '').toLowerCase().includes('duplicate')) {
        setError('Já existe uma comunidade com esse nome. Escolha outro.');
      } else {
        setError(e.message || 'Erro ao criar comunidade.');
      }
      return;
    }
    router.replace(`/c/${data!.slug}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Criar comunidade' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label="Nome">
            <Input placeholder="ex: Acolhimento" value={name} onChangeText={setName} autoCapitalize="sentences" />
          </Field>
          {name ? <Text style={styles.hint}>URL: r/{slug || '...'}</Text> : null}
          <Field label="Descrição (opcional)">
            <Input placeholder="Sobre o que é essa comunidade?" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          </Field>
          <Field label="Categoria (opcional)">
            <Input placeholder="ex: Apoio, Direitos, Saúde" value={category} onChangeText={setCategory} autoCapitalize="sentences" />
          </Field>
          <ErrorBox msg={error} />
          <Button onPress={submit} disabled={loading} block>
            {loading ? 'Criando...' : 'Criar comunidade'}
          </Button>
          <Text style={styles.note}>Você será a primeira moderadora da comunidade.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 20 },
  hint: { fontSize: 11, color: colors.muted2, marginTop: -6, marginBottom: 14 },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
