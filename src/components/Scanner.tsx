import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { Button } from './ui';

/** Camera scanner with torch + manual-entry fallback. Calls onScan once per distinct read
 *  (2s debounce on the same value) so a steady hold doesn't fire repeatedly. */
export function Scanner({ prompt, onScan, error }: { prompt: string; onScan: (value: string) => void; error?: string | null }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState('');
  const last = useRef({ value: '', at: 0 });

  const handle = (value: string) => {
    const v = value.trim();
    if (!v) return;
    const now = Date.now();
    if (last.current.value === v && now - last.current.at < 2000) return;
    last.current = { value: v, at: now };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onScan(v);
  };

  if (!permission) return <View style={styles.fill} />;
  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.pad]}>
        <Text style={styles.prompt}>Camera access is needed to scan barcodes.</Text>
        <Button title="Allow camera" onPress={requestPermission} />
        <ManualEntry value={manual} setValue={setManual} onSubmit={handle} />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13', 'ean8', 'code39', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={({ data }) => handle(data)}
        />
        <View pointerEvents="none" style={styles.frame} />
        <Pressable style={styles.torch} onPress={() => setTorch((t) => !t)}>
          <Text style={styles.torchText}>{torch ? 'Torch on' : 'Torch off'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.pad}>
        <ManualEntry value={manual} setValue={setManual} onSubmit={handle} />
      </View>
    </View>
  );
}

function ManualEntry({ value, setValue, onSubmit }: { value: string; setValue: (v: string) => void; onSubmit: (v: string) => void }) {
  return (
    <View style={styles.manual}>
      <TextInput
        style={styles.input}
        placeholder="Or type the code"
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={setValue}
        autoCapitalize="characters"
        autoCorrect={false}
        onSubmitEditing={() => { onSubmit(value); setValue(''); }}
      />
      <Button title="Go" onPress={() => { onSubmit(value); setValue(''); }} style={{ minHeight: 48, marginLeft: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  prompt: { fontSize: 20, fontWeight: '700', color: colors.text, padding: 16, paddingBottom: 8 },
  cameraWrap: { height: 320, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  frame: { position: 'absolute', top: '25%', left: '12%', right: '12%', bottom: '25%', borderWidth: 3, borderColor: '#FFFFFFCC', borderRadius: 12 },
  torch: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#000A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  torchText: { color: '#fff', fontWeight: '600' },
  error: { color: colors.danger, fontSize: 15, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12 },
  manual: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, backgroundColor: colors.card, color: colors.text },
});
