import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; loading?: boolean; style?: ViewStyle;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.card;
  const fg = variant === 'secondary' ? colors.primary : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, borderColor: variant === 'secondary' ? colors.primary : bg }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'ok' }: { label: string; tone?: 'ok' | 'off' }) {
  const dot = tone === 'ok' ? colors.success : colors.faint;
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: dot }]} />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function Pill({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
      {onPress ? (
        <Pressable style={styles.pillArrow} onPress={onPress}>
          <Text style={styles.pillArrowText}>→</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  return (
    <View style={styles.detailGrid}>
      <View style={styles.detailCol}>{left}</View>
      <View style={styles.detailCol}>{right}</View>
    </View>
  );
}

export function StatTile({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={[styles.statTile, highlight && styles.statTileHighlight]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.muted, marginTop: 12 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1.5 },
  btnText: { fontSize: 17, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.bg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, gap: 6 },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingVertical: 10, paddingLeft: 14, paddingRight: 6 },
  pillText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  pillArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  pillArrowText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  statTile: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 4 },
  statTileHighlight: { backgroundColor: colors.bg },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '800' },
  detailGrid: { flexDirection: 'row', gap: 16 },
  detailCol: { flex: 1, gap: 12 },
  detailItem: { gap: 2 },
  detailLabel: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  detailValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
