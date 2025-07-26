export function printOrder() {
  // Open print dialog
  window.print();
}

export function generateOrderPDF(order: any, translations: any) {
  // For now, we'll use the browser's print-to-PDF functionality
  // In the future, this could be replaced with a proper PDF generation library
  
  // Create a printable version of the order
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${translations.orderNumber} #${order.orderNumber}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .order-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
        }
        .totals-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5px;
        }
        .totals-label {
          margin-right: 20px;
          min-width: 100px;
        }
        .totals-value {
          min-width: 100px;
          text-align: right;
        }
        .total-final {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        @media print {
          body {
            margin: 0;
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">LUZIMARKET</div>
        <div>${translations.orderInvoice}</div>
      </div>
      
      <div class="order-info">
        <div>
          <strong>${translations.orderNumber}:</strong> #${order.orderNumber}<br>
          <strong>${translations.date}:</strong> ${new Date(order.createdAt).toLocaleDateString('es-MX')}<br>
          <strong>${translations.status}:</strong> ${order.status}
        </div>
        <div>
          <strong>${translations.customer}:</strong><br>
          ${order.user?.name || translations.guest}<br>
          ${order.user?.email || order.shippingAddress?.email || ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">${translations.shippingAddress}</div>
        <div>
          ${order.shippingAddress?.fullName || ''}<br>
          ${order.shippingAddress?.street || ''}<br>
          ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.postalCode || ''}<br>
          ${order.shippingAddress?.country || ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">${translations.orderItems}</div>
        <table>
          <thead>
            <tr>
              <th>${translations.product}</th>
              <th>${translations.quantity}</th>
              <th>${translations.price}</th>
              <th>${translations.total}</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td>${item.product.name}</td>
                <td>${item.quantity}</td>
                <td>$${Number(item.price).toFixed(2)}</td>
                <td>$${Number(item.total).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="totals">
        <div class="totals-row">
          <div class="totals-label">${translations.subtotal}:</div>
          <div class="totals-value">$${Number(order.subtotal).toFixed(2)}</div>
        </div>
        <div class="totals-row">
          <div class="totals-label">${translations.tax}:</div>
          <div class="totals-value">$${Number(order.tax).toFixed(2)}</div>
        </div>
        <div class="totals-row">
          <div class="totals-label">${translations.shipping}:</div>
          <div class="totals-value">$${Number(order.shipping).toFixed(2)}</div>
        </div>
        <div class="totals-row total-final">
          <div class="totals-label">${translations.total}:</div>
          <div class="totals-value">$${Number(order.total).toFixed(2)}</div>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}