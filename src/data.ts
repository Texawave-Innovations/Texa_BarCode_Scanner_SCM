import { get, push, ref, set } from 'firebase/database';
import { database } from './firebase';
import type { AppUser, Location, Movement, Picking, Product, Putaway, Snapshot, StockBalance } from './types';

// Paths shared with the ERP web app (see SCM/src/modules/scm/**/…Paths.ts).
const PATHS = {
  products: 'sales/products',
  settings: 'scm/inventory/settings',
  locations: 'scm/locations',
  balances: 'scm/inventory/stockBalances',
  putaways: 'scm/warehouse/putaways',
  movements: 'scm/warehouse/movements',
  pickings: 'scm/warehouse/pickings',
  users: 'users',
  privileges: 'settings/privileges',
};

type Loose = Record<string, unknown>;

async function readList<T = Loose>(path: string): Promise<(T & { id: string })[]> {
  const snap = await get(ref(database, path));
  if (!snap.exists()) return [];
  const val = snap.val();
  if (Array.isArray(val)) return val.filter(Boolean) as (T & { id: string })[];
  return Object.entries(val).map(([id, v]) => ({ ...(v as object), id: (v as Loose)?.id ?? id })) as (T & { id: string })[];
}

function pick(obj: Loose | undefined, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return undefined;
}

/** Same flattening as the web app's getSellableProducts(): parent records hold items[] that
 *  carry the real SKU; a few legacy records are flat. */
function flattenProducts(raw: Loose[], barcodes: Map<string, string>): Product[] {
  const out: Product[] = [];
  const seen = new Set<string>();
  const add = (code: string, name: string) => {
    if (seen.has(code)) return;
    seen.add(code);
    out.push({ productCode: code, name, barcode: barcodes.get(code) });
  };
  for (const p of raw) {
    const items = Array.isArray(p.items) ? (p.items as Loose[]) : null;
    if (items && items.length > 0) {
      items.forEach((item, idx) => {
        const code = pick(item, ['productCode', 'sku', 'itemCode']) || `${p.id}-${idx + 1}`;
        const name = items.length > 1 ? `${p.name} — ${code}` : String(p.name || code);
        add(code, name);
      });
    } else {
      const code = pick(p, ['productCode', 'sku']) || String(p.id);
      add(code, String(p.name || code));
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadSnapshot(): Promise<Snapshot> {
  const [rawProducts, settings, locations, balances, putaways, movements, pickings] = await Promise.all([
    readList(PATHS.products),
    readList(PATHS.settings),
    readList<Location>(PATHS.locations),
    readList<StockBalance>(PATHS.balances),
    readList<Putaway>(PATHS.putaways),
    readList<Movement>(PATHS.movements),
    readList<Picking>(PATHS.pickings),
  ]);
  const barcodes = new Map<string, string>();
  for (const s of settings) {
    const code = pick(s, ['productCode']);
    const bc = pick(s, ['barcode']);
    if (code && bc) barcodes.set(code, bc.trim());
  }
  return {
    products: flattenProducts(rawProducts, barcodes),
    locations: locations.filter((l) => (l.locationType || 'BIN') === 'BIN'),
    balances,
    putaways: putaways.map((p) => ({ ...p, items: p.items || [] })),
    movements: movements.map((m) => ({ ...m, items: m.items || [] })),
    pickings: pickings.map((p) => ({ ...p, items: p.items || [] })),
  };
}

// ---------------------------------------------------------------------------
// Scan resolution
// ---------------------------------------------------------------------------
const norm = (s: string | undefined | null) => (s || '').trim().toLowerCase();

/** A QR made by the web app encodes {scm:1,type,code}; linear barcodes are plain text. */
export function unwrapScan(raw: string): { code: string; type?: string } {
  const text = raw.trim();
  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text);
      if (obj?.scm === 1 && typeof obj.code === 'string') return { code: obj.code, type: obj.type };
    } catch {
      /* plain text */
    }
  }
  return { code: text };
}

export function findProduct(snap: Snapshot, raw: string): Product | undefined {
  const { code } = unwrapScan(raw);
  return snap.products.find((p) => norm(p.barcode) === norm(code) || norm(p.productCode) === norm(code));
}

export type BinMatch = { location: Location } | { error: string };

