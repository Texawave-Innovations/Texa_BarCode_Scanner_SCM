import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Scanner } from '../components/Scanner';
import { Loading } from '../components/ui';
import { findBin, findProduct, unwrapScan } from '../data';
import { useSnapshot } from '../useSnapshot';
import type { RootStack } from '../navigation';

/** Scan a product (→ Add/Move screen) or a rack label (→ bin contents). */
export default function ScanScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'Scan'>) {
  const { purpose } = route.params;
  const { snap, error: loadError, reload } = useSnapshot();
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  if (!snap) return loadError ? <Scanner prompt="Offline" onScan={() => reload()} error={loadError} /> : <Loading text="Loading warehouse data…" />;

  const onScan = (raw: string) => {
    if (busy.current) return;
    if (purpose === 'product') {
      const product = findProduct(snap, raw);
      if (!product) {
        const asBin = findBin(snap, raw);
        setError('location' in asBin ? 'That is a rack/bin label. Scan a product barcode.' : `"${unwrapScan(raw).code}" is not a known product.`);
        return;
      }
      busy.current = true;
      setError(null);
      navigation.replace('Product', { productCode: product.productCode });
    } else {
      const bin = findBin(snap, raw);
      if (!('location' in bin)) {
        setError(findProduct(snap, raw) ? 'That is a product label. Scan a rack/bin label.' : bin.error);
        return;
      }
      busy.current = true;
      setError(null);
      navigation.replace('Bin', { locationId: bin.location.id });
    }
  };

  return <Scanner prompt={purpose === 'product' ? 'Scan the PRODUCT barcode' : 'Scan the RACK / BIN barcode'} onScan={onScan} error={error} />;
}
