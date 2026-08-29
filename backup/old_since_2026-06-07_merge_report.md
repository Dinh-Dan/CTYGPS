# Merge report from `gpsvietOld.sql` into `gpsviet2New.sql`

Cutoff checked: `2026-06-07 00:00:00`

## Safe to migrate automatically

1. `ORD-0406-012`
   Existing in db2 with same order code and same customer (`customer_id=92`), but db2 is missing the payment completion recorded in old db.
   Safe action:
   - update order to `done` / `paid`
   - insert missing `order_payments` row
   - insert missing `staff_receipts` row `NNT-0806-002`

2. `ORD-0706-001`
   Missing in db2. Uses existing `customer_id=21`, so it can be inserted safely with new auto ids for children.

3. `ORD-0806-003`
   Missing in db2. Uses existing `customer_id=21`, so it can be inserted safely with new auto ids for children.

SQL prepared for these safe changes:
- [migrate_old_since_2026-06-07_safe.sql](C:\Users\WINDOWS\Desktop\CTYGPS\backup\migrate_old_since_2026-06-07_safe.sql)

SQL prepared for the conflicting records when you want to keep old data by renaming codes:
- [migrate_old_since_2026-06-07_conflicts_renamed.sql](C:\Users\WINDOWS\Desktop\CTYGPS\backup\migrate_old_since_2026-06-07_conflicts_renamed.sql)

## Conflicts that should not be merged automatically

### Customer code conflicts

These customer codes exist in both DBs but point to different people/companies:

- `KH0066`
- `KH0067`
- `KH0068`
- `KH0069`
- `KH0070`

Example:
- old `KH0066` = `Thanh` / `0903691345` / `CÔNG TY TNHH GIAO NHẬN VẬN TẢI CHÍ THẮNG`
- new `KH0066` = `dulichhieu`

This means customer import from old requires either:
- creating new customer codes in db2, or
- manually mapping each old customer to an existing db2 customer

### Order code conflicts or customer dependency conflicts

These orders from old changed after the cutoff but cannot be merged blindly:

- `ORD-0806-001`
  Code already exists in db2, but it is a different order.

- `ORD-0806-002`
  Missing in db2, but depends on old customer `KH0067`, whose code is already reused in db2 for someone else.

- `ORD-0806-004`
  Missing in db2, but depends on old customer `KH0068`, whose code is already reused in db2 for someone else.

- `ORD-0906-001`
  Code already exists in db2, but refers to a different order/customer.

- `ORD-0906-002`
  Code already exists in db2, but refers to a different order/customer.

### Receipt conflicts

- `NNT-0806-001`
  Depends on order `ORD-0806-002`, which is blocked by customer conflict.

- `NNT-0906-001`
  Same receipt code already exists in db2 but points to another order.

- `NNT-0906-002`
  Same receipt code already exists in db2 but points to another order.

### Stock movement conflict

- Old stock issue `CAP-0806-001` links to stock receipt code `PX-260608-001`
- db2 already has `PX-260608-001`, but it is used for a different movement:
  - old: `reason_code = staff_issue`
  - new: `reason_code = order_consume`

This is not safe to merge automatically because both `id` and `code` collide with different meanings.

## Recommended next step

1. Run the safe SQL file first.
2. Then decide how to handle the 5 conflicting old customers:
   - create them as new customers with fresh codes in db2, or
   - map them onto existing db2 customers if they are duplicates.
3. After customer mapping is decided, build a second migration for:
   - `ORD-0806-002`
   - `ORD-0806-004`
   - possibly the `0906` receipts/orders if old data is the one to keep
