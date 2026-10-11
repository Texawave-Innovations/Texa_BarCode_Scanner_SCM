import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { useSession } from '../session';
import { colors } from '../theme';
import type { RootStack } from '../navigation';

export default function HomeScreen({ navigation }: NativeStackScreenProps<RootStack, 'Home'>) {
  const { user, setUser } = useSession();
  return (
    <View style={styles.wrap}>
      <Text style={styles.hello}>Hi, {user?.name}</Text>
      <Text style={styles.sub}>What do you want to do?</Text>
      <View style={{ gap: 14, marginTop: 24 }}>
        <Button title="Scan Product  (Add / Move)" onPress={() => navigation.navigate('Scan', { purpose: 'product' })} style={styles.big} />
        <Button title="Check Bin" variant="secondary" onPress={() => navigation.navigate('Scan', { purpose: 'bin' })} style={styles.big} />
        <Button title="Find Product (search)" variant="secondary" onPress={() => navigation.navigate('Search')} style={styles.big} />
      </View>
      <View style={{ flex: 1 }} />
      <Button title="Sign out" variant="secondary" onPress={() => setUser(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  hello: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 16, color: colors.muted, marginTop: 4 },
  big: { minHeight: 68 },
});
