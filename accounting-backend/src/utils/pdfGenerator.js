// src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

/**
 * Helper to format currency
 */
function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Helper to format date
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Draw a horizontal line
 */
function drawLine(doc, y, x1 = 50, x2 = 550) {
    doc.moveTo(x1, y).lineTo(x2, y).stroke();
}

/**
 * Generate Sales Invoice PDF
 */
async function generateSalesInvoicePDF(saleData, companyData, customerData, receipts = []) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('ORIGINAL FOR RECIPIENT', { align: 'center' });
            doc.moveDown();

            // Company Details (Left) and Invoice Details (Right)
            const startY = doc.y;
            
            // Company Details
            doc.fontSize(12).font('Helvetica-Bold').text(companyData.companyName || 'Company Name', 50, startY);
            doc.fontSize(9).font('Helvetica');
            if (saleData.withGst && companyData.gst) {
                doc.text(`GSTIN: ${companyData.gst}`);
            }
            doc.text(companyData.address1 || '');
            if (companyData.address2) doc.text(companyData.address2);
            const cityState = [companyData.city, companyData.state].filter(Boolean).join(', ');
            if (cityState) doc.text(cityState);
            if (companyData.pincode) doc.text(`Pin: ${companyData.pincode}`);
            if (companyData.mobile) doc.text(`Mobile: ${companyData.mobile}`);
            if (companyData.email) doc.text(`Email: ${companyData.email}`);

            // Invoice Details (Right side)
            const rightX = 350;
            doc.fontSize(9).font('Helvetica-Bold').text('Invoice #:', rightX, startY);
            doc.font('Helvetica').text(`${saleData.invoicePrefix}${saleData.invoiceNumber}${saleData.invoiceSuffix}`, rightX + 80, startY);
            
            doc.font('Helvetica-Bold').text('Invoice Date:', rightX, doc.y);
            doc.font('Helvetica').text(formatDate(saleData.invoiceDate), rightX + 80, doc.y - 12);
            
            if (saleData.withGst && companyData.state) {
                doc.font('Helvetica-Bold').text('Place of Supply:', rightX, doc.y + 5);
                doc.font('Helvetica').text(companyData.state, rightX + 80, doc.y - 12);
            }

            doc.y = Math.max(doc.y, startY + 120);
            doc.moveDown();
            drawLine(doc, doc.y);
            doc.moveDown(0.5);

            // Customer Details
            doc.fontSize(10).font('Helvetica-Bold').text('Customer Details:', 50);
            doc.fontSize(9).font('Helvetica');
            doc.text(customerData?.customerName || saleData.customer || 'Walk-in Customer');
            if (customerData?.companyName) doc.text(customerData.companyName);
            if (saleData.withGst && customerData?.gstType && customerData.gstType !== 'Unregistered') {
                doc.text(`GSTIN: ${customerData.gstType}`);
            }
            if (customerData?.billingAddress) doc.text(customerData.billingAddress);
            const custCity = [customerData?.billingCity, customerData?.billingState].filter(Boolean).join(', ');
            if (custCity) doc.text(custCity);
            if (customerData?.mobileNumber) doc.text(`Ph: ${customerData.mobileNumber}`);

            doc.moveDown();
            drawLine(doc, doc.y);
            doc.moveDown(0.5);

            // Items Table
            const tableTop = doc.y;
            const tableHeaders = saleData.withGst 
                ? ['#', 'Item', 'HSN/SAC', 'Qty', 'Unit', 'Rate', 'Taxable Value', 'Tax %', 'Tax Amount', 'Amount']
                : ['#', 'Item', 'Qty', 'Unit', 'Rate', 'Amount'];
            
            const colWidths = saleData.withGst
                ? [25, 120, 60, 35, 40, 50, 70, 45, 60, 75]
                : [30, 200, 50, 50, 80, 90];

            // Table Headers
            doc.fontSize(8).font('Helvetica-Bold');
            let xPos = 50;
            tableHeaders.forEach((header, i) => {
                doc.text(header, xPos, tableTop, { width: colWidths[i], align: i === 0 ? 'left' : i === 1 ? 'left' : 'right' });
                xPos += colWidths[i];
            });

            drawLine(doc, tableTop + 15);
            let yPos = tableTop + 20;

            // Table Rows
            doc.font('Helvetica').fontSize(8);
            saleData.items.forEach((item, index) => {
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                }

                xPos = 50;
                const qty = Number(item.qty) || 0;
                const rate = Number(item.rate || item.sellPrice) || 0;
                const gstPercent = saleData.withGst ? (Number(item.gstPercent) || 0) : 0;
                const gstType = item.gstType || 'Excluded';

                let taxableValue, taxAmount, finalAmount;
                
                if (saleData.withGst && gstPercent > 0) {
                    if (gstType === 'Excluded') {
                        taxableValue = qty * rate;
                        taxAmount = taxableValue * gstPercent / 100;
                        finalAmount = taxableValue + taxAmount;
                    } else {
                        finalAmount = qty * rate;
                        taxableValue = finalAmount / (1 + gstPercent / 100);
                        taxAmount = finalAmount - taxableValue;
                    }
                } else {
                    taxableValue = qty * rate;
                    taxAmount = 0;
                    finalAmount = taxableValue;
                }

                if (saleData.withGst) {
                    doc.text(`${index + 1}`, xPos, yPos, { width: colWidths[0], align: 'left' });
                    xPos += colWidths[0];
                    doc.text(item.name || '', xPos, yPos, { width: colWidths[1], align: 'left' });
                    xPos += colWidths[1];
                    doc.text(item.hsnNo || '-', xPos, yPos, { width: colWidths[2], align: 'right' });
                    xPos += colWidths[2];
                    doc.text(qty.toString(), xPos, yPos, { width: colWidths[3], align: 'right' });
                    xPos += colWidths[3];
                    doc.text(item.unit || 'PCS', xPos, yPos, { width: colWidths[4], align: 'right' });
                    xPos += colWidths[4];
                    doc.text(rate.toFixed(2), xPos, yPos, { width: colWidths[5], align: 'right' });
                    xPos += colWidths[5];
                    doc.text(taxableValue.toFixed(2), xPos, yPos, { width: colWidths[6], align: 'right' });
                    xPos += colWidths[6];
                    doc.text(`${gstPercent}%`, xPos, yPos, { width: colWidths[7], align: 'right' });
                    xPos += colWidths[7];
                    doc.text(taxAmount.toFixed(2), xPos, yPos, { width: colWidths[8], align: 'right' });
                    xPos += colWidths[8];
                    doc.text(finalAmount.toFixed(2), xPos, yPos, { width: colWidths[9], align: 'right' });
                } else {
                    doc.text(`${index + 1}`, xPos, yPos, { width: colWidths[0], align: 'left' });
                    xPos += colWidths[0];
                    doc.text(item.name || '', xPos, yPos, { width: colWidths[1], align: 'left' });
                    xPos += colWidths[1];
                    doc.text(qty.toString(), xPos, yPos, { width: colWidths[2], align: 'right' });
                    xPos += colWidths[2];
                    doc.text(item.unit || 'PCS', xPos, yPos, { width: colWidths[3], align: 'right' });
                    xPos += colWidths[3];
                    doc.text(rate.toFixed(2), xPos, yPos, { width: colWidths[4], align: 'right' });
                    xPos += colWidths[4];
                    doc.text(finalAmount.toFixed(2), xPos, yPos, { width: colWidths[5], align: 'right' });
                }

                yPos += 15;
            });

            drawLine(doc, yPos);
            yPos += 10;

            // Totals Section
            const totalsX = 380;
            doc.fontSize(9).font('Helvetica');

            if (saleData.withGst) {
                doc.text('Taxable Amount:', totalsX, yPos);
                doc.text(formatCurrency(saleData.taxableAmount), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;

                doc.text('GST Amount:', totalsX, yPos);
                doc.text(formatCurrency(saleData.gstAmount), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;

                doc.text('Sub Total:', totalsX, yPos);
                doc.text(formatCurrency(saleData.subTotal), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;
            }

            if (saleData.discount > 0) {
                doc.text('Discount:', totalsX, yPos);
                doc.text(formatCurrency(saleData.discount), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;
            }

            if (saleData.additionalCharges && saleData.additionalCharges.length > 0) {
                saleData.additionalCharges.forEach(charge => {
                    doc.text(`${charge.name}:`, totalsX, yPos);
                    doc.text(formatCurrency(charge.amount), totalsX + 120, yPos, { align: 'right' });
                    yPos += 15;
                });
            }

            doc.font('Helvetica-Bold');
            doc.text('Total Amount:', totalsX, yPos);
            doc.text(formatCurrency(saleData.totalAmount), totalsX + 120, yPos, { align: 'right' });
            yPos += 20;

            // Payment History
            if (receipts && receipts.length > 0) {
                drawLine(doc, yPos);
                yPos += 10;
                doc.fontSize(9).font('Helvetica-Bold').text('Payment History:', 50, yPos);
                yPos += 15;
                
                doc.fontSize(8).font('Helvetica');
                receipts.forEach(receipt => {
                    doc.text(`${formatDate(receipt.date)} - ${receipt.paymentMethod} - ${formatCurrency(receipt.amount)}`, 50, yPos);
                    yPos += 12;
                });

                yPos += 5;
                doc.fontSize(9).font('Helvetica-Bold');
                doc.text('Total Paid:', totalsX, yPos);
                doc.text(formatCurrency(saleData.paidAmount || 0), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;
                
                doc.text('Amount Due:', totalsX, yPos);
                doc.text(formatCurrency(saleData.dueAmount || 0), totalsX + 120, yPos, { align: 'right' });
                yPos += 20;
            }

            // Footer
            doc.fontSize(7).font('Helvetica').text(
                'This is a computer generated document and requires no signature.',
                50,
                750,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Purchase Invoice PDF
 */
async function generatePurchaseInvoicePDF(purchaseData, companyData, vendorData, payments = []) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('ORIGINAL FOR RECIPIENT', { align: 'center' });
            doc.moveDown();

            // Company Details (Left) and Invoice Details (Right)
            const startY = doc.y;
            
            // Company Details
            doc.fontSize(12).font('Helvetica-Bold').text(companyData.companyName || 'Company Name', 50, startY);
            doc.fontSize(9).font('Helvetica');
            if (purchaseData.withGst && companyData.gst) {
                doc.text(`GSTIN: ${companyData.gst}`);
            }
            doc.text(companyData.address1 || '');
            if (companyData.address2) doc.text(companyData.address2);
            const cityState = [companyData.city, companyData.state].filter(Boolean).join(', ');
            if (cityState) doc.text(cityState);
            if (companyData.pincode) doc.text(`Pin: ${companyData.pincode}`);
            if (companyData.mobile) doc.text(`Mobile: ${companyData.mobile}`);
            if (companyData.email) doc.text(`Email: ${companyData.email}`);

            // Invoice Details (Right side)
            const rightX = 350;
            doc.fontSize(9).font('Helvetica-Bold').text('Invoice #:', rightX, startY);
            doc.font('Helvetica').text(`${purchaseData.invoicePrefix}${purchaseData.invoiceNumber}${purchaseData.invoiceSuffix}`, rightX + 80, startY);
            
            doc.font('Helvetica-Bold').text('Invoice Date:', rightX, doc.y);
            doc.font('Helvetica').text(formatDate(purchaseData.invoiceDate), rightX + 80, doc.y - 12);
            
            if (purchaseData.withGst && companyData.state) {
                doc.font('Helvetica-Bold').text('Place of Supply:', rightX, doc.y + 5);
                doc.font('Helvetica').text(companyData.state, rightX + 80, doc.y - 12);
            }

            doc.y = Math.max(doc.y, startY + 120);
            doc.moveDown();
            drawLine(doc, doc.y);
            doc.moveDown(0.5);

            // Vendor Details
            doc.fontSize(10).font('Helvetica-Bold').text('Vendor Details:', 50);
            doc.fontSize(9).font('Helvetica');
            doc.text(vendorData?.vendorName || purchaseData.supplier || 'Vendor');
            if (vendorData?.companyName) doc.text(vendorData.companyName);
            if (purchaseData.withGst && vendorData?.gstType && vendorData.gstType !== 'Unregistered') {
                doc.text(`GSTIN: ${vendorData.gstType}`);
            }
            if (vendorData?.billingAddress) doc.text(vendorData.billingAddress);
            const vendorCity = [vendorData?.billingCity, vendorData?.billingState].filter(Boolean).join(', ');
            if (vendorCity) doc.text(vendorCity);
            if (vendorData?.mobileNumber) doc.text(`Ph: ${vendorData.mobileNumber}`);

            doc.moveDown();
            drawLine(doc, doc.y);
            doc.moveDown(0.5);

            // Items Table
            const tableTop = doc.y;
            const tableHeaders = purchaseData.withGst 
                ? ['#', 'Item', 'HSN/SAC', 'Qty', 'Rate', 'Taxable Value', 'Tax %', 'Tax Amount', 'Amount']
                : ['#', 'Item', 'Qty', 'Rate', 'Amount'];
            
            const colWidths = purchaseData.withGst
                ? [25, 140, 60, 40, 50, 70, 45, 60, 75]
                : [30, 250, 60, 80, 90];

            // Table Headers
            doc.fontSize(8).font('Helvetica-Bold');
            let xPos = 50;
            tableHeaders.forEach((header, i) => {
                doc.text(header, xPos, tableTop, { width: colWidths[i], align: i === 0 ? 'left' : i === 1 ? 'left' : 'right' });
                xPos += colWidths[i];
            });

            drawLine(doc, tableTop + 15);
            let yPos = tableTop + 20;

            // Table Rows
            doc.font('Helvetica').fontSize(8);
            purchaseData.items.forEach((item, index) => {
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                }

                xPos = 50;
                const qty = Number(item.qty) || 0;
                const rate = Number(item.rate) || 0;
                const gstPercent = purchaseData.withGst ? (Number(item.gstPercent) || 0) : 0;
                const gstType = item.gstType || 'Excluded';

                let taxableValue, taxAmount, finalAmount;
                
                if (purchaseData.withGst && gstPercent > 0) {
                    if (gstType === 'Excluded') {
                        taxableValue = qty * rate;
                        taxAmount = taxableValue * gstPercent / 100;
                        finalAmount = taxableValue + taxAmount;
                    } else {
                        finalAmount = qty * rate;
                        taxableValue = finalAmount / (1 + gstPercent / 100);
                        taxAmount = finalAmount - taxableValue;
                    }
                } else {
                    taxableValue = qty * rate;
                    taxAmount = 0;
                    finalAmount = taxableValue;
                }

                if (purchaseData.withGst) {
                    doc.text(`${index + 1}`, xPos, yPos, { width: colWidths[0], align: 'left' });
                    xPos += colWidths[0];
                    doc.text(item.name || item.goodsService || '', xPos, yPos, { width: colWidths[1], align: 'left' });
                    xPos += colWidths[1];
                    doc.text(item.hsnNo || '-', xPos, yPos, { width: colWidths[2], align: 'right' });
                    xPos += colWidths[2];
                    doc.text(qty.toString(), xPos, yPos, { width: colWidths[3], align: 'right' });
                    xPos += colWidths[3];
                    doc.text(rate.toFixed(2), xPos, yPos, { width: colWidths[4], align: 'right' });
                    xPos += colWidths[4];
                    doc.text(taxableValue.toFixed(2), xPos, yPos, { width: colWidths[5], align: 'right' });
                    xPos += colWidths[5];
                    doc.text(`${gstPercent}%`, xPos, yPos, { width: colWidths[6], align: 'right' });
                    xPos += colWidths[6];
                    doc.text(taxAmount.toFixed(2), xPos, yPos, { width: colWidths[7], align: 'right' });
                    xPos += colWidths[7];
                    doc.text(finalAmount.toFixed(2), xPos, yPos, { width: colWidths[8], align: 'right' });
                } else {
                    doc.text(`${index + 1}`, xPos, yPos, { width: colWidths[0], align: 'left' });
                    xPos += colWidths[0];
                    doc.text(item.name || item.goodsService || '', xPos, yPos, { width: colWidths[1], align: 'left' });
                    xPos += colWidths[1];
                    doc.text(qty.toString(), xPos, yPos, { width: colWidths[2], align: 'right' });
                    xPos += colWidths[2];
                    doc.text(rate.toFixed(2), xPos, yPos, { width: colWidths[3], align: 'right' });
                    xPos += colWidths[3];
                    doc.text(finalAmount.toFixed(2), xPos, yPos, { width: colWidths[4], align: 'right' });
                }

                yPos += 15;
            });

            drawLine(doc, yPos);
            yPos += 10;

            // Totals Section
            const totalsX = 380;
            doc.fontSize(9).font('Helvetica');

            if (purchaseData.withGst) {
                doc.text('Taxable Amount:', totalsX, yPos);
                doc.text(formatCurrency(purchaseData.taxableAmount), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;

                doc.text('GST Amount:', totalsX, yPos);
                doc.text(formatCurrency(purchaseData.gstAmount), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;
            }

            if (purchaseData.discount > 0) {
                doc.text('Discount:', totalsX, yPos);
                doc.text(formatCurrency(purchaseData.discount), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;
            }

            if (purchaseData.additionalCharges && purchaseData.additionalCharges.length > 0) {
                purchaseData.additionalCharges.forEach(charge => {
                    doc.text(`${charge.name}:`, totalsX, yPos);
                    doc.text(formatCurrency(charge.amount), totalsX + 120, yPos, { align: 'right' });
                    yPos += 15;
                });
            }

            doc.font('Helvetica-Bold');
            doc.text('Total Amount:', totalsX, yPos);
            doc.text(formatCurrency(purchaseData.totalAmount), totalsX + 120, yPos, { align: 'right' });
            yPos += 20;

            // Payment History
            if (payments && payments.length > 0) {
                drawLine(doc, yPos);
                yPos += 10;
                doc.fontSize(9).font('Helvetica-Bold').text('Payment History:', 50, yPos);
                yPos += 15;
                
                doc.fontSize(8).font('Helvetica');
                payments.forEach(payment => {
                    doc.text(`${formatDate(payment.date)} - ${payment.paymentMethod} - ${formatCurrency(payment.amount)}`, 50, yPos);
                    yPos += 12;
                });

                yPos += 5;
                doc.fontSize(9).font('Helvetica-Bold');
                doc.text('Total Paid:', totalsX, yPos);
                doc.text(formatCurrency(purchaseData.paidAmount || 0), totalsX + 120, yPos, { align: 'right' });
                yPos += 15;
                
                doc.text('Amount Due:', totalsX, yPos);
                doc.text(formatCurrency(purchaseData.dueAmount || 0), totalsX + 120, yPos, { align: 'right' });
                yPos += 20;
            }

            // Footer
            doc.fontSize(7).font('Helvetica').text(
                'This is a computer generated document and requires no signature.',
                50,
                750,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Receipt PDF (Sales flow)
 */
async function generateReceiptPDF(receiptData, companyData, customerData, invoiceData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text('PAYMENT ACKNOWLEDGEMENT', { align: 'center' });
            doc.moveDown();

            // Company Details
            doc.fontSize(12).font('Helvetica-Bold').text(companyData.companyName || 'Company Name', { align: 'left' });
            doc.fontSize(9).font('Helvetica');
            if (companyData.gst) doc.text(`GSTIN: ${companyData.gst}`);
            doc.text(`${companyData.address1 || ''}`);
            if (companyData.address2) doc.text(companyData.address2);
            const cityState = [companyData.city, companyData.state].filter(Boolean).join(', ');
            if (cityState) doc.text(cityState);
            if (companyData.pincode) doc.text(`Pin: ${companyData.pincode}`);
            if (companyData.mobile) doc.text(`Mobile: ${companyData.mobile}`);
            if (companyData.email) doc.text(`Email: ${companyData.email}`);
            
            doc.moveDown();
            drawLine(doc, doc.y);
            doc.moveDown();

            // Receipt Details
            const leftCol = 50;
            const rightCol = 300;
            let yPos = doc.y;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Receipt No:', leftCol, yPos);
            doc.font('Helvetica').text(receiptData._id || '-', leftCol + 100, yPos);
            
            doc.font('Helvetica-Bold').text('Receipt Date:', rightCol, yPos);
            doc.font('Helvetica').text(formatDate(receiptData.date), rightCol + 100, yPos);
            yPos += 20;

            doc.font('Helvetica-Bold').text('Status:', leftCol, yPos);
            doc.font('Helvetica').text('SUCCESS', leftCol + 100, yPos);
            
            doc.font('Helvetica-Bold').text('Mode:', rightCol, yPos);
            doc.font('Helvetica').text(receiptData.paymentMethod || 'Cash', rightCol + 100, yPos);
            yPos += 20;

            doc.font('Helvetica-Bold').text('Amount:', leftCol, yPos);
            doc.font('Helvetica').text(formatCurrency(receiptData.amount), leftCol + 100, yPos);
            
            if (receiptData.invoiceLabel) {
                doc.font('Helvetica-Bold').text('Invoice #:', rightCol, yPos);
                doc.font('Helvetica').text(receiptData.invoiceLabel, rightCol + 100, yPos);
            }
            yPos += 20;

            if (receiptData.referenceNumber) {
                doc.font('Helvetica-Bold').text('Ref No:', leftCol, yPos);
                doc.font('Helvetica').text(receiptData.referenceNumber, leftCol + 100, yPos);
                yPos += 20;
            }

            if (receiptData.description) {
                doc.font('Helvetica-Bold').text('Notes:', leftCol, yPos);
                doc.font('Helvetica').text(receiptData.description, leftCol + 100, yPos, { width: 400 });
                yPos = doc.y + 10;
            }

            yPos += 10;
            drawLine(doc, yPos);
            yPos += 15;

            // Customer Details
            doc.fontSize(10).font('Helvetica-Bold').text('Customer Details:', leftCol, yPos);
            yPos += 15;
            
            doc.fontSize(9).font('Helvetica');
            doc.text(customerData?.customerName || receiptData.party || 'Customer', leftCol, yPos);
            if (customerData?.companyName) {
                yPos += 12;
                doc.text(customerData.companyName, leftCol, yPos);
            }
            if (customerData?.mobileNumber) {
                yPos += 12;
                doc.text(`Ph: ${customerData.mobileNumber}`, leftCol, yPos);
            }

            // PAID Stamp
            doc.fontSize(50).font('Helvetica-Bold').fillColor('green').opacity(0.3);
            doc.text('PAID', 200, 400, { align: 'center' });
            doc.fillColor('black').opacity(1);

            // Footer
            doc.fontSize(7).font('Helvetica').text(
                'This is a computer generated document and requires no signature.',
                50,
                750,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Payment PDF (Purchase flow)
 */
async function generatePaymentPDF(paymentData, companyData, vendorData, invoiceData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text('PAYMENT ACKNOWLEDGEMENT', { align: 'center' });
            doc.moveDown();

            // Company Details
            doc.fontSize(12).font('Helvetica-Bold').text(companyData.companyName || 'Company Name', { align: 'left' });
            doc.fontSize(9).font('Helvetica');
            if (companyData.gst) doc.text(`GSTIN: ${companyData.gst}`);
            doc.text(`${companyData.address1 || ''}`);
            if (companyData.address2) doc.text(companyData.address2);
            const cityState = [companyData.city, companyData.state].filter(Boolean).join(', ');
            if (cityState) doc.text(cityState);
            if (companyData.pincode) doc.text(`Pin: ${companyData.pincode}`);
            if (companyData.mobile) doc.text(`Mobile: ${companyData.mobile}`);
            if (companyData.email) doc.text(`Email: ${companyData.email}`);
            
            doc.moveDown();
            drawLine(doc, doc.y);
            doc.moveDown();

            // Payment Details
            const leftCol = 50;
            const rightCol = 300;
            let yPos = doc.y;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Payment No:', leftCol, yPos);
            doc.font('Helvetica').text(paymentData._id || '-', leftCol + 100, yPos);
            
            doc.font('Helvetica-Bold').text('Payment Date:', rightCol, yPos);
            doc.font('Helvetica').text(formatDate(paymentData.date), rightCol + 100, yPos);
            yPos += 20;

            doc.font('Helvetica-Bold').text('Status:', leftCol, yPos);
            doc.font('Helvetica').text('SUCCESS', leftCol + 100, yPos);
            
            doc.font('Helvetica-Bold').text('Mode:', rightCol, yPos);
            doc.font('Helvetica').text(paymentData.paymentMethod || 'Cash', rightCol + 100, yPos);
            yPos += 20;

            doc.font('Helvetica-Bold').text('Paid Amount:', leftCol, yPos);
            doc.font('Helvetica').text(formatCurrency(paymentData.amount), leftCol + 100, yPos);
            
            if (paymentData.invoiceLabel) {
                doc.font('Helvetica-Bold').text('Invoice #:', rightCol, yPos);
                doc.font('Helvetica').text(paymentData.invoiceLabel, rightCol + 100, yPos);
            }
            yPos += 20;

            if (paymentData.referenceNumber) {
                doc.font('Helvetica-Bold').text('Ref No:', leftCol, yPos);
                doc.font('Helvetica').text(paymentData.referenceNumber, leftCol + 100, yPos);
                yPos += 20;
            }

            if (paymentData.description) {
                doc.font('Helvetica-Bold').text('Notes:', leftCol, yPos);
                doc.font('Helvetica').text(paymentData.description, leftCol + 100, yPos, { width: 400 });
                yPos = doc.y + 10;
            }

            yPos += 10;
            drawLine(doc, yPos);
            yPos += 15;

            // Vendor Details
            doc.fontSize(10).font('Helvetica-Bold').text('Vendor Details:', leftCol, yPos);
            yPos += 15;
            
            doc.fontSize(9).font('Helvetica');
            doc.text(vendorData?.vendorName || paymentData.party || 'Vendor', leftCol, yPos);
            if (vendorData?.companyName) {
                yPos += 12;
                doc.text(vendorData.companyName, leftCol, yPos);
            }
            if (vendorData?.mobileNumber) {
                yPos += 12;
                doc.text(`Ph: ${vendorData.mobileNumber}`, leftCol, yPos);
            }

            // PAID Stamp
            doc.fontSize(50).font('Helvetica-Bold').fillColor('green').opacity(0.3);
            doc.text('PAID', 200, 400, { align: 'center' });
            doc.fillColor('black').opacity(1);

            // Footer
            doc.fontSize(7).font('Helvetica').text(
                'This is a computer generated document and requires no signature.',
                50,
                750,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateSalesInvoicePDF,
    generatePurchaseInvoicePDF,
    generateReceiptPDF,
    generatePaymentPDF
};
