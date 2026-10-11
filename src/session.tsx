import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppUser } from './types';

const KEY = 'texawave_scanner_user';
interface Ctx { user: AppUser | null; ready: boolean; setUser: (u: AppUser | null) => void }
const SessionContext = createContext<Ctx>({ user: null, ready: false, setUser: () => {} });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setUserState(JSON.parse(v)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setUser = (u: AppUser | null) => {
    setUserState(u);
    (u ? AsyncStorage.setItem(KEY, JSON.stringify(u)) : AsyncStorage.removeItem(KEY)).catch(() => {});
  };
  return <SessionContext.Provider value={{ user, ready, setUser }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