export function findBin(snap: Snapshot, raw: string): BinMatch {
  const { code } = unwrapScan(raw);
  const byFull = snap.locations.filter((l) => norm(l.locationCode) === norm(code));
  const matches = byFull.length ? byFull : snap.locations.filter((l) => norm(l.binCode) === norm(code));
  if (matches.length === 0) return { error: `"${code}" is not a known bin or rack code.` };
  if (matches.length > 1) return { error: `"${code}" matches several bins. Scan the full location code label.` };
  if (matches[0].status !== 'Active') return { error: `${binLabel(matches[0])} is inactive.` };
  return { location: matches[0] };
}

export const binLabel = (l: Location | undefined) => (l ? l.locationCode || l.binCode || l.locationName || l.id : '—');

// ---------------------------------------------------------------------------
// Bin stock (mirrors computeLocationStock in warehouseHelpers.ts)
// ---------------------------------------------------------------------------
export function computeBinStock(snap: Snapshot): Map<string, number> {
  const map = new Map<string, number>();
  const key = (p: string, w: string, l: string) => `${p}__${w}__${l}`;
  const add = (k: string, d: number) => map.set(k, (map.get(k) || 0) + d);
  for (const p of snap.putaways) {
    if (p.status !== 'COMPLETED') continue;
    for (const i of p.items) add(key(i.productCode, p.warehouseId, i.destinationLocationId), i.quantity);
  }
  for (const m of snap.movements) {
    if (m.status !== 'COMPLETED') continue;
    for (const i of m.items) {
      add(key(i.productCode, m.warehouseId, m.sourceLocationId), -i.quantity);
      add(key(i.productCode, m.warehouseId, m.destinationLocationId), i.quantity);
    }
  }
  for (const pk of snap.pickings) {
    const issued = pk.fulfillmentId ? !!pk.stockIssuedAt && pk.status !== 'CANCELLED' : pk.status === 'COMPLETED' || pk.status === 'PARTIALLY_PICKED';
    if (!issued) continue;
    for (const i of pk.items) {
      if (!i.sourceLocationId || i.pickedQuantity <= 0) continue;
      add(key(i.productCode, pk.warehouseId, i.sourceLocationId), -i.pickedQuantity);
    }
  }
  return map;
}

export function stockInBin(stock: Map<string, number>, productCode: string, loc: Location): number {
  return Math.max(0, stock.get(`${productCode}__${loc.warehouseId}__${loc.id}`) || 0);
}

export interface BinLine { location: Location; quantity: number }

/** Every bin currently holding the product, plus on-hand not yet assigned to any bin. */
export function productPlacement(snap: Snapshot, productCode: string) {
  const stock = computeBinStock(snap);
  const bins: BinLine[] = [];
  for (const loc of snap.locations) {
    const q = stockInBin(stock, productCode, loc);
    if (q > 0) bins.push({ location: loc, quantity: q });
  }
  bins.sort((a, b) => binLabel(a.location).localeCompare(binLabel(b.location)));
  const onHand = snap.balances.filter((b) => b.productCode === productCode).reduce((s, b) => s + (b.onHand || 0), 0);
  const inBins = bins.reduce((s, b) => s + b.quantity, 0);
  return { bins, onHand, inBins, unassigned: Math.max(0, onHand - inBins) };
}

export function binContents(snap: Snapshot, loc: Location) {
  const stock = computeBinStock(snap);
  const rows: { product: Product; quantity: number }[] = [];
  for (const product of snap.products) {
    const q = stockInBin(stock, product.productCode, loc);
    if (q > 0) rows.push({ product, quantity: q });
  }
  return { rows, occupied: rows.reduce((s, r) => s + r.quantity, 0) };
}

function capacityError(snap: Snapshot, loc: Location, addQty: number): string | null {
  if (!loc.capacity) return null;
  const { occupied } = binContents(snap, loc);
  return occupied + addQty > loc.capacity
    ? `${binLabel(loc)} is at capacity (${occupied}/${loc.capacity} ${loc.capacityUnit || ''}). Cannot fit ${addQty} more.`
    : null;
}

// ---------------------------------------------------------------------------
// Writes — same records the web app creates, already in COMPLETED state
// ---------------------------------------------------------------------------
const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

async function audit(basePath: string, id: string, action: string, by: string, details: string) {
  try {
    await push(ref(database, `${basePath}/${id}/auditLogs`), { action, performedBy: by, details, timestamp: Date.now() });
  } catch {
    /* audit must never fail the action */
  }
}

