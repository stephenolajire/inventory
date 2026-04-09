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

const DIVIDER = `<div class="divider">--------------------------------------------</div>`;
const STAR_DIV = `<div class="divider star">============================================</div>`;

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

  const subtotal = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.unit_price) * item.quantity,
    0,
  );

  const totalTax = cart.items.reduce(
    (sum, item: CartItem) => sum + parseFloat(item.tax_amount ?? "0"),
    0,
  );
  const hasTax = totalTax > 0;

  const itemRows = cart.items
    .map((item: CartItem) => {
      const hasTaxRate = parseFloat(item.tax_rate ?? "0") > 0;
      const lineSubtotal = parseFloat(item.unit_price) * item.quantity;
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
      font-size: 14px;
      font-weight: 700;
      line-height: 1.6;
      color: #000;
      background: #fff;
      width: 80mm;
      margin: 0 auto;
      padding: 8mm 5mm 12mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Header ─────────────────────────────────────── */
    .header { text-align: center; margin-bottom: 6px; }

    .logo {
      display: block;
      width: 52px;
      height: 52px;
      object-fit: contain;
      margin: 0 auto 5px;
    }

    .shop-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      line-height: 1.2;
      color: #000;
    }

    .shop-addr {
      font-size: 12px;
      font-weight: 700;
      color: #000;
      margin-top: 3px;
      line-height: 1.6;
    }

    /* ── Dividers ────────────────────────────────────── */
    .divider {
      text-align: center;
      font-size: 11px;
      font-weight: 900;
      color: #000;
      letter-spacing: 0.02em;
      margin: 5px 0;
      overflow: hidden;
      white-space: nowrap;
    }

    /* ── Title ───────────────────────────────────────── */
    .receipt-title {
      text-align: center;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin: 4px 0;
      color: #000;
    }

    /* ── Meta rows ───────────────────────────────────── */
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: #000;
      padding: 2px 0;
    }
    .meta-row span:last-child { text-align: right; }

    /* ── Items table ─────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }

    thead th {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      color: #000;
    }
    th.col-name  { text-align: left; }
    th.col-qty,
    th.col-price,
    th.col-total { text-align: right; }

    td { padding: 3px 0; }

    .col-name  { text-align: left;  max-width: 30mm; word-break: break-word; color: #000; font-weight: 700; }
    .col-qty   { text-align: right; padding-right: 5px; color: #000; font-weight: 700; }
    .col-price { text-align: right; padding-right: 5px; color: #000; font-weight: 700; }
    .col-total { text-align: right; font-weight: 900; color: #000; }

    .tax-line td { font-size: 11px; color: #000; font-weight: 700; }
    .tax-note    { font-style: italic; }

    /* ── Totals ──────────────────────────────────────── */
    .totals { margin: 4px 0; }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      color: #000;
      padding: 2px 0;
    }
    .total-row.grand {
      font-size: 17px;
      font-weight: 900;
      color: #000;
      padding: 5px 0 3px;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      margin: 3px 0;
    }

    /* ── Payment block ───────────────────────────────── */
    .pay-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      color: #000;
      padding: 2px 0;
    }
    .pay-row.change {
      font-size: 14px;
      font-weight: 900;
      color: #000;
      border-top: 1px solid #000;
      margin-top: 3px;
      padding-top: 4px;
    }

    /* ── Footer ──────────────────────────────────────── */
    .footer { text-align: center; margin-top: 10px; }

    .thank-you {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #000;
    }

    .ref-no {
      font-size: 11px;
      font-weight: 700;
      color: #000;
      margin-top: 4px;
    }

    .powered {
      font-size: 10px;
      font-weight: 700;
      color: #444;
      margin-top: 5px;
      letter-spacing: 0.04em;
    }

    /* ── Print rules ─────────────────────────────────── */
    @media print {
      body {
        width: 80mm;
        padding: 0 3mm 8mm;
        font-weight: 700;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      * { color: #000 !important; }
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
        <th class="col-name">Item</th>
        <th class="col-qty">Qty/kg</th>
        <th class="col-price">Price</th>
        <th class="col-total">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  ${STAR_DIV}

  <!-- ── Totals ── -->
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
      <span>TOTAL</span>
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

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }

  win.addEventListener("load", () => {
    const style = win.document.createElement("style");
    win.document.head.appendChild(style);

    win.focus();
    win.print();
    setTimeout(() => iframe.remove(), 1500);
  });
}
