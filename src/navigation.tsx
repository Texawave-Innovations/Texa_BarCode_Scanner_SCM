import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Loading } from './components/ui';
import AddScreen from './screens/AddScreen';
import BinScreen from './screens/BinScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import MoveScreen from './screens/MoveScreen';
import ProductScreen from './screens/ProductScreen';
import ScanScreen from './screens/ScanScreen';
import SearchScreen from './screens/SearchScreen';
import { useSession } from './session';

export type RootStack = {
  Login: undefined;
  Home: undefined;
  Scan: { purpose: 'product' | 'bin' };
  Search: undefined;
  Product: { productCode: string };
  Bin: { locationId: string };
  Add: { productCode: string };
  Move: { productCode: string; sourceLocationId?: string };
};

const Stack = createNativeStackNavigator<RootStack>();

export default function Navigation() {
  const { user, ready } = useSession();
  if (!ready) return <Loading />;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TexaWave Scanner' }} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Find product' }} />
            <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Product' }} />
            <Stack.Screen name="Bin" component={BinScreen} options={{ title: 'Bin' }} />
            <Stack.Screen name="Add" component={AddScreen} options={{ title: 'Add to bin' }} />
            <Stack.Screen name="Move" component={MoveScreen} options={{ title: 'Move' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
