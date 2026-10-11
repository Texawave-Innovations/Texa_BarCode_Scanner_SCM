import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { QuantityStep } from '../components/QuantityStep';
import { Scanner } from '../components/Scanner';
import { Card, Loading } from '../components/ui';
import { addToBin, binLabel, findBin, findProduct, productPlacement } from '../data';
import { useSession } from '../session';
import { colors } from '../theme';
import type { Location } from '../types';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

/** ADD: scan the destination rack/bin, confirm the quantity, save a completed putaway. */
export default function AddScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Add'>) {
  const { user } = useSession();
  const { snap, error: loadError, reload } = useSnapshot();
  const [bin, setBin] = useState<Location | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!snap || !user) return loadError ? <Text style={styles.error}>{loadError}</Text> : <Loading />;
  const product = snap.products.find((p) => p.productCode === route.params.productCode);
  if (!product) return <Text style={styles.error}>Product not found.</Text>;
  const { unassigned } = productPlacement(snap, product.productCode);

  if (!bin) {
    return (
      <Scanner
        prompt={`Scan the RACK / BIN for ${product.productCode}`}
        error={scanError}
        onScan={(raw) => {
          const match = findBin(snap, raw);
          if ('location' in match) { setScanError(null); setBin(match.location); }
          else setScanError(findProduct(snap, raw) ? 'That is a product label. Scan the rack/bin label.' : match.error);
        }}
      />
    );
  }

  const confirm = async (qty: number) => {
    setBusy(true); setSaveError(null);
    try {
      const fresh = (await reload()) || snap; // validate against the latest stock
      const number = await addToBin(fresh, user, product, bin, qty);
      Alert.alert('Saved', `${qty} × ${product.productCode} added to ${binLabel(bin)}.\n${number}`, [
        { text: 'Scan next product', onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Add to bin</Text>
      <QuantityStep
        rows={[{ label: 'Product', value: product.name }, { label: 'SKU', value: product.productCode }, { label: 'Bin', value: binLabel(bin) }]}
        max={unassigned} initial={unassigned} confirmLabel="Confirm add" busy={busy} error={saveError} onConfirm={confirm}
      />
      <Card><Text style={{ color: colors.muted }} onPress={() => setBin(null)}>Wrong bin? Tap to scan again.</Text></Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  error: { color: colors.danger, padding: 24 },
});
