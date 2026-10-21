import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button, Field, Input, ErrorBox } from '@/components/ui';
import Icon from '@/components/Icon';
import { colors, radius } from '@/lib/theme';

const TAGS = ['Dúvida', 'Conseguiu', 'História Real', 'Desabafo', 'Apoio'];
const TYPES = [
  { key: 'post', label: 'Publicação' },
  { key: 'link', label: 'Link' },
  { key: 'poll', label: 'Enquete' },
];

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<any[]>([]);
  const [community, setCommunity] = useState('');
  const [type, setType] = useState('post');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [tag, setTag] = useState('');
  const [sensitive, setSensitive] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('community_members')
      .select('community_id, communities(*)')
      .eq('user_id', user!.id)
      .then(({ data }) => {
        const comms = (data || []).map((d: any) => d.communities).filter(Boolean);
        setCommunities(comms);
        if (comms.length) setCommunity(comms[0].id);
      });
  }, [user?.id]);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setImage({ uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' });
    }
  }

  function setOption(i: number, v: string) {
    setPollOptions((o) => o.map((x, j) => (j === i ? v : x)));
  }

  async function publish() {
    setError('');
    if (!title.trim()) { setError('Dê um título à publicação.'); return; }
    if (!community) { setError('Escolha uma comunidade que você participa.'); return; }
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (type === 'poll' && options.length < 2) { setError('A enquete precisa de ao menos 2 opções.'); return; }
    if (type === 'link') {
      try { new URL(linkUrl); } catch { setError('Cole uma URL válida (comece com http).'); return; }
    }
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const path = `${user!.id}/${Date.now()}.jpg`;
        const array = image.uri.startsWith('file') ? { uri: image.uri, name: image.name || 'photo.jpg', type: image.type || 'image/jpeg' } : image;
        const { data, error: upErr } = await supabase.storage.from('posts').upload(path, array as any, { contentType: array.type });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from('posts').getPublicUrl(data!.path).data.publicUrl;
      }
      const { error } = await supabase.from('posts').insert({
        author_id: user!.id,
        community_id: community,
        title: title.trim(),
        body: body.trim() || null,
        image_url: imageUrl || null,
        tag: tag || null,
        link_url: type === 'link' ? linkUrl.trim() : null,
        poll_options: type === 'poll' ? options : null,
        is_sensitive: sensitive,
      });
      if (error) throw error;
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Algo deu errado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.heading}>Criar post</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button variant="outline" onPress={() => router.back()}>Cancelar</Button>
          <Button onPress={publish} disabled={loading || communities.length === 0}>
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {communities.length === 0 ? (
          <View style={styles.noComm}>
            <Text style={styles.noCommTitle}>Você ainda não participa de nenhuma comunidade.</Text>
            <Text style={styles.noCommText}>Para criar uma publicação, entre em ao menos uma comunidade.</Text>
            <Button onPress={() => router.push('/comunidades')}>Explorar comunidades</Button>
          </View>
        ) : (
          <Field label="Publicar em:">
            <View style={styles.chips}>
              {communities.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.chip, community === c.id && styles.chipActive]}
                  onPress={() => setCommunity(c.id)}
                >
                  <Text style={[styles.chipText, community === c.id && styles.chipTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
        )}

        <ErrorBox msg={error} />

        <View style={styles.typeTabs}>
          {TYPES.map((t) => (
            <Pressable key={t.key} style={[styles.typeTab, type === t.key && styles.typeTabActive]} onPress={() => setType(t.key)}>
              <Text style={[styles.typeTabText, type === t.key && styles.typeTabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Field>
          <Input placeholder="Título da publicação" value={title} onChangeText={setTitle} />
        </Field>

        {type === 'link' && (
          <Field>
            <Input placeholder="https://exemplo.com/noticia-ou-artigo" value={linkUrl} onChangeText={setLinkUrl} />
          </Field>
        )}

        {type === 'poll' ? (
          <Field label="Opções da enquete:">
            {pollOptions.map((o, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Input placeholder={`Opção ${i + 1}`} value={o} onChangeText={(v) => setOption(i, v)} />
              </View>
            ))}
            {pollOptions.length < 6 && (
              <Button variant="outline" onPress={() => setPollOptions((o) => [...o, ''])}>+ Opção</Button>
            )}
          </Field>
        ) : (
          <Field>
            <Input
              placeholder={type === 'link' ? 'Um pouco de contexto sobre o link (opcional)...' : 'Compartilhe sua história, dúvida ou palavras de apoio...'}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
            />
          </Field>
        )}

        {type !== 'poll' && (
          <View style={styles.mediaSection}>
            {!image ? (
              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Icon name="camera" size={18} color={colors.primaryDark} />
                <Text style={styles.attachText}>Adicionar foto</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Image source={{ uri: image.uri }} style={styles.preview} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
                  <Text style={styles.removeText}>Remover foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Field label="Tag de contexto (opcional)">
          <View style={styles.chips}>
            {TAGS.map((t) => (
              <Pressable key={t} style={[styles.chip, tag === t && styles.chipActive]} onPress={() => setTag(tag === t ? '' : t)}>
                <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Pressable
            style={[styles.sensitiveRow, sensitive && { borderColor: colors.primary }]}
            onPress={() => setSensitive((s) => !s)}
          >
            <Text style={[styles.sensitiveLabel, sensitive && { color: colors.primaryDark }]}>
              Marcar como conteúdo sensível
            </Text>
            <View style={[styles.checkbox, sensitive && styles.checkboxOn]}>
              {sensitive && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
          </Pressable>

        <Text style={styles.hint}>Sua publicação é anônima e pode salvar vidas.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { padding: 16 },
  noComm: { backgroundColor: colors.bg, borderRadius: radius, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  noCommTitle: { fontWeight: '600', fontSize: 14, color: colors.text, textAlign: 'center' },
  noCommText: { color: colors.muted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: colors.primaryDark },
  sensitiveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius,
    padding: 12, marginBottom: 12,
  },
  sensitiveLabel: { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  typeTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  typeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  typeTabActive: { borderBottomColor: colors.primary },
  typeTabText: { fontSize: 13, fontWeight: '500', color: colors.muted },
  typeTabTextActive: { color: colors.primaryDark, fontWeight: '700' },
  mediaSection: { marginBottom: 14 },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignSelf: 'flex-start',
  },
  attachText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  preview: { height: 240, borderRadius: 12, backgroundColor: colors.bg },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  removeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  hint: { fontSize: 11, color: colors.muted, marginTop: 8 },
});
