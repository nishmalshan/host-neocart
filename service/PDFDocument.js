const PDFDocument = require('pdfkit');
const path = require('path');
const moment = require('moment');

function createInvoice(order, filepath) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(fs.createWriteStream(filepath));

  addLogo(doc);
  addHeader(doc, order);
  addCustomerInformation(doc, order);
  addInvoiceTable(doc, order);
  addTotals(doc, order);

  doc.end();
}

function addLogo(doc) {
  const imagePath = path.join(__dirname, '..', 'public', 'images', 'Neo_icon.png');
  console.log('Image path:', imagePath);
  doc.image(imagePath, 50, 45, { width: 50 });
}

function addHeader(doc, order) {
  doc
    .fontSize(20)
    .text('INVOICE', 0, 50, { align: 'right' })
    .fontSize(10)
    .text(`16501 Collins Ave, Sunny Isles Beach, FL 33160, India`, 0, 75, { align: 'right' })
    .text('676503, Cochin', 0, 90, { align: 'right' })
    .text('India', 0, 105, { align: 'right' })
    .moveDown();
}

function addCustomerInformation(doc, order) {
  const formattedDate = order.orderDate ? moment(order.orderDate).format('DD-MM-YYYY') : 'Invalid Date';

  doc
    .fontSize(10)
    .text('Palakkad', 50, 120)
    .text('679502, Palakkad', 50, 135)
    .text('India', 50, 150)
    .text(`Date: ${formattedDate}`, 0, 120, { align: 'right' })
    .moveDown();
}


function addInvoiceTable(doc, order) {
  const tableTop = 200;
  const tableHeaders = ['Products', 'Quantity', 'Price', 'Total'];
  const columnWidths = [200, 100, 100, 100];

  doc.fontSize(10);
  tableHeaders.forEach((header, i) => {
    doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
  });

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let rowTop = tableTop + 30;

  order.items.forEach(item => {
    doc.text(item.name, 50, rowTop);
    doc.text(item.quantity.toString(), 250, rowTop);
    doc.text(`Rs.${item.price.toFixed(2)}`, 350, rowTop);
    doc.text(`Rs.${(item.quantity * item.price).toFixed(2)}`, 450, rowTop);
    rowTop += 20;
  });

  doc.moveTo(50, rowTop).lineTo(550, rowTop).stroke();
}

function addTotals(doc, order) {
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const vat = Math.round(((subtotal * 18) / 100));
  const total = subtotal + vat;

  doc.fontSize(10);
  doc.text('Subtotal:', 400, 300);
  doc.text(`Rs.${subtotal.toFixed(2)}`, 490, 300);
  doc.text('GST 18%:', 400, 315);
  doc.text(`Rs.${vat.toFixed(2)}`, 490, 315);
  doc.moveTo(400, 330).lineTo(550, 330).stroke();
  doc.fontSize(12);
  doc.text('Total:', 400, 340);
  doc.text(`Rs.${total.toFixed(2)}`, 475, 340);
}

module.exports = {
  createInvoice,
  addCustomerInformation,
  addHeader,
  addInvoiceTable,
  addLogo,
  addTotals
};