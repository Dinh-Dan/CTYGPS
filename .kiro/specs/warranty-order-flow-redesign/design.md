# Design Document

## Overview

This design redesigns how warranty order state is **presented** and **acted upon**, while reusing the
existing physical data model (`order_warranty_meta`, `order_warranty_items`, `order_warranty_moves`,
`supplier_warranty_batches`). The internal per-item stage machine in
`BE/src/utils/orderWarranty.js` remains the single source of physical truth. On top of it we add a
pure **derivation layer** (Warranty_State_Service) that collapses the seven internal stages into four
operator-facing Display_States, and we change the API surface so that:

- The admin / CSKH view is read-only for warranty handling (the "Trả về công ty" /
  `move_to_company_stock` order-step button and all other stage-advancing buttons are removed from
  that view).
- The technician (KTV) view keeps action capability, offering moves based on the current stage +
  handling type rather than a forced step chain.
- Stock movements (túi KTV ↔ kho bảo hành công ty ↔ NCC) are driven from the admin
  Warranty_Stock_Page as standalone actions that still update the order state.
- A new "Giao thiết bị mới cho khách" flow lets an order in `Chờ xử lý` be resolved by delivering a
  replacement device, sourced from túi KTV or from store stock (with a full export receipt).

The redesign is **additive and non-destructive**: no internal stage is removed, no move history is
deleted, and Display_State is computed (not stored as a competing source of truth), so existing
orders map cleanly without data entry.

### Goals

- One deterministic Display_State per order, plus a per-item Display_State.
- A timeline view derived from `order_warranty_moves`, replacing the 6-step stepper.
- Clear separation between order lifecycle and stock handling.

### Non-Goals

- Changing the supplier batch (NCC) batching mechanism itself.
- Reworking pricing / `order_charges` beyond what existing move logic already does.
- Frontend visual design (only component responsibilities and API contracts are specified here, since
  the frontend is not in this repository tree).

## Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │          order_warranty_items                │
                 │  current_status (Item_Stage = source of truth)│
                 └───────────────┬─────────────────────────────┘
                                 │ read-only derivation
                                 ▼
                 ┌─────────────────────────────────────────────┐
                 │        Warranty_State_Service (NEW)          │
                 │  deriveItemDisplayState(item) → Display_State│
                 │  deriveOrderDisplayState(items) → Display_State│
                 └───────────────┬─────────────────────────────┘
                                 │ injected into
                                 ▼
        ┌───────────────────────────────────────────────────────────────┐
        │ loadWarrantyDetail() → { meta(display_state), items(display_state),│
        │                          timeline[] }                            │
        └──────────┬───────────────────────┬───────────────────┬──────────┘
                   ▼                        ▼                   ▼
          Technician_View          Admin_View (read-only)  Warranty_Stock_Page
          (KTV moves +             (timeline + meta edit)  (decoupled stock moves)
           deliver-device)
```

The derivation functions are **pure** (no DB writes), so they can run during read (`loadWarrantyDetail`)
and during the migration scan without side effects. Every action that mutates an Item_Stage continues
to call `syncWarrantyOrderState`, which is extended to also recompute and persist the order's
Display_State for fast list filtering.

## Stage → Display_State Mapping

The four Display_States are derived from the seven internal Item_Stages. Cancelled items are excluded
from order-level derivation.

| Item_Stage (`current_status`) | Per-item Display_State | Notes |
|-------------------------------|------------------------|-------|
| `intake`                      | `Đang xử lý`           | Product still at customer, work started |
| `technician_holding`          | `Chờ xử lý` *(if no replacement reserved)* / `Đang xử lý` *(if replacement reserved)* | In túi KTV, awaiting decision |
| `company_warranty_stock`      | `Chờ xử lý` *(if no replacement reserved)* / `Đang xử lý` | In company warranty warehouse |
| `sent_to_supplier`            | `Đang gửi NCC`         | At supplier |
| `supplier_returned`           | `Đang gửi NCC`         | Returned from supplier, awaiting delivery |
| `delivered`                   | `Giao KH`              | Customer resolved |
| `cancelled`                   | *(excluded)*           | Ignored in derivation |

"Replacement reserved" means `replacement_source_scope` is set and `replacement_product_id` +
`replacement_staff_id` are present (matches the existing `buildWarrantyItemActions` condition for
`deliver_to_customer`).

### Order-level derivation algorithm (Warranty_State_Service)

```
function deriveOrderDisplayState(items):
    active = items where current_status != 'cancelled'
    if active is empty:                       return 'Đang xử lý'      # all cancelled / no items (R1.5)
    if every active item is 'delivered'
       OR every active item is delivered-equivalent:  return 'Giao KH'  # R1.2, R8.3
    if any active item in {sent_to_supplier, supplier_returned}: return 'Đang gửi NCC'  # R1.3
    if any active item in {technician_holding, company_warranty_stock}
       AND that item has no replacement reserved:      return 'Chờ xử lý'  # R1.4
    return 'Đang xử lý'                                                    # R1.5 catch-all
