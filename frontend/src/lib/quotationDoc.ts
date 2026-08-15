import type { Quotation } from '../types/models'
import { formatINR, formatDate } from './utils'

// Builds a printable quotation document and opens it in a new tab so the user
// can save/print it as a PDF — this simulates the "download the quotation"
// requirement without a backend PDF service.
export function openQuotationDocument(q: Quotation) {
  const items = q.lineItems ?? []
  const rows = items
    .map((it) => {
      const lineBase = it.quantity * it.unitPrice
      const lineTotal = Math.round(lineBase * (1 - it.discount / 100) * (1 + it.gstPercent / 100) + it.labourCharge)
      return `<tr>
        <td>${it.product}</td>
        <td>${it.quantity} ${it.unit}</td>
        <td>${formatINR(it.unitPrice)}</td>
        <td>${it.discount}%</td>
        <td>${it.gstPercent}%</td>
        <td>${formatINR(it.labourCharge)}</td>
        <td>${formatINR(lineTotal)}</td>
      </tr>`
    })
    .join('')

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${q.quotationNumber}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;color:#1b2233;padding:32px;max-width:800px;margin:0 auto;}
  h1{font-size:18px;margin-bottom:0;}
  .muted{color:#6b7385;font-size:12px;}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;}
  th,td{border:1px solid #e2e6ef;padding:6px 8px;text-align:left;}
  th{background:#f8f9fc;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#6b7385;}
  .totals{margin-top:16px;width:280px;margin-left:auto;font-size:13px;}
  .totals div{display:flex;justify-content:space-between;padding:4px 0;}
  .grand{font-weight:700;border-top:1px solid #e2e6ef;padding-top:8px;}
  .terms{margin-top:24px;font-size:12px;color:#374052;}
  .terms h3{font-size:12px;text-transform:uppercase;color:#6b7385;margin-bottom:2px;}
  @media print { button{display:none;} }
</style></head>
<body>
  <button onclick="window.print()" style="float:right;padding:8px 14px;background:#2f5fd9;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print / Save as PDF</button>
  <h1>Success Solar Care — Trichy</h1>
  <div class="muted">Quotation ${q.quotationNumber} · Rev ${q.revisionNumber > 0 ? `v${q.revisionNumber + 1}` : 'v1'} · ${formatDate(q.date)}</div>
  <p><strong>Customer:</strong> ${q.customerName}<br/><strong>Site:</strong> ${q.site}<br/><strong>Project Type:</strong> ${q.projectType}<br/><strong>Prepared By:</strong> ${q.preparedBy}<br/><strong>Valid Until:</strong> ${formatDate(q.validUntil)}</p>
  <table>
    <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Disc</th><th>GST</th><th>Labour</th><th>Line Total</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="muted">No line items recorded.</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatINR(q.subtotal ?? 0)}</span></div>
    <div><span>Discount</span><span>-${formatINR(q.discountTotal ?? 0)}</span></div>
    <div><span>Tax</span><span>${formatINR(q.taxTotal ?? 0)}</span></div>
    <div><span>Labour</span><span>${formatINR(q.labourTotal ?? 0)}</span></div>
    <div class="grand"><span>Grand Total</span><span>${formatINR(q.grandTotal)}</span></div>
    <div><span>Advance (${q.advancePercentage}%)</span><span>${formatINR(q.advanceAmount)}</span></div>
    <div><span>Balance</span><span>${formatINR(q.balanceAmount)}</span></div>
  </div>
  <div class="terms">
    <h3>Payment Terms</h3><p>${q.paymentTerms ?? '—'}</p>
    <h3>Installation Terms</h3><p>${q.installationTerms ?? '—'}</p>
    <h3>Warranty Terms</h3><p>${q.warrantyTerms ?? '—'}</p>
    ${q.notes ? `<h3>Notes</h3><p>${q.notes}</p>` : ''}
  </div>
</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
