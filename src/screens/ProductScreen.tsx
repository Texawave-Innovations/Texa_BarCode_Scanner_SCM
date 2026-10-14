import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, DetailGrid, DetailItem, Loading, Pill, Row, StatTile } from '../components/ui';
import { binLabel, locationNoun, productPlacement, productWarehouses } from '../data';
import { colors } from '../theme';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

export default function ProductScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Product'>) {
  const { productCode } = route.params;
  const { snap, error } = useSnapshot();
  if (!snap) return error ? <Text style={styles.error}>{error}</Text> : <Loading />;
  const product = snap.products.find((p) => p.productCode === productCode);
  if (!product) return <Text style={styles.error}>Product not found.</Text>;
  const { bins, onHand, reserved, available, inBins, unassigned } = productPlacement(snap, productCode);
  const warehouses = productWarehouses(snap, productCode);
  const stockStatus = onHand > 0 ? 'In stock' : 'Out of stock';
  const binLocations = bins.map((b) => `${binLabel(b.location)} (${locationNoun(b.location)})`).join(', ');

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <Badge label={stockStatus} tone={onHand > 0 ? 'ok' : 'off'} />
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.code}>{product.category || product.productCode}</Text>
        <View style={{ height: 6 }} />
        <Pill label={`SKU ${product.productCode}${product.barcode ? ` · ${product.barcode}` : ''}`} />
        <View style={{ height: 14 }} />
        <View style={styles.statsRow}>
          <StatTile label="On hand" value={onHand} />
          <StatTile label="Placed" value={inBins} />
          <StatTile label="Waiting" value={unassigned} highlight={unassigned > 0} />
        </View>
      </Card>

      <Card>
        <Text style={styles.section}>Details</Text>
        <DetailGrid>
          <DetailItem label="SKU" value={product.productCode} />
          <DetailItem label="Category" value={product.category || '—'} />
          <DetailItem label="UOM" value={product.uom || '—'} />
          <DetailItem label="Barcode" value={product.barcode || '—'} />
          <DetailItem label="On Hand" value={onHand} />
          <DetailItem label="Reserved" value={reserved} />
          <DetailItem label="Available" value={available} />
          <DetailItem label="Warehouse(s)" value={warehouses.length ? warehouses.join(', ') : '—'} />
          <DetailItem label="Rack / Bin Location(s)" value={binLocations || 'Not tracked'} />
          <DetailItem label="Stock Status" value={stockStatus} />
        </DetailGrid>
      </Card>

      <Card>
        <Text style={styles.section}>Current locations</Text>
        {bins.length === 0 ? (
          <Text style={styles.muted}>Not placed in any bin, rack, shelf, or zone yet.</Text>
        ) : (
          bins.map((b) => <Row key={b.location.id} label={`${binLabel(b.location)} (${locationNoun(b.location)})`} value={b.quantity} />)
        )}
      </Card>

      <Button title="ADD to a bin" onPress={() => navigation.navigate('Add', { productCode })} disabled={unassigned <= 0} />
      {unassigned <= 0 ? <Text style={styles.hint}>Nothing is waiting for a bin. Receive stock (GRN) in the ERP first.</Text> : null}
      <Button title="MOVE between bins" variant="secondary" onPress={() => navigation.navigate('Move', { productCode })} disabled={bins.length === 0} />
      <Button title="REMOVE stock" variant="danger" onPress={() => navigation.navigate('Remove', { productCode })} disabled={bins.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16, backgroundColor: colors.bg, flexGrow: 1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10 },
  code: { fontSize: 14, fontWeight: '500', color: colors.faint, marginTop: 2 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  muted: { color: colors.muted },
  hint: { color: colors.warn, fontSize: 14 },
  error: { color: colors.danger, padding: 24 },
});
