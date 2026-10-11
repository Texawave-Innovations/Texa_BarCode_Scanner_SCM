import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Loading, Row } from '../components/ui';
import { binLabel, productPlacement } from '../data';
import { colors } from '../theme';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

export default function ProductScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Product'>) {
  const { productCode } = route.params;
  const { snap, error } = useSnapshot();
  if (!snap) return error ? <Text style={styles.error}>{error}</Text> : <Loading />;
  const product = snap.products.find((p) => p.productCode === productCode);
  if (!product) return <Text style={styles.error}>Product not found.</Text>;
  const { bins, onHand, inBins, unassigned } = productPlacement(snap, productCode);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.code}>{product.productCode}</Text>
        <View style={{ height: 8 }} />
        <Row label="On hand" value={onHand} />
        <Row label="Placed in bins" value={inBins} />
        <Row label="Waiting for a bin" value={unassigned} bold />
      </Card>

      <Card>
        <Text style={styles.section}>Current bins</Text>
        {bins.length === 0 ? <Text style={styles.muted}>Not placed in any bin yet.</Text> : bins.map((b) => <Row key={b.location.id} label={binLabel(b.location)} value={b.quantity} />)}
      </Card>

      <Button title="ADD to a bin" onPress={() => navigation.navigate('Add', { productCode })} disabled={unassigned <= 0} />
      {unassigned <= 0 ? <Text style={styles.hint}>Nothing is waiting for a bin. Receive stock (GRN) in the ERP first.</Text> : null}
      <Button title="MOVE between bins" variant="secondary" onPress={() => navigation.navigate('Move', { productCode })} disabled={bins.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.bg, flexGrow: 1 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  code: { fontSize: 15, color: colors.muted, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  muted: { color: colors.muted },
  hint: { color: colors.warn, fontSize: 14 },
  error: { color: colors.danger, padding: 24 },
});
