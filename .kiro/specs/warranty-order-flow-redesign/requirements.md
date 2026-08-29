# Requirements Document

## Introduction

This feature redesigns and simplifies the existing warranty order flow in the CTYGPS system. The
current implementation tracks each warranty product through many granular stages
(`intake`, `technician_holding`, `company_warranty_stock`, `sent_to_supplier`, `supplier_returned`,
`delivered`, `cancelled`) and drives the user interface as a rigid 6-step stepper where each step is
unlocked by clicking the previous step's button (for example the "Trả về công ty" / return-to-company
button). Operators find this inflexible because it forces an entire chain of events even when only a
subset applies.

The redesign keeps the existing data model (`order_warranty_items`, `order_warranty_meta`,
`order_warranty_moves`, `supplier_warranty_batches`) as the source of physical truth, but changes how
state is **presented** and how operators **act** on it:

- Granular item stages are consolidated into four main display states for the order: Chờ xử lý
  (Pending), Đang xử lý (Processing), Đang gửi NCC (Sending to supplier), and Giao KH
  (Delivered to customer).
- The rigid step-by-step stepper is replaced by a read-only timeline derived from the recorded
  warranty moves.
- The admin / CSKH view becomes read-only for warranty handling; the inflexible step-advancing
  buttons (including "Trả về công ty") are removed. The technician (KTV) view retains action
  capability.
- Stock movements (technician bag ↔ store warehouse ↔ supplier) are decoupled from the order
  lifecycle but every stock action is still reflected onto the order's status and timeline.
- A "Giao thiết bị mới cho khách" (deliver new device to customer) action is added for orders in the
  Chờ xử lý state, sourcing the device either from the technician bag or, optionally, from store
  stock with a full export receipt.

## Glossary

- **Warranty_Order**: An order whose `service_kind = 'warranty'`.
- **Warranty_Item**: A row in `order_warranty_items` representing one physical product handled under a
  Warranty_Order.
- **Item_Stage**: The `current_status` value of a Warranty_Item; the single source of truth for the
  item's physical position. One of `intake`, `technician_holding`, `company_warranty_stock`,
  `sent_to_supplier`, `supplier_returned`, `delivered`, `cancelled`.
- **Display_State**: One of the four consolidated, order-level states shown to operators:
  `Chờ xử lý` (Pending), `Đang xử lý` (Processing), `Đang gửi NCC` (Sending to supplier),
  `Giao KH` (Delivered to customer).
- **Warranty_State_Service**: The backend component that derives the order Display_State and the
  per-item Display_State from Item_Stage values and recorded moves (the consolidation of
  `syncWarrantyOrderState` and stage-derivation logic).
- **Warranty_Timeline**: The chronologically ordered, read-only list of warranty moves
  (`order_warranty_moves`) presented to operators in place of the stepper.
- **Technician_View**: The KTV-facing interface served by `/api/kithuat` routes.
- **Admin_View**: The admin / CSKH-facing interface served by `/api/admin/orders` warranty routes.
- **Technician_Bag**: The technician's personal stock holding (`staff_holdings`); referred to in the
  UI as "túi KTV".
- **Store_Stock**: Company store inventory (`product_stock`).
- **Warranty_Stock_Page**: The admin "Hàng bảo hành trong kho" page that manages movement of items
  between the Technician_Bag, the company warranty warehouse, and the supplier
  (`/api/admin/warranty-batches` and related stock endpoints).
- **Handling_Type**: The `handling_type` value of a Warranty_Item describing the chosen resolution
  path. One of `pending`, `tech_fix`, `exchange`, `supplier_return`.
- **Deliver_Device_Dialog**: The UI dialog opened by the "Giao thiết bị mới cho khách" action that
  collects the replacement device, source selection, and an optional "lấy từ túi KTV" checkbox.
- **Export_Receipt**: A stock out receipt (`stock_receipts` with `kind = 'out'`) plus its line items
  (`stock_receipt_items`).
- **Warranty_Move**: A row in `order_warranty_moves` recording a single warranty action with its
  action code, source/destination location, quantity, actor, and timestamp.

## Requirements

### Requirement 1: Consolidated Display States

**User Story:** As an operator, I want each warranty order summarised into four clear states, so that
I am not overwhelmed by many granular per-item statuses.

#### Acceptance Criteria

1. THE Warranty_State_Service SHALL derive exactly one order-level Display_State for every
   Warranty_Order from the set {`Chờ xử lý`, `Đang xử lý`, `Đang gửi NCC`, `Giao KH`}.
2. WHERE a Warranty_Order has at least one non-cancelled Warranty_Item AND every non-cancelled
   Warranty_Item has Item_Stage `delivered`, THE Warranty_State_Service SHALL set the order
   Display_State to `Giao KH`.
