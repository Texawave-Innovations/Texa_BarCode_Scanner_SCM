import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Loading, Row } from '../components/ui';
import { binContents, binLabel, locationNoun } from '../data';
import { colors } from '../theme';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

export default function BinScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Bin'>) {
  const { snap, error } = useSnapshot();
  if (!snap) return error ? <Text style={styles.error}>{error}</Text> : <Loading />;
  const loc = snap.locations.find((l) => l.id === route.params.locationId);
  if (!loc) return <Text style={styles.error}>Location not found.</Text>;
  const { rows, occupied } = binContents(snap, loc);
  const noun = locationNoun(loc);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <Text style={styles.name}>{binLabel(loc)}</Text>
        <Row label="Product types" value={rows.length} />
        <Row label={`Units in ${noun}`} value={occupied} />
        {loc.capacity ? <Row label="Capacity" value={`${occupied} / ${loc.capacity} ${loc.capacityUnit || ''}`} /> : null}
      </Card>
      <Card>
        <Text style={styles.section}>Products</Text>
        {rows.length === 0 ? (
          <Text style={{ color: colors.muted }}>This {noun} is empty.</Text>
        ) : (
          rows.map((r, i) => (
            <View key={r.product.productCode} style={[styles.productRow, i > 0 && styles.productRowDivider]}>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{r.product.name}</Text>
                <Text style={styles.productMeta}>
                  {r.product.productCode} · {r.quantity}{r.product.uom ? ` ${r.product.uom}` : ' unit(s)'}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.moveChip, pressed && { opacity: 0.6 }]}
                onPress={() => navigation.navigate('Move', { productCode: r.product.productCode, sourceLocationId: loc.id })}
              >
                <Text style={styles.moveChipText}>Move ›</Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.bg, flexGrow: 1 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  error: { color: colors.danger, padding: 24 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  productRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '700', color: colors.text },
  productMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  moveChip: { backgroundColor: colors.bg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  moveChipText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