/** ADD: assign unassigned on-hand stock of a product to a bin. */
export async function addToBin(snap: Snapshot, user: AppUser, product: Product, loc: Location, qty: number) {
  if (!(qty > 0) || !Number.isInteger(qty)) throw new Error('Enter a whole quantity greater than zero.');
  const { unassigned } = productPlacement(snap, product.productCode);
  if (qty > unassigned) throw new Error(`Only ${unassigned} unit(s) of ${product.productCode} are waiting for a bin.`);
  const capErr = capacityError(snap, loc, qty);
  if (capErr) throw new Error(capErr);

  const newRef = push(ref(database, PATHS.putaways));
  const number = `MOB/PUT/${stamp()}`;
  const now = Date.now();
  await set(newRef, {
    id: newRef.key,
    putawayNumber: number,
    grnId: 'MOBILE',
    grnNumber: 'Mobile scan',
    warehouseId: loc.warehouseId,
    items: [{ productCode: product.productCode, productName: product.name, quantity: qty, destinationLocationId: loc.id }],
    status: 'COMPLETED',
    assignedBy: user.name,
    completedBy: user.name,
    createdBy: user.name,
    createdAt: now,
    completedAt: now,
    notes: 'Created from the mobile barcode app',
  });
  await audit(PATHS.putaways, newRef.key as string, 'Putaway completed (mobile)', user.name, `${number}: ${qty} × ${product.productCode} → ${binLabel(loc)}`);
  return number;
}

/** MOVE: shift stock of a product from one bin to another. */
export async function moveBetweenBins(snap: Snapshot, user: AppUser, product: Product, from: Location, to: Location, qty: number) {
  if (!(qty > 0) || !Number.isInteger(qty)) throw new Error('Enter a whole quantity greater than zero.');
  if (from.id === to.id) throw new Error('Source and destination bin are the same.');
  if (from.warehouseId !== to.warehouseId) throw new Error('Bins belong to different warehouses.');
  const available = stockInBin(computeBinStock(snap), product.productCode, from);
  if (qty > available) throw new Error(`Only ${available} unit(s) of ${product.productCode} are in ${binLabel(from)}.`);
  const capErr = capacityError(snap, to, qty);
  if (capErr) throw new Error(capErr);

  const newRef = push(ref(database, PATHS.movements));
  const number = `MOB/MOV/${stamp()}`;
  const now = Date.now();
  await set(newRef, {
    id: newRef.key,
    movementNumber: number,
    movementType: 'BIN_TO_BIN',
    warehouseId: from.warehouseId,
    sourceLocationId: from.id,
    destinationLocationId: to.id,
    items: [{ productCode: product.productCode, productName: product.name, quantity: qty }],
    status: 'COMPLETED',
    requestedBy: user.name,
    approvedBy: user.name,
    completedBy: user.name,
    createdAt: now,
    completedAt: now,
    notes: 'Created from the mobile barcode app',
  });
  await audit(PATHS.movements, newRef.key as string, 'Movement completed (mobile)', user.name, `${number}: ${qty} × ${product.productCode} ${binLabel(from)} → ${binLabel(to)}`);
  return number;
}

// ---------------------------------------------------------------------------
// Login — same check as the web app's AuthContext (users/* matched on email or username)
// ---------------------------------------------------------------------------
const DEFAULT_SCM_ROLES = ['admin', 'manager'];

export async function login(identifier: string, password: string): Promise<AppUser> {
  const snap = await get(ref(database, PATHS.users));
  if (!snap.exists()) throw new Error('Invalid credentials.');
  const users = snap.val() as Record<string, Loose>;
  const id = identifier.trim();
  for (const [key, rec] of Object.entries(users)) {
    if ((rec.email === id || rec.username === id) && rec.password === password) {
      const role = String(rec.role || 'employee');
      let allowed = DEFAULT_SCM_ROLES.includes(role);
      try {
        const priv = await get(ref(database, `${PATHS.privileges}/${role}`));
        if (priv.exists()) allowed = (priv.val() as string[]).includes('scm') || allowed;
      } catch {
        /* fall back to defaults */
      }
      if (!allowed) throw new Error('Your role does not have SCM access.');
      return { username: String(rec.username || id), name: String(rec.name || rec.username || id), role, firebaseKey: key };
    }
  }
  throw new Error('Invalid credentials.');
}
