import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card, Loading, Row } from '../components/ui';
import { binContents, binLabel } from '../data';
import { colors } from '../theme';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

export default function BinScreen({ route }: NativeStackScreenProps<RootStack, 'Bin'>) {
  const { snap, error } = useSnapshot();
  if (!snap) return error ? <Text style={styles.error}>{error}</Text> : <Loading />;
  const loc = snap.locations.find((l) => l.id === route.params.locationId);
  if (!loc) return <Text style={styles.error}>Bin not found.</Text>;
  const { rows, occupied } = binContents(snap, loc);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <Text style={styles.name}>{binLabel(loc)}</Text>
        <Row label="Units in bin" value={occupied} />
        {loc.capacity ? <Row label="Capacity" value={`${occupied} / ${loc.capacity} ${loc.capacityUnit || ''}`} /> : null}
      </Card>
      <Card>
        <Text style={styles.section}>Products</Text>
        {rows.length === 0 ? <Text style={{ color: colors.muted }}>This bin is empty.</Text> : rows.map((r) => <Row key={r.product.productCode} label={`${r.product.name} (${r.product.productCode})`} value={r.quantity} />)}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.bg, flexGrow: 1 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  error: { color: colors.danger, padding: 24 },
});
