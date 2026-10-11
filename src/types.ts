export interface AppUser {
  username: string;
  name: string;
  role: string;
  firebaseKey: string;
}

export interface Product {
  productCode: string;
  name: string;
  barcode?: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  locationCode?: string;
  binCode: string;
  locationName?: string;
  locationType?: string;
  capacity?: number;
  capacityUnit?: string;
  status: 'Active' | 'Inactive';
}

export interface StockBalance {
  productCode: string;
  warehouseId: string;
  onHand: number;
}

export interface PutawayItem {
  productCode: string;
  productName: string;
  quantity: number;
  destinationLocationId: string;
}
export interface Putaway {
  warehouseId: string;
  status: string;
  items: PutawayItem[];
}

export interface Movement {
  warehouseId: string;
  status: string;
  sourceLocationId: string;
  destinationLocationId: string;
  items: { productCode: string; quantity: number }[];
}

export interface Picking {
  warehouseId: string;
  status: string;
  fulfillmentId?: string;
  stockIssuedAt?: number;
  items: { productCode: string; pickedQuantity: number; sourceLocationId?: string }[];
}

export interface Snapshot {
  products: Product[];
  locations: Location[];
  balances: StockBalance[];
  putaways: Putaway[];
  movements: Movement[];
  pickings: Picking[];
}
