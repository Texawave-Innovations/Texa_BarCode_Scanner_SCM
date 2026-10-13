import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { QuantityStep } from '../components/QuantityStep';
import { Scanner } from '../components/Scanner';
import { Card, Loading } from '../components/ui';
import { binLabel, findBin, findProduct, moveBetweenBins, productPlacement } from '../data';
import { useSession } from '../session';
import { colors } from '../theme';
import type { Location } from '../types';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

/** MOVE: pick the source bin (auto when the product sits in just one), scan the destination,
 *  confirm the quantity, save a completed bin-to-bin movement. */
export default function MoveScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Move'>) {
  const { user } = useSession();
  const { snap, error: loadError, reload } = useSnapshot();
  const [from, setFrom] = useState<Location | null>(null);
  const [to, setTo] = useState<Location | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!snap || !user) return loadError ? <Text style={styles.error}>{loadError}</Text> : <Loading />;
  const product = snap.products.find((p) => p.productCode === route.params.productCode);
  if (!product) return <Text style={styles.error}>Product not found.</Text>;
  const { bins } = productPlacement(snap, product.productCode);
  const preset = route.params.sourceLocationId ? bins.find((b) => b.location.id === route.params.sourceLocationId)?.location ?? null : null;
  const source = from || preset || (bins.length === 1 ? bins[0].location : null);
  const sourceQty = bins.find((b) => b.location.id === source?.id)?.quantity ?? 0;

  const scanBin = (raw: string, onOk: (l: Location) => void) => {
    const match = findBin(snap, raw);
    if ('location' in match) { setScanError(null); onOk(match.location); }
    else setScanError(findProduct(snap, raw) ? 'That is a product label. Scan the rack/bin label.' : match.error);
  };

  if (!source) {
    return (
      <Scanner prompt={`Scan the SOURCE bin of ${product.productCode}`} error={scanError} onScan={(raw) =>
        scanBin(raw, (l) => {
          if (!bins.some((b) => b.location.id === l.id)) setScanError(`${product.productCode} is not stored in ${binLabel(l)}.`);
          else setFrom(l);
        })} />
    );
  }
  if (!to) {
    return (
      <Scanner prompt={`Scan the DESTINATION bin (from ${binLabel(source)})`} error={scanError} onScan={(raw) =>
        scanBin(raw, (l) => {
          if (l.id === source.id) setScanError('Destination is the same as the source bin.');
          else setTo(l);
        })} />
    );
  }

  const confirm = async (qty: number) => {
    setBusy(true); setSaveError(null);
    try {
      const fresh = (await reload()) || snap;
      const number = await moveBetweenBins(fresh, user, product, source, to, qty);
      Alert.alert('Saved', `${qty} × ${product.productCode} moved\n${binLabel(source)} → ${binLabel(to)}\n${number}`, [
        { text: 'Scan next product', onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Move stock</Text>
      <QuantityStep
        rows={[{ label: 'Product', value: product.name }, { label: 'SKU', value: product.productCode }, { label: 'From', value: binLabel(source) }, { label: 'To', value: binLabel(to) }]}
        max={sourceQty} initial={sourceQty} confirmLabel="Confirm move" busy={busy} error={saveError} onConfirm={confirm}
      />
      <Card><Text style={{ color: colors.muted }} onPress={() => setTo(null)}>Wrong destination? Tap to scan again.</Text></Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  error: { color: colors.danger, padding: 24 },
});
