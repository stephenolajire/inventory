// src/lib/printReceipt.ts
//
// Generates a thermal POS receipt as a self-contained HTML string
// and triggers window.print() scoped to a hidden iframe.
// No new tab, no preview — prints immediately.

import type { Cart, CartItem, MarkPaidResponse } from "../types";

export interface ReceiptVendor {
  businessName: string;
  businessEmail?: string;
  streetAddress?: string;
  cityTown?: string;
  stateName?: string;
  businessLogo?: string;
}

// ── Helpers ────────────────────────────────────────────────────

function fmt(
  value: string | number | null | undefined,
  currency = "NGN",
): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DIVIDER = `<div class="divider">- - - - - - - - - - - - - - - - - - - - - -</div>`;
const STAR_DIV = `<div class="divider star">* * * * * * * * * * * * * * * * * * * * * *</div>`;

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Bank Transfer",
};

// ── HTML builder ───────────────────────────────────────────────

function buildHtml(
  result: MarkPaidResponse,
  cart: Cart,
  vendor: ReceiptVendor,
): string {
  const currency = cart.currency ?? "NGN";
  const hasChange = parseFloat(result.change_due ?? "0") > 0;

  const addressParts = [
    vendor.streetAddress,
    vendor.cityTown,
    vendor.stateName,
  ].filter(Boolean);

  // ── Calculate pre-tax subtotal from individual line items ──
  // unit_price × quantity gives the clean pre-tax line total.
  // cart.subtotal may already include tax depending on the backend,
  // so we derive it ourselves to guarantee correctness.
  const subtotal = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.unit_price) * item.quantity,
    0,
  );

  // ── Total tax: sum of backend-calculated tax_amount per line item ──
  const totalTax = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.tax_amount ?? "0"),
    0,
  );
  const hasTax = totalTax > 0;

  const itemRows = cart.items
    .map((item: CartItem) => {
      const hasTaxRate = parseFloat(item.tax_rate ?? "0") > 0;
      // Pre-tax line total: unit price × quantity (no tax baked in)
      const lineSubtotal = parseFloat(item.unit_price) * item.quantity;
      // Tax for this line: already calculated by backend
      const lineTax = parseFloat(item.tax_amount ?? "0");

      return `
        <tr class="item-row">
          <td class="col-name">${item.product_name}</td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-price">${fmt(item.unit_price, currency)}</td>
          <td class="col-total">${fmt(lineSubtotal, currency)}</td>
        </tr>
        ${
          hasTaxRate
            ? `
        <tr class="tax-line">
          <td class="col-name tax-note">  + tax (${item.tax_rate}%)</td>
          <td></td><td></td>
          <td class="col-total">${fmt(lineTax, currency)}</td>
        </tr>`
            : ""
        }
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Receipt</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Share Tech Mono', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #111;
      background: #fff;
      width: 80mm;
      margin: 0 auto;
      padding: 8mm 5mm 12mm;
    }

    /* ── Header ─────────────────────────────────────── */
    .header { text-align: center; margin-bottom: 5px; }

    .logo {
      display: block;
      width: 52px;
      height: 52px;
      object-fit: contain;
      margin: 0 auto 5px;
    }

    .shop-name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .shop-addr {
      font-size: 10px;
      color: #555;
      margin-top: 3px;
      line-height: 1.6;
    }

    /* ── Dividers ────────────────────────────────────── */
    .divider {
      text-align: center;
      font-size: 9px;
      color: #aaa;
      letter-spacing: 0.02em;
      margin: 5px 0;
      overflow: hidden;
      white-space: nowrap;
    }
    .divider.star { color: #888; }

    /* ── Title ───────────────────────────────────────── */
    .receipt-title {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin: 4px 0;
    }

    /* ── Meta rows ───────────────────────────────────── */
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #555;
      padding: 1px 0;
    }
    .meta-row span:last-child { text-align: right; }

    /* ── Items table ─────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }

    thead th {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 3px 0 3px;
      border-bottom: 1px dashed #bbb;
    }
    th.col-name  { text-align: left; }
    th.col-qty,
    th.col-price,
    th.col-total { text-align: right; }

    td { padding: 2px 0; }

    .col-name  { text-align: left;  max-width: 30mm; word-break: break-word; }
    .col-qty   { text-align: right; padding-right: 5px; color: #666; }
    .col-price { text-align: right; padding-right: 5px; color: #666; }
    .col-total { text-align: right; font-weight: 600; }

    .tax-line td { font-size: 10px; color: #999; }
    .tax-note    { font-style: italic; }

    /* ── Totals ──────────────────────────────────────── */
    .totals { margin: 3px 0; }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #555;
      padding: 1.5px 0;
    }
    .total-row.grand {
      font-size: 15px;
      font-weight: 700;
      color: #000;
      padding: 4px 0 2px;
    }

    /* ── Payment block ───────────────────────────────── */
    .pay-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #444;
      padding: 1.5px 0;
    }
    .pay-row.change {
      font-size: 12px;
      font-weight: 700;
      color: #000;
    }

    /* ── Footer ──────────────────────────────────────── */
    .footer { text-align: center; margin-top: 8px; }

    .thank-you {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .ref-no {
      font-size: 9px;
      color: #aaa;
      margin-top: 3px;
    }

    .powered {
      font-size: 8px;
      color: #ccc;
      margin-top: 5px;
      letter-spacing: 0.04em;
    }

    /* ── Print rules ─────────────────────────────────── */
    @media print {
      body { width: 80mm; padding: 0 3mm 8mm; }
      @page { size: 80mm auto; margin: 0; }
    }
  </style>
</head>
<body>

  <!-- ── Shop header ── -->
  <div class="header">
    ${
      vendor.businessLogo
        ? `<img class="logo" src="${vendor.businessLogo}" alt="${vendor.businessName}" />`
        : ""
    }
    <div class="shop-name">${vendor.businessName || "Your Store"}</div>
    <div class="shop-addr">
      ${addressParts.length ? `<div>${addressParts.join(", ")}</div>` : ""}
      ${vendor.businessEmail ? `<div>${vendor.businessEmail}</div>` : ""}
    </div>
  </div>

  ${STAR_DIV}
  <div class="receipt-title">Cash Receipt</div>
  ${STAR_DIV}

  <!-- ── Meta ── -->
  <div class="meta-row">
    <span>Date</span>
    <span>${fmtDate(result.paid_at)}</span>
  </div>

  <div class="meta-row">
    <span>Ref #</span>
    <span>${result.cart_id.slice(0, 8).toUpperCase()}</span>
  </div>

  ${DIVIDER}

  <!-- ── Items ── -->
  <table>
    <thead>
      <tr>
        <th class="col-name">Description</th>
        <th class="col-qty">Qty</th>
        <th class="col-price">Price</th>
        <th class="col-total">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  ${STAR_DIV}

  <!-- ── Totals ── -->
  <!--
    subtotal  = sum of (unit_price × quantity) for all items — pre-tax
    tax_total = sum of all per-item tax_amount values from the backend
    total     = subtotal + totalTax (derived on frontend to avoid backend double-tax)
  -->
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${fmt(subtotal, currency)}</span>
    </div>
    ${
      hasTax
        ? `<div class="total-row"><span>Tax</span><span>${fmt(totalTax, currency)}</span></div>`
        : ""
    }
    <div class="total-row grand">
      <span>Total</span>
      <span>${fmt(subtotal + totalTax, currency)}</span>
    </div>
  </div>

  ${DIVIDER}

  <!-- ── Payment ── -->
  <div>
    <div class="pay-row">
      <span>Payment method</span>
      <span>${METHOD_LABEL[cart.payment_method] ?? cart.payment_method}</span>
    </div>
    ${
      cart.payment_method === "cash" && cart.amount_tendered
        ? `<div class="pay-row"><span>Cash received</span><span>${fmt(cart.amount_tendered, currency)}</span></div>`
        : ""
    }
    ${
      hasChange
        ? `<div class="pay-row change"><span>Change due</span><span>${fmt(result.change_due, currency)}</span></div>`
        : ""
    }
  </div>

  ${STAR_DIV}

  <!-- ── Footer ── -->
  <div class="footer">
    <div class="thank-you">Thank You!</div>
    <div class="ref-no">Transaction: ${result.cart_id.toUpperCase()}</div>
    <div class="powered">Powered by StockSense</div>
  </div>

</body>
</html>`;
}

// ── Public function ────────────────────────────────────────────

export function printReceipt(
  result: MarkPaidResponse,
  cart: Cart,
  vendor: ReceiptVendor,
): void {
  const html = buildHtml(result, cart, vendor);

  // Inject a hidden iframe, write the receipt HTML, and trigger print
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for fonts/logo to load, then print
  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }

  win.addEventListener("load", () => {
    // Inject a late <style> that wins over browser/system defaults.
    // Chrome often ignores @page size in iframe docs unless forced this way.
    const style = win.document.createElement("style");
    
    win.document.head.appendChild(style);

    win.focus();
    win.print();
    // Clean up after the print dialog is dismissed
    setTimeout(() => iframe.remove(), 1500);
  });
}