```

"delivered-equivalent" covers legacy rows where `customer_status = 'completed'` but
`current_status` is not yet `delivered`/`cancelled` (R8.3). The evaluation order encodes the fixed
precedence `Giao KH > Đang gửi NCC > Chờ xử lý > Đang xử lý` (R1.6) so the result is always a single
state.

## Components and Interfaces

### 1. Warranty_State_Service (`BE/src/utils/orderWarranty.js`)

New pure helpers added and exported:

```js
const ITEM_DISPLAY_STATE = {
  intake: 'processing',
  technician_holding: 'pending_or_processing',   // refined by replacement check
  company_warranty_stock: 'pending_or_processing',
  sent_to_supplier: 'supplier',
  supplier_returned: 'supplier',
  delivered: 'delivered',
  cancelled: null,
};

// Display_State codes: 'pending' | 'processing' | 'supplier' | 'delivered'
// with Vietnamese labels: Chờ xử lý | Đang xử lý | Đang gửi NCC | Giao KH

function hasReplacementReserved(item)        // -> bool
function deriveItemDisplayState(item)         // -> { code, label }   (R1.8)
function deriveOrderDisplayState(items)       // -> { code, label }   (R1.1–R1.7)
```

- `deriveItemDisplayState` and `deriveOrderDisplayState` perform no DB access.
- `loadWarrantyDetail` is extended to attach `display_state` to each item and to `meta`, and to expose
  `meta.timeline_empty` when there are zero moves (R2.6).

### 2. Timeline (read model)

`loadWarrantyDetail` already returns `moves` sorted `ORDER BY mv.occurred_at DESC, mv.id DESC`
(matches R2.1). We formalise the timeline shape returned to clients:

```jsonc
"timeline": [
  {
    "id": 123,
    "action_code": "deliver_to_customer",
    "action_label": "Giao thiết bị cho khách",   // mapped server-side
    "actor_name": "Nguyễn Văn A",                 // created_by_name
    "occurred_at": "2026-06-07T10:30:00",
    "note_text": "..."                            // omitted when null (R2.3 / R2.4)
  }
]
```

- A server-side `ACTION_LABELS` map produces `action_label` (the existing label maps in
  `kithuat.js` / `admin/orders.js` are consolidated into `orderWarranty.js` and reused).
- When `note_text` is null/empty the field is omitted (no placeholder) — R2.4.
- The stepper concept is removed from responses; clients render `timeline` only (R2.3, R2.5).

### 3. Admin_View — read-only enforcement (`BE/src/routes/admin/orders.js`)

| Route | Current | New |
|-------|---------|-----|
| `GET /:id/warranty` | returns detail | unchanged (now includes `display_state` + timeline) |
| `PUT /:id/warranty` | edits meta **and** `items` (can advance stage) | **restricted to metadata only**: order address, `progress_note`/order note, and `meta.note_text` + `warranty_mode` + `default_supplier_id`. The `items` branch (`replaceWarrantyItems`) is **removed** from the admin route. (R3.1, R3.4, R3.5, R3.6) |
| `POST /:id/warranty/moves` | creates stage-advancing move | **removed / guarded**: returns `403` with an "action not permitted for admin" error and changes nothing (R3.2, R3.3) |

- Metadata validation enforces bounds: address 1–255, order note 0–1000, warranty note 0–1000 (R3.4);
  out-of-bounds → `400` validation error naming the field, no change persisted (R3.6).
- Item/stage editing stays available where structurally needed (order creation/approval flow in
  `POST .../approve`), which is not the admin warranty-handling view and is out of scope for the
  read-only rule.

### 4. Technician_View — action capability (`BE/src/routes/kithuat.js`)

- `POST /orders/:id/warranty/moves` is kept. `loadAssignedWarrantyOrderRow` already enforces that the
  caller is the assigned KTV and the order is a warranty order (R4.1, R4.3 — returns 404/409 for
  non-owners).
- `createWarrantyMove` already calls `validateWarrantyMoveAction`, which rejects moves invalid for the
  current stage (R4.4). We additionally cross-check the requested `action_code` against
  `buildWarrantyItemActions(item)` (the offered set) and reject with a clear "move not valid for
  current stage" error if absent (R4.4). Rejections occur before any write, leaving stage + timeline
  unchanged.
- `buildWarrantyItemActions` (already stage + handling-type driven) is the single source for offered
  moves returned via each item's `available_actions` (R4.5). No predefined ordered chain is required.

### 5. Handling type behaviours (`deriveWarrantyMoveState` / `createWarrantyMove`)

The existing switch already implements most of this; the design pins the contract per handling type:

- **`tech_fix`** — `mark_fixed`: atomic set `current_status = 'delivered'`, `customer_status = 'completed'`
  (R5.1). Missing required fix detail → reject, no change (R5.2, enforced by
  `validateWarrantyMoveAction` + payload validation).
- **`exchange`** — deliver replacement from túi KTV: atomic set `customer_status = 'completed'`; the
  faulty unit is recorded as a separate move back into túi KTV (`technician_holding`) — this is the
  existing `deliver_to_customer` "isExchangeLeftover" branch (R5.3). No replacement available in túi
  KTV → `consumeTechnicianHolding` throws insufficient-stock, nothing changes (R5.4).
- **`supplier_return` (no product brought)** — `receive_from_customer` recalls product into túi KTV →
  `technician_holding`; order Display_State resolves to `Chờ xử lý` (R5.5).
- **Fourth path (no-product recall)** — same recall-into-túi-KTV behaviour and `Chờ xử lý` resolution
  (R5.6). Implemented by routing this handling choice through the same `receive_from_customer` →
  `technician_holding` transition.
- Every stage-changing handling action writes a `order_warranty_moves` row capturing from/to + action
  (R5.7), as `createWarrantyMove` already does.

### 6. Deliver new device to customer (NEW)

New technician endpoint (the "Giao thiết bị mới cho khách" button shown only when order Display_State
is `Chờ xử lý`, R6.1):

```
POST /api/kithuat/orders/:id/warranty/deliver-device
Body: {
  warranty_item_id: number,
  replacement_product_id: number,
  qty: number,                 // integer 1..999999 (R6.2)
  from_technician_bag: boolean // the "lấy từ túi KTV" checkbox (R6.2)
}
```

Behaviour (single transaction):

1. Load + lock the warranty item (assigned-KTV check via `loadAssignedWarrantyOrderRow`).
2. Validate input: product selected and `1 ≤ qty ≤ 999999`, else `400` and no change (R6.3).
3. If `from_technician_bag === true`:
   - Require an assigned technician on the order, else `400` "no assigned technician", no change (R6.5).
   - `consumeTechnicianHolding(assigned_staff_id, replacement_product_id, qty)` — insufficient stock →
     `409`, no change (R6.4).
   - No export receipt (stock left the bag, which was already issued earlier).
4. If `from_technician_bag === false`:
   - Lock `product_stock`; if `quantity < qty` → `409`, no change, **no receipt created** (R6.6).
   - Deduct `product_stock` and create a full Export_Receipt via the existing
     `createReplacementReceipt` (`stock_receipts.kind = 'out'`, reason
     `warranty_customer_delivery`, + `stock_receipt_items`) (R6.5).
5. On success: set item `customer_status = 'completed'`, transition stage to `delivered`, record a
   `deliver_to_customer` move (R6.7), then `syncWarrantyOrderState`.

```
Operator        Technician_View        deliver-device endpoint        DB
   │ open Chờ xử lý order  │                     │                     │
   │──────────────────────▶│ show "Giao TB mới"  │                     │
   │ tick / untick "túi KTV"│                     │                     │
   │ confirm ──────────────▶│ POST deliver-device │                     │
   │                        │────────────────────▶│ BEGIN               │
   │                        │                     │ validate qty/product│
   │                        │                     │ checked? consume bag│
   │                        │                     │ unchecked? -stock + PX
   │                        │                     │ set completed + move│
   │                        │                     │ syncWarrantyOrderState
   │                        │                     │ COMMIT              │
   │◀───────────────────────│◀────────────────────│ detail(display_state)
