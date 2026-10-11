import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Loading } from '../components/ui';
import { colors } from '../theme';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

export default function SearchScreen({ navigation }: NativeStackScreenProps<RootStack, 'Search'>) {
  const { snap, error } = useSnapshot();
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    if (!snap) return [];
    const needle = q.trim().toLowerCase();
    const list = needle ? snap.products.filter((p) => p.name.toLowerCase().includes(needle) || p.productCode.toLowerCase().includes(needle)) : snap.products;
    return list.slice(0, 100);
  }, [snap, q]);

  if (!snap) return error ? <Text style={styles.error}>{error}</Text> : <Loading />;
  return (
    <View style={styles.wrap}>
      <TextInput style={styles.input} placeholder="Search by name or SKU" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} autoCorrect={false} />
      <FlatList
        data={results}
        keyExtractor={(p) => p.productCode}
        ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('Product', { productCode: item.productCode })}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.code}>{item.productCode}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: colors.bg },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 17, backgroundColor: colors.card, color: colors.text, marginBottom: 12 },
  item: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  code: { fontSize: 14, color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
  error: { color: colors.danger, padding: 24 },
});