3. IF at least one non-cancelled Warranty_Item has Item_Stage `sent_to_supplier` or
   `supplier_returned`, THEN THE Warranty_State_Service SHALL set the order Display_State to
   `Đang gửi NCC`.
4. WHERE no Warranty_Item is in supplier flow and no delivery condition applies, IF at least one
   non-cancelled Warranty_Item has Item_Stage `technician_holding` or `company_warranty_stock`
   while no replacement device has been reserved for it, THEN THE Warranty_State_Service SHALL set
   the order Display_State to `Chờ xử lý`.
5. WHERE none of the `Giao KH`, `Đang gửi NCC`, or `Chờ xử lý` conditions apply, including the case
   where every Warranty_Item of the order is `cancelled`, THE Warranty_State_Service SHALL set the
   order Display_State to `Đang xử lý`.
6. THE Warranty_State_Service SHALL evaluate the Display_State precedence in the fixed order
   `Giao KH` then `Đang gửi NCC` then `Chờ xử lý` then `Đang xử lý`, so that one Warranty_Order
   resolves to exactly one Display_State even when multiple underlying conditions are simultaneously
   met.
7. THE Warranty_State_Service SHALL treat Warranty_Items with Item_Stage `cancelled` as absent when
   evaluating criteria 2 through 5.
8. THE Warranty_State_Service SHALL derive the per-item Display_State from the item's Item_Stage
   using the same four-state vocabulary.
9. WHEN any Warranty_Item of a Warranty_Order changes Item_Stage, THE Warranty_State_Service SHALL
   re-derive that order's Display_State within 2 seconds of the change.

### Requirement 2: Timeline View Replaces Stepper

**User Story:** As an operator, I want to see the history of a warranty order as a timeline, so that I
understand what happened without following a rigid step sequence.

#### Acceptance Criteria

1. THE Warranty_Timeline SHALL present the recorded Warranty_Moves of a Warranty_Order ordered by
   `occurred_at` descending, and for Warranty_Moves sharing an identical `occurred_at` value SHALL
   order those entries by move id descending, so that the most recent move appears first.
2. WHEN a Warranty_Move is recorded for a Warranty_Order, THE Warranty_Timeline SHALL, within 5
   seconds of the move being recorded, include that move displaying its action label, actor name,
   and timestamp.
3. WHERE a recorded Warranty_Move has note text, THE Warranty_Timeline SHALL display that note text
   with the corresponding move entry.
4. WHERE a recorded Warranty_Move has no note text, THE Warranty_Timeline SHALL display the move
   entry without a note field and without placeholder note text.
5. THE Technician_View and THE Admin_View SHALL present warranty progress as the Warranty_Timeline
   rather than as a fixed multi-step stepper.
6. WHERE a Warranty_Order has zero recorded Warranty_Moves, THE Warranty_Timeline SHALL present an
   empty-state indicator conveying that no moves exist, without displaying any placeholder stepper
   steps or move entries.

### Requirement 3: Admin / CSKH Read-Only Warranty View

**User Story:** As an admin / CSKH user, I want the warranty section to be read-only, so that I am not
forced to advance a chain of events through inflexible buttons.

#### Acceptance Criteria

1. THE Admin_View SHALL present the Warranty_Order Display_State, per-item Display_State, and
   Warranty_Timeline as read-only information, with no control that submits a change to any of those
   three displayed values.
2. THE Admin_View SHALL NOT present the "Trả về công ty" (return-to-company) action control, nor any
   other control that advances Item_Stage.
3. WHEN an Admin_View client submits a warranty move that advances Item_Stage, THE
   Warranty_Order_System SHALL reject the request with an authorization error, SHALL return an error
   indication to the caller identifying the action as not permitted for the Admin_View role, and
   SHALL leave every Item_Stage, Warranty_Order Display_State, and Warranty_Timeline entry unchanged.
4. THE Admin_View SHALL permit editing of the following non-stage-advancement warranty metadata
   fields only: order address (1 to 255 characters), order note (0 to 1000 characters), and warranty
   note text (0 to 1000 characters).
5. WHEN an Admin_View client submits an edit to order address, order note, or warranty note text in
   which every submitted field is within its defined length bounds, THE Warranty_Order_System SHALL
   persist the submitted values and SHALL NOT change any Item_Stage, Warranty_Order Display_State, or
   Warranty_Timeline entry.
6. IF an Admin_View client submits an edit in which order address, order note, or warranty note text
   falls outside its defined length bounds, THEN THE Warranty_Order_System SHALL reject the request
   with a validation error indicating which field is out of bounds and SHALL retain the previously
   stored field values unchanged.

### Requirement 4: Technician Action Capability

**User Story:** As a technician, I want to keep performing warranty actions, so that I can handle
products in the field.

#### Acceptance Criteria

