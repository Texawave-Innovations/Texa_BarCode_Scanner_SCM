import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui';
import { login } from '../data';
import { useSession } from '../session';
import { colors } from '../theme';

export default function LoginScreen() {
  const { setUser } = useSession();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!id.trim() || !pw) { setError('Enter your email/username and password.'); return; }
    setBusy(true); setError(null);
    try { setUser(await login(id, pw)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Login failed.'); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>TexaWave Scanner</Text>
      <Text style={styles.sub}>Sign in with your ERP account</Text>
      <View style={{ gap: 12, marginTop: 24 }}>
        <TextInput style={styles.input} placeholder="Email or username" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} value={id} onChangeText={setId} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={pw} onChangeText={setPw} onSubmitEditing={submit} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Sign in" onPress={submit} loading={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 16, color: colors.muted, marginTop: 4 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 17, backgroundColor: colors.card, color: colors.text },
  error: { color: colors.danger, fontWeight: '600' },
});
