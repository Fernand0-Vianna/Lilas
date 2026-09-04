import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ptError } from '@/lib/errors';
import { Button, Field, Input, ErrorBox, OkBox } from '@/components/ui';
import { colors } from '@/lib/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === 'PASSWORD_RECOVERY' && s) setHasToken(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasToken(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    setError(''); setInfo('');
    if (!pw1 || pw1.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    if (pw1 !== pw2) { setError('As senhas não conferem.'); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);
    if (e) { setError(ptError(e)); return; }
    await supabase.auth.signOut();
    setInfo('Senha atualizada!');
    setTimeout(() => router.replace('/login'), 1500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}><Text style={styles.logoName}>Lilás</Text></View>
          {hasToken ? (
            <>
              <Text style={styles.sub}>Escolha sua nova senha.</Text>
              <Field label="Nova senha">
                <Input placeholder="••••••••" value={pw1} onChangeText={setPw1} secureTextEntry />
              </Field>
              <Field label="Repetir senha">
                <Input placeholder="••••••••" value={pw2} onChangeText={setPw2} secureTextEntry onSubmitEditing={submit} />
              </Field>
              <ErrorBox msg={error} />
              {info ? <OkBox msg={info} /> : null}
              <Button onPress={submit} disabled={loading}>{loading ? 'Salvando...' : 'Salvar nova senha'}</Button>
            </>
          ) : (
            <Text style={styles.sub}>Link de redefinição inválido ou expirado. Volte para o login e solicite novamente.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 20 },
  logoName: { fontSize: 32, fontWeight: '800', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
});
