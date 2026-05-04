// priceResolver — resolve gia san pham cho 1 customer cu the.
//
// Priority (lay theo thu tu, dung lai khi tim thay):
//   1) customer_product_prices (override rieng cho customer + product)
//   2) product_prices via customers.default_tier_id (gia theo cap dai ly)
//   3) product_prices via price_tiers.is_default = 1 (fallback ban le)
//
// Truyen customerId = null/0 => bo qua buoc 1+2, chi lay tier mac dinh (khach guest, public).

async function resolvePriceMap(conn, productIds, customerId) {
  if (!productIds || !productIds.length) return new Map();
  const ids = Array.from(new Set(productIds.map(Number).filter(Boolean)));
  const map = new Map();   // product_id -> price (number)

  const cid = Number(customerId) || 0;

  // 1) override rieng
  if (cid) {
    const ph = ids.map(() => '?').join(',');
    const [rows] = await conn.query(
      `SELECT product_id, price FROM customer_product_prices
        WHERE customer_id = ? AND product_id IN (${ph})`,
      [cid, ...ids]
    );
    rows.forEach(r => map.set(Number(r.product_id), Number(r.price) || 0));
  }

  // 2) tier theo default_tier_id (cho cac product chua co override)
  if (cid) {
    const remaining = ids.filter(pid => !map.has(pid));
    if (remaining.length) {
      const ph = remaining.map(() => '?').join(',');
      const [rows] = await conn.query(
        `SELECT pp.product_id, pp.price
           FROM product_prices pp
           JOIN customers c ON c.id = ?
          WHERE pp.product_id IN (${ph})
            AND c.default_tier_id IS NOT NULL
            AND pp.tier_id = c.default_tier_id`,
        [cid, ...remaining]
      );
      rows.forEach(r => map.set(Number(r.product_id), Number(r.price) || 0));
    }
  }

  // 3) tier is_default (fallback)
  const stillRemaining = ids.filter(pid => !map.has(pid));
  if (stillRemaining.length) {
    const ph = stillRemaining.map(() => '?').join(',');
    const [rows] = await conn.query(
      `SELECT pp.product_id, pp.price
         FROM product_prices pp
         JOIN price_tiers t ON t.id = pp.tier_id
        WHERE pp.product_id IN (${ph}) AND t.is_default = 1 AND t.is_deleted = 0`,
      stillRemaining
    );
    rows.forEach(r => map.set(Number(r.product_id), Number(r.price) || 0));
  }

  return map;
}

// Resolve gia cho 1 san pham cu the. Tien dung khi load detail.
async function resolvePrice(conn, productId, customerId) {
  const map = await resolvePriceMap(conn, [productId], customerId);
  return map.get(Number(productId)) ?? null;
}

module.exports = { resolvePriceMap, resolvePrice };
