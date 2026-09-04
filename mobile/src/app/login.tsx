import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ptError } from '@/lib/errors';
import { Button, Field, Input, ErrorBox, OkBox } from '@/components/ui';
import { colors, radius, shadow } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [apelido, setApelido] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  if (user) return <Redirect href="/" />;

  async function submit() {
    setError(''); setInfo('');
    if (!email.trim() || !password) { setError('Preencha email e senha.'); return; }
    setLoading(true);
    if (mode === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (error) { setError(ptError(error)); setResent(false); return; }
      await refreshProfile();
      router.replace('/');
    } else {
      if (!apelido.trim()) { setError('Escolha um apelido.'); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { apelido: apelido.trim().replace(/^@/, '') } },
      });
      setLoading(false);
      if (error) { setError(ptError(error)); setResent(false); return; }
      setInfo('Conta criada! Confirme seu email pelo link enviado para entrar.');
      setResent(false);
    }
  }

  async function resendConfirmation() {
    setError(''); setInfo('');
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) { setError(ptError(error)); return; }
    setInfo('Reenviamos o link de confirmação. Verifique sua caixa de entrada e spam.');
    setResent(true);
  }

  async function resetPassword() {
    if (!email.trim()) { setError('Digite seu email para recuperar a senha.'); return; }
    setError(''); setInfo('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) { setError(ptError(error)); return; }
    setInfo('Enviamos um link de redefinição para seu email.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoBee}>⎈</Text>
            <Text style={styles.logoName}>Lilás</Text>
          </View>
          <Text style={styles.sub}>
            Sua comunidade segura para falar sobre violência contra a mulher, sem expor quem você é.
          </Text>

          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, mode === 'entrar' && styles.tabActive]} onPress={() => { setMode('entrar'); setError(''); setInfo(''); }}>
              <Text style={[styles.tabText, mode === 'entrar' && styles.tabTextActive]}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, mode === 'criar' && styles.tabActive]} onPress={() => { setMode('criar'); setError(''); setInfo(''); }}>
              <Text style={[styles.tabText, mode === 'criar' && styles.tabTextActive]}>Criar conta</Text>
            </TouchableOpacity>
          </View>

          <Field label="Email">
            <Input placeholder="seuemail@exemplo.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          </Field>
          {mode === 'criar' && (
            <Field label="Apelido (nome fantasia)">
              <Input placeholder="nome_fantasia" value={apelido} onChangeText={setApelido} autoCapitalize="none" autoComplete="off" />
              <Text style={styles.hint}>Você aparece como @{apelido.trim().replace(/^@/, '') || 'minha_fantasia'} — ninguém vê seu email.</Text>
            </Field>
          )}
          <Field label="Senha">
            <Input placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={submit} />
          </Field>

          <ErrorBox msg={error} />
          {info ? <OkBox msg={info} /> : null}
          {error && error.includes('Confirme seu email') && !resent && (
            <TouchableOpacity onPress={resendConfirmation}><Text style={styles.link}>Reenviar link de confirmação</Text></TouchableOpacity>
          )}
          {mode === 'criar' && info && !resent && (
            <TouchableOpacity onPress={resendConfirmation}><Text style={styles.link}>Não recebeu o email? Reenviar</Text></TouchableOpacity>
          )}

          <Button onPress={submit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Aguarde...' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
          </Button>
          {mode === 'entrar' && (
            <TouchableOpacity onPress={resetPassword}><Text style={[styles.link, styles.center]}>Esqueci minha senha</Text></TouchableOpacity>
          )}
          <Text style={[styles.hint, styles.center]}>Seus dados ficam privados; as comunidades só veem seu apelido.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 },
  logoBee: { fontSize: 40, color: '#fff' },
  logoName: { fontSize: 32, fontWeight: '800', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, marginBottom: 16, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: '#fff' },
  hint: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 6 },
  center: { textAlign: 'center', marginTop: 12 },
  link: { color: '#fff', textDecorationLine: 'underline', fontSize: 12, marginTop: 10 },
});