1. WHILE a technician is the assigned staff of a Warranty_Order, THE Technician_View SHALL allow that
   technician to record a Warranty_Move that changes the Item_Stage of that Warranty_Order.
2. WHEN a technician records a valid Warranty_Move, THE Warranty_Order_System SHALL append one
   corresponding entry to the Warranty_Timeline within 5 seconds, where the entry includes the
   resulting Item_Stage, the recording technician, and the timestamp of the action.
3. IF a technician who is not the assigned staff of a Warranty_Order submits a Warranty_Move for that
   order, THEN THE Warranty_Order_System SHALL reject the request, return a not-found or
   authorization error indicating the technician is not permitted to act on that order, and leave the
   Item_Stage and Warranty_Timeline unchanged.
4. IF a technician submits a Warranty_Move that is not among the moves offered for the current
   Item_Stage and Handling_Type, THEN THE Warranty_Order_System SHALL reject the request, return an
   error indicating the move is not valid for the current Item_Stage, and leave the Item_Stage and
   Warranty_Timeline unchanged.
5. WHEN a technician opens an assigned Warranty_Order in the Technician_View, THE
   Warranty_Order_System SHALL offer the set of Warranty_Moves that are valid for the current
   Item_Stage and Handling_Type, without requiring completion of a predefined ordered step chain.

### Requirement 5: Handling Type Behaviours

**User Story:** As a technician, I want each handling type to drive a clear outcome, so that the four
resolution paths behave predictably.

#### Acceptance Criteria

1. WHERE a Warranty_Item has Handling_Type `tech_fix`, WHEN the technician records the fix completion
   with all required fix details present, THE Warranty_Order_System SHALL, within a single atomic
   transaction, set the item Item_Stage to `delivered` and the item customer_status to `completed`.
2. WHERE a Warranty_Item has Handling_Type `tech_fix`, IF the technician submits a fix completion
   with any required fix detail missing, THEN THE Warranty_Order_System SHALL reject the submission,
   preserve the current Item_Stage and customer_status unchanged, and return an error indication
   identifying the missing fix details.
3. WHERE a Warranty_Item has Handling_Type `exchange`, WHEN the technician delivers the replacement
   device from the Technician_Bag to the customer, THE Warranty_Order_System SHALL, within a single
   atomic transaction, set the item customer_status to `completed` and record the faulty unit moving
   into the Technician_Bag as a separate Warranty_Move.
4. WHERE a Warranty_Item has Handling_Type `exchange`, IF the technician attempts delivery when no
   replacement device is available in the Technician_Bag, THEN THE Warranty_Order_System SHALL reject
   the delivery, preserve the current customer_status unchanged, and return an error indication that
   no replacement device is available.
5. WHERE a Warranty_Item has Handling_Type `supplier_return` AND no product was brought into the
   Technician_Bag at intake, WHEN the technician recalls the product into the Technician_Bag, THE
   Warranty_Order_System SHALL set the item Item_Stage to `technician_holding` and SHALL resolve the
   order Display_State to `Chờ xử lý`.
6. WHERE a Warranty_Item follows the fourth resolution path (no-product recall equivalent to
   `supplier_return`), WHEN the technician recalls the product into the Technician_Bag, THE
   Warranty_Order_System SHALL set the item Item_Stage to `technician_holding` and SHALL resolve the
   order Display_State to `Chờ xử lý`.
7. WHEN a Handling_Type-driven action changes a Warranty_Item Item_Stage, THE Warranty_Order_System
   SHALL record a Warranty_Move capturing the source Item_Stage, the destination Item_Stage, and the
   Handling_Type that triggered the change.

### Requirement 6: Deliver New Device To Customer

**User Story:** As an operator, I want to deliver a replacement device to the customer from a Chờ xử lý
order, so that I can resolve the order without following a rigid step chain.

#### Acceptance Criteria

1. WHERE a Warranty_Order Display_State is `Chờ xử lý`, THE Technician_View SHALL present the
   "Giao thiết bị mới cho khách" action.
2. WHEN the operator opens the "Giao thiết bị mới cho khách" action, THE Deliver_Device_Dialog SHALL
   present a replacement device selection, a delivered-quantity input accepting an integer from 1 to
   999999, and a "lấy từ túi KTV" checkbox.
3. IF the operator confirms delivery with no replacement device selected or with a delivered quantity
   outside the range 1 to 999999, THEN THE Warranty_Order_System SHALL reject the delivery, return a
   validation error indicating the invalid input, and SHALL NOT change the order.
4. WHERE the "lấy từ túi KTV" checkbox is checked, WHEN the operator confirms delivery, THE
   Warranty_Order_System SHALL deduct the delivered quantity from the Technician_Bag of the assigned
   technician.
