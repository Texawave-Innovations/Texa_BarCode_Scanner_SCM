import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { Button, Card, Row } from './ui';

/** Confirm screen body: summary rows, quantity stepper, confirm button. */
export function QuantityStep({ rows, max, initial, confirmLabel, busy, error, onConfirm, onFocus }: {
  rows: { label: string; value: string }[]; max: number; initial: number; confirmLabel: string; busy: boolean; error: string | null; onConfirm: (qty: number) => void; onFocus?: () => void;
}) {
  const [text, setText] = useState(String(Math.min(initial, max)));
  const qty = Number(text);
  const set = (n: number) => setText(String(Math.max(0, Math.min(max, n))));
  return (
    <View style={{ gap: 14 }}>
      <Card>{rows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}<Row label="Max quantity" value={max} /></Card>
      <Card>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.stepper}>
          <Button title="−" variant="secondary" onPress={() => set((qty || 0) - 1)} style={styles.sq} />
          <TextInput style={styles.qty} keyboardType="number-pad" value={text} onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))} selectTextOnFocus onFocus={onFocus} />
          <Button title="+" variant="secondary" onPress={() => set((qty || 0) + 1)} style={styles.sq} />
        </View>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={confirmLabel} onPress={() => onConfirm(qty)} loading={busy} disabled={!(qty > 0)} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, color: colors.muted, marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sq: { width: 60, paddingHorizontal: 0 },
  qty: { flex: 1, minHeight: 56, textAlign: 'center', fontSize: 28, fontWeight: '800', borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text },
  error: { color: colors.danger, fontWeight: '600' },
});
