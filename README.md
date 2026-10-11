# TexaWave Scanner (React Native / Expo)

Mobile barcode app for the ERP's SCM warehouse. Uses the same Firebase Realtime Database and the
same ERP logins as the web app.

## Run
```
npm install
npx expo start        # scan the QR with Expo Go (Android/iOS), same Wi-Fi
```

## Flow
- **Scan Product** -> shows name, on-hand, bins, units "waiting for a bin" -> **ADD** or **MOVE**
  - **ADD**: scan rack/bin label -> quantity (max = units not yet in any bin) -> saves a COMPLETED
    putaway (`scm/warehouse/putaways`, grnId `MOBILE`).
  - **MOVE**: source bin (auto if the product is in one bin, else scan) -> scan destination bin ->
    quantity (max = qty in source) -> saves a COMPLETED bin-to-bin movement (`scm/warehouse/movements`).
- **Check Bin**: scan a rack label -> products and quantities in it.
- **Find Product**: search by name/SKU when a label is damaged.

Bin quantities are derived exactly like the web app (`computeLocationStock`): completed putaways +
completed movements - issued picks. Product/bin codes resolve like the web barcode module
(assigned barcode or productCode; `locationCode`, else a unique `binCode`; JSON QR payloads too).

## Notes
- Single warehouse: the warehouse is taken from the scanned bin's `warehouseId`.
- Batch/serial tracking, offline queueing and picking/cycle count are not in v1.
- Document numbers are `MOB/PUT/<timestamp>` and `MOB/MOV/<timestamp>` (they do not consume the
  web app's financial-year counters).