```

### 7. Decoupled stock movements — Warranty_Stock_Page (`BE/src/routes/admin/warranty-batches.js`)

The admin "Hàng bảo hành trong kho" page performs stock movements independently of the order's
Display_State. These are **stock** actions, distinct from the removed order-step buttons, so they do
not violate the admin read-only rule for the order warranty panel.

- **Pull from túi KTV → kho bảo hành công ty** (NEW endpoint or extension of `queues`): for an item in
  `technician_holding`, apply the `move_to_company_stock` transition → `company_warranty_stock`,
  record exactly one `move_to_company_stock` move, recompute Display_State (R7.1, R7.2, R7.5, R7.6).
- **Send to supplier** (`POST /:id/send`): items → `sent_to_supplier`, one `send_to_supplier` move
  each (R7.3).
- **Receive from supplier** (`POST /:id/receive`): items → `supplier_returned`, one
  `receive_from_supplier` move each (R7.4).
- All movements run in a transaction; invalid source stage → reject with stage-transition error, no
  move recorded, stage unchanged (R7.7). Persistence failure → rollback to prior stage, no move
  recorded (R7.8).
- Each movement is standalone (no required preceding/following order-step action) (R7.6).

To honour R7, the shared move logic (`createWarrantyMove` / `deriveWarrantyMoveState`) is reused so a
stock action and the order timeline stay consistent through one code path.

### 8. Migration & backward compatibility

- **No destructive schema change.** Display_State is derived, so all existing orders resolve via
  `deriveOrderDisplayState` from stored data (R8.1).
- All `order_warranty_moves` are preserved untouched (R8.2).
- Legacy `customer_status = 'completed'` with non-`delivered` stage is treated as delivered for
  derivation (R8.3), handled by the "delivered-equivalent" rule.
- `current_location` and `customer_status` continue to be derived from Item_Stage via
  `deriveStageFields` (R8.4, R8.5) — consistent with migration 085.
- **New nullable column** `order_warranty_meta.needs_review TINYINT(1) NOT NULL DEFAULT 0` (added
  idempotently in `ensureWarrantySchema`). A backfill migration script
  (`migration_086_warranty_display_state.sql` + matching `scripts/run_migration_086.js`) scans
  existing warranty orders; any order whose data prevents derivation is left unchanged and flagged
  `needs_review = 1` for manual review, and the scan continues over remaining orders (R8.6).

## Data Models

Reused as-is: `order_warranty_items`, `order_warranty_moves`, `supplier_warranty_batches`,
`supplier_warranty_batch_items`, `stock_receipts`, `stock_receipt_items`, `staff_holdings`,
`product_stock`.

Changes:

- `order_warranty_meta`: add `needs_review TINYINT(1) NOT NULL DEFAULT 0` (manual-review flag, R8.6).
- `order_warranty_meta.current_stage`: continues to be written by `syncWarrantyOrderState`; the
  derived Display_State is computed on read and (optionally) cached for list filtering. No enum
  change required.

No columns are dropped. Display_State is **not** stored as an authoritative field — it is derived to
avoid a second source of truth competing with Item_Stage.

## Error Handling

| Condition | Response | State effect |
|-----------|----------|--------------|
| Admin submits stage-advancing move (R3.3) | `403` not permitted for admin | none |
| Admin metadata out of bounds (R3.6) | `400` naming the field | none |
| Technician not assigned (R4.3) | `404` / `409` | none |
| Move not in offered set (R4.4) | `409` invalid for current stage | none |
| `tech_fix` missing fix details (R5.2) | `400` missing details | none |
| `exchange` no replacement in bag (R5.4) | `409` insufficient | none |
| deliver-device invalid qty/product (R6.3) | `400` invalid input | none |
| deliver-device no assigned tech, bag chosen (R6.5) | `400` no technician | none |
| deliver-device bag/store insufficient (R6.4, R6.6) | `409` insufficient | none; no receipt |
| stock move invalid source stage (R7.7) | `409` invalid transition | none |
| stock move persistence failure (R7.8) | `500` after rollback | rolled back |

All mutating endpoints wrap work in `conn.beginTransaction()` / `commit` / `rollback` (existing
pattern), guaranteeing the "no partial change" guarantees above.

## Correctness Properties

These invariants must hold for any sequence of operations and are the basis for property-based and
regression testing.

### Property 1: Single Display_State

`deriveOrderDisplayState` always returns exactly one of
`{Chờ xử lý, Đang xử lý, Đang gửi NCC, Giao KH}` for any set of items, including empty and
all-cancelled sets.

**Validates: Requirements 1.1, 1.5, 1.6**

### Property 2: Derivation purity and idempotence

Calling the derivation functions any number of times on the same item data yields the same result and
performs no DB writes.

**Validates: Requirements 1.1, 8.1**

### Property 3: Single source of truth

For every item, `current_location` and `customer_status` equal the values implied by `current_status`
via `deriveStageFields`; no code path persists a conflicting pair.

**Validates: Requirements 8.4, 8.5**

### Property 4: Move/stage consistency

Every Item_Stage change is accompanied by exactly one `order_warranty_moves` row, and every recorded
move references a real from/to transition; no stage changes without a move and no move without an
actual recorded transition.

**Validates: Requirements 5.7, 7.2, 7.3, 7.4**

### Property 5: Atomicity

For any rejected action (validation, authorization, insufficient stock), the item stage,
`customer_status`, stock tables, and timeline are all unchanged, and no Export_Receipt is created.

**Validates: Requirements 3.3, 4.4, 5.2, 5.4, 6.3, 6.4, 6.6, 7.7, 7.8**

### Property 6: Stock conservation

A deliver-device or stock move never produces negative `staff_holdings.qty` or
`product_stock.quantity`; quantity removed from a source equals quantity added to the destination (or
recorded on an Export_Receipt).

**Validates: Requirements 6.4, 6.6, 6.7, 7.2**

### Property 7: History preservation

No operation in this feature deletes or mutates an existing `order_warranty_moves` row; the
post-migration move count equals the pre-migration count.

**Validates: Requirements 8.2**

### Property 8: Admin non-mutation

No Admin_View request can change any Item_Stage, per-item Display_State, or order Display_State.

**Validates: Requirements 3.1, 3.2, 3.3**

## Testing Strategy

- **Unit tests** for the pure derivation functions: every stage → expected Display_State; precedence
  cases (mixed stages), all-cancelled → `Đang xử lý`, all-delivered → `Giao KH`, legacy
  completed-but-not-delivered → delivered-equivalent (R1, R8.3).
- **Integration tests** (against a test DB, in the existing `scripts/` e2e style):
  - Admin move endpoint returns 403 and leaves state unchanged (R3.3).
  - Technician move not in offered set → 409, unchanged (R4.4).
  - deliver-device: bag path deducts `staff_holdings`; store path deducts `product_stock` and creates
    an Export_Receipt; insufficient stock leaves order unchanged and creates no receipt (R6).
  - Stock-page pull/send/receive each record exactly one move and recompute Display_State (R7).
- **Migration test**: run the backfill on seeded legacy rows; assert move count unchanged, all orders
  get a Display_State, and an intentionally inconsistent order is flagged `needs_review = 1` (R8).

## Requirements Traceability

| Design section | Requirements |
|----------------|--------------|
| Stage → Display_State Mapping, Warranty_State_Service (1) | R1.1–R1.9 |
| Timeline (2) | R2.1–R2.6 |
| Admin read-only (3) | R3.1–R3.6 |
| Technician action capability (4) | R4.1–R4.5 |
| Handling type behaviours (5) | R5.1–R5.7 |
| Deliver new device (6) | R6.1–R6.9 |
| Decoupled stock movements (7) | R7.1–R7.8 |
| Migration & backward compatibility (8), Data Models | R8.1–R8.6 |