5. IF the "lấy từ túi KTV" checkbox is checked and the Warranty_Order has no assigned technician,
   THEN THE Warranty_Order_System SHALL reject the delivery, return an error indication that the
   order has no assigned technician, and SHALL NOT change the order.
6. IF the "lấy từ túi KTV" checkbox is checked and the Technician_Bag holds fewer units than the
   delivered quantity, THEN THE Warranty_Order_System SHALL reject the delivery with an
   insufficient-stock error and SHALL NOT change the order.
7. WHERE the "lấy từ túi KTV" checkbox is not checked, WHEN the operator confirms delivery, THE
   Warranty_Order_System SHALL deduct the delivered quantity from Store_Stock and SHALL create an
   Export_Receipt for the delivered quantity.
8. IF the "lấy từ túi KTV" checkbox is not checked and Store_Stock holds fewer units than the
   delivered quantity, THEN THE Warranty_Order_System SHALL reject the delivery with an
   insufficient-stock error and SHALL NOT change the order and SHALL NOT create an Export_Receipt.
9. WHEN a delivery is confirmed successfully, THE Warranty_Order_System SHALL set the affected
   Warranty_Item customer_status to `completed` and SHALL record a `deliver_to_customer`
   Warranty_Move.

### Requirement 7: Decoupled Stock Movements

**User Story:** As a warehouse operator, I want to move warranty products between the technician bag,
the warehouse, and the supplier independently, so that stock handling is not locked to the order's
progress.

#### Acceptance Criteria

1. THE Warranty_Stock_Page SHALL allow an operator to pull a Warranty_Item from the Technician_Bag
   into the company warranty warehouse regardless of the current value of the order's Display_State.
2. WHEN a Warranty_Item is moved from the Technician_Bag to the company warranty warehouse, THE
   Warranty_Order_System SHALL set the item Item_Stage to `company_warranty_stock` and SHALL record
   exactly one `move_to_company_stock` Warranty_Move.
3. WHEN a Warranty_Item is sent to a supplier batch, THE Warranty_Order_System SHALL set the item
   Item_Stage to `sent_to_supplier` and SHALL record exactly one `send_to_supplier` Warranty_Move.
4. WHEN a Warranty_Item is received back from a supplier batch, THE Warranty_Order_System SHALL set
   the item Item_Stage to `supplier_returned` and SHALL record exactly one `receive_from_supplier`
   Warranty_Move.
5. WHEN any stock movement changes a Warranty_Item's Item_Stage, THE Warranty_State_Service SHALL
   recompute the affected order's Display_State within 2 seconds of the Item_Stage change.
6. THE Warranty_Stock_Page SHALL allow each stock movement to be performed as a standalone action
   that requires no preceding and no following order-step action.
7. IF an operator attempts a stock movement on a Warranty_Item whose current Item_Stage is not a
   valid source stage for that movement, THEN THE Warranty_Order_System SHALL reject the movement,
   SHALL retain the item's current Item_Stage unchanged, SHALL record no Warranty_Move, and SHALL
   return an error indication describing the invalid stage transition.
8. IF a stock movement fails to persist before completion, THEN THE Warranty_Order_System SHALL roll
   back the Warranty_Item to its prior Item_Stage, SHALL record no Warranty_Move, and SHALL return an
   error indication that the movement did not complete.

### Requirement 8: Migration And Backward Compatibility

**User Story:** As a system maintainer, I want existing warranty orders to map cleanly onto the
consolidated states, so that historical data remains correct after the redesign.

#### Acceptance Criteria

1. WHEN the warranty state redesign migration runs, THE Warranty_State_Service SHALL derive exactly
   one Display_State, chosen from the defined set of Display_State values, for each existing
   Warranty_Order using only existing stored data and without requiring new data entry.
2. WHEN the warranty state redesign migration completes, THE Warranty_Order_System SHALL retain every
   existing Warranty_Move history record with its original content unchanged, such that the
   post-migration Warranty_Move record count equals the pre-migration count and no record is deleted
   or modified.
3. WHERE an existing Warranty_Item holds a legacy `customer_status = 'completed'` while its Item_Stage
   is not `delivered` or `cancelled`, THE Warranty_State_Service SHALL treat the item as delivered for
   Display_State derivation.
4. THE Warranty_Order_System SHALL derive `current_location` for each Warranty_Item exclusively from
   that Warranty_Item's Item_Stage.
5. THE Warranty_Order_System SHALL derive `customer_status` for each Warranty_Item exclusively from
   that Warranty_Item's Item_Stage.
6. IF an existing Warranty_Order contains missing or inconsistent data that prevents Display_State
   derivation, THEN THE Warranty_State_Service SHALL leave that Warranty_Order's stored data
   unchanged, flag the order as unresolved for manual review, and continue migrating the remaining
   Warranty_Orders.
