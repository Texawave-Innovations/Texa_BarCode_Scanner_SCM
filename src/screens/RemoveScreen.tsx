import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { QuantityStep } from '../components/QuantityStep';
import { Scanner } from '../components/Scanner';
import { Card, Loading } from '../components/ui';
import { binLabel, findBin, findProduct, productPlacement, removeFromBin } from '../data';
import { useSession } from '../session';
import { colors } from '../theme';
import type { Location } from '../types';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

const DEFAULT_REASON = 'Stock removed';

/** REMOVE: scan the bin the product is physically being taken out of, confirm quantity,
 *  save a completed stock-out movement (no destination bin). */
export default function RemoveScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Remove'>) {
  const { user } = useSession();
  const { snap, error: loadError, reload } = useSnapshot();
  const [bin, setBin] = useState<Location | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (!snap || !user) return loadError ? <Text style={styles.error}>{loadError}</Text> : <Loading />;
  const product = snap.products.find((p) => p.productCode === route.params.productCode);
  if (!product) return <Text style={styles.error}>Product not found.</Text>;
  const { bins } = productPlacement(snap, product.productCode);
  const preset = route.params.sourceLocationId ? bins.find((b) => b.location.id === route.params.sourceLocationId)?.location ?? null : null;
  const source = bin || preset || (bins.length === 1 ? bins[0].location : null);
  const sourceQty = bins.find((b) => b.location.id === source?.id)?.quantity ?? 0;

  if (!source) {
    return (
      <Scanner
        prompt={`Scan the bin to take ${product.productCode} out of`}
        error={scanError}
        onScan={(raw) => {
          const match = findBin(snap, raw);
          if (!('location' in match)) { setScanError(findProduct(snap, raw) ? 'That is a product label. Scan the rack/bin label.' : match.error); return; }
          if (!bins.some((b) => b.location.id === match.location.id)) { setScanError(`${product.productCode} is not stored in ${binLabel(match.location)}.`); return; }
          setScanError(null);
          setBin(match.location);
        }}
      />
    );
  }

  const confirm = async (qty: number) => {
    setBusy(true); setSaveError(null);
    try {
      const fresh = (await reload()) || snap; // validate against the latest stock
      const number = await removeFromBin(fresh, user, product, source, qty, DEFAULT_REASON);
      const remaining = sourceQty - qty;
      Alert.alert('Saved', `${qty} × ${product.productCode} removed from ${binLabel(source)}.\n${remaining} remaining in this bin.\n${number}`, [
        { text: 'Scan next product', onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save.');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Remove stock</Text>
        <QuantityStep
          rows={[{ label: 'Product', value: product.name }, { label: 'SKU', value: product.productCode }, { label: 'Bin', value: binLabel(source) }]}
          max={sourceQty} initial={1} confirmLabel="Confirm removal" busy={busy} error={saveError} onConfirm={confirm}
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)}
        />
        <Card><Text style={{ color: colors.muted }} onPress={() => setBin(null)}>Wrong bin? Tap to scan again.</Text></Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 16, gap: 14, backgroundColor: colors.bg, flexGrow: 1, paddingBottom: 320 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  error: { color: colors.danger, padding: 24 },
});
