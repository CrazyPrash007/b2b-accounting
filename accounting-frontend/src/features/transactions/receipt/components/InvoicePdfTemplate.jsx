import React, { forwardRef } from "react";

/**
 * InvoicePdfTemplate - A clean, professional tax invoice template
 * Based on the reference image layout - simple and professional
 * 
 * A4 dimensions: 210mm x 297mm
 */
const InvoicePdfTemplate = forwardRef(
  ({ invoice, config }, ref) => {
    const { company, customer, meta, items, summary, bankDetails, paymentDetails, signatory } = invoice;

    // Format currency in Indian format
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Format date to DD Mon YYYY
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Styles
    const styles = {
      container: {
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#333",
        boxSizing: "border-box",
        padding: "0",
      },
      // Header
      headerBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 20px",
        borderBottom: "2px solid #2563eb",
      },
      taxInvoiceTitle: {
        color: "#2563eb",
        fontSize: "14px",
        fontWeight: "bold",
        letterSpacing: "1px",
      },
      originalText: {
        color: "#666",
        fontSize: "10px",
      },
      // Company section
      companySection: {
        display: "flex",
        padding: "15px 20px",
        borderBottom: "1px solid #ddd",
      },
      logoBox: {
        width: "80px",
        marginRight: "15px",
      },
      logo: {
        maxWidth: "80px",
        maxHeight: "50px",
        objectFit: "contain",
      },
      logoPlaceholder: {
        width: "70px",
        height: "50px",
        border: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "9px",
        color: "#999",
      },
      companyDetails: {
        flex: 1,
        textAlign: "center",
      },
      companyName: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#1a56db",
        marginBottom: "3px",
      },
      companyInfo: {
        fontSize: "10px",
        color: "#555",
        lineHeight: "1.5",
      },
      companyLink: {
        color: "#2563eb",
        fontSize: "10px",
      },
      // Customer & Invoice info section
      infoSection: {
        display: "flex",
        borderBottom: "1px solid #ddd",
      },
      customerBox: {
        flex: 1,
        padding: "12px 20px",
        borderRight: "1px solid #ddd",
      },
      invoiceBox: {
        width: "200px",
        padding: "12px 20px",
      },
      sectionLabel: {
        fontWeight: "bold",
        color: "#333",
        marginBottom: "5px",
        fontSize: "11px",
      },
      customerName: {
        fontWeight: "bold",
        marginBottom: "3px",
      },
      customerInfo: {
        fontSize: "10px",
        color: "#555",
        lineHeight: "1.5",
      },
      invoiceTable: {
        width: "100%",
        fontSize: "10px",
      },
      invoiceLabel: {
        color: "#555",
        padding: "2px 0",
      },
      invoiceValue: {
        textAlign: "right",
        padding: "2px 0",
        fontWeight: "500",
      },
      // Items table
      itemsTable: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "10px",
      },
      tableHeader: {
        background: "#f5f5f5",
        borderBottom: "1px solid #ddd",
      },
      th: {
        padding: "8px 10px",
        textAlign: "left",
        fontWeight: "600",
        borderRight: "1px solid #ddd",
        color: "#333",
      },
      thCenter: {
        padding: "8px 10px",
        textAlign: "center",
        fontWeight: "600",
        borderRight: "1px solid #ddd",
        color: "#333",
      },
      thRight: {
        padding: "8px 10px",
        textAlign: "right",
        fontWeight: "600",
        borderRight: "1px solid #ddd",
        color: "#333",
      },
      thLast: {
        padding: "8px 10px",
        textAlign: "right",
        fontWeight: "600",
        color: "#333",
      },
      td: {
        padding: "8px 10px",
        borderBottom: "1px solid #eee",
        borderRight: "1px solid #eee",
      },
      tdCenter: {
        padding: "8px 10px",
        textAlign: "center",
        borderBottom: "1px solid #eee",
        borderRight: "1px solid #eee",
      },
      tdRight: {
        padding: "8px 10px",
        textAlign: "right",
        borderBottom: "1px solid #eee",
        borderRight: "1px solid #eee",
      },
      tdLast: {
        padding: "8px 10px",
        textAlign: "right",
        borderBottom: "1px solid #eee",
      },
      // Totals
      totalRow: {
        background: "#f9f9f9",
        fontWeight: "bold",
      },
      grandTotal: {
        fontSize: "12px",
        fontWeight: "bold",
      },
      // Amount in words
      amountWords: {
        padding: "8px 20px",
        borderTop: "1px solid #ddd",
        borderBottom: "1px solid #ddd",
        fontSize: "10px",
        background: "#fafafa",
      },
      // Amount payable
      amountPayable: {
        display: "flex",
        justifyContent: "flex-end",
        padding: "8px 20px",
        borderBottom: "1px solid #ddd",
        fontSize: "11px",
      },
      // Bank & signature section
      bankSection: {
        display: "flex",
        borderBottom: "1px solid #ddd",
      },
      bankDetails: {
        flex: 1,
        padding: "12px 20px",
        borderRight: "1px solid #ddd",
      },
      qrSection: {
        width: "140px",
        padding: "12px 15px",
        borderRight: "1px solid #ddd",
        textAlign: "center",
      },
      signatorySection: {
        width: "160px",
        padding: "12px 15px",
        textAlign: "right",
      },
      bankLabel: {
        fontWeight: "bold",
        marginBottom: "8px",
        fontSize: "11px",
      },
      bankRow: {
        display: "flex",
        fontSize: "10px",
        marginBottom: "3px",
      },
      bankKey: {
        width: "70px",
        color: "#555",
      },
      bankValue: {
        fontWeight: "500",
      },
      qrBox: {
        width: "70px",
        height: "70px",
        border: "1px solid #ddd",
        margin: "5px auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "8px",
        color: "#999",
      },
      qrLabel: {
        fontSize: "9px",
        color: "#555",
        marginBottom: "5px",
      },
      // Signatures
      signatureRow: {
        display: "flex",
        borderBottom: "1px solid #ddd",
      },
      receiverSig: {
        flex: 1,
        padding: "30px 20px 10px",
        borderRight: "1px solid #ddd",
      },
      authSig: {
        width: "160px",
        padding: "30px 15px 10px",
        textAlign: "center",
      },
      sigLabel: {
        fontSize: "9px",
        color: "#555",
        borderTop: "1px solid #333",
        paddingTop: "5px",
      },
      // Footer
      footer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 20px",
        fontSize: "9px",
        color: "#666",
        background: "#f8f8f8",
      },
    };

    return (
      <div ref={ref} id="invoice-pdf-container" style={styles.container}>
        {/* Header Bar */}
        <div style={styles.headerBar}>
          <span style={styles.taxInvoiceTitle}>TAX INVOICE</span>
          <span style={styles.originalText}>ORIGINAL FOR RECIPIENT</span>
        </div>

        {/* Company Section */}
        <div style={styles.companySection}>
          <div style={styles.logoBox}>
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} style={styles.logo} crossOrigin="anonymous" />
            ) : (
              <div style={styles.logoPlaceholder}>LOGO</div>
            )}
          </div>
          <div style={styles.companyDetails}>
            <div style={styles.companyName}>{company.name}</div>
            <div style={styles.companyInfo}>
              GSTIN: {company.gstin}<br />
              {company.addressLine1}{company.addressLine2 && `, ${company.addressLine2}`}<br />
              {company.city}, {company.state}, {company.pincode}<br />
              {company.phone && <>Mobile: {company.phone}</>}
              {company.phone && company.email && <> &nbsp; </>}
              {company.email && <>Email: {company.email}</>}
            </div>
            {company.website && (
              <div style={styles.companyLink}>Website: {company.website}</div>
            )}
          </div>
        </div>

        {/* Customer & Invoice Info */}
        <div style={styles.infoSection}>
          <div style={styles.customerBox}>
            <div style={styles.sectionLabel}>Customer Details:</div>
            <div style={styles.customerName}>
              {customer.name}
              {customer.partyName && ` (${customer.partyName})`}
            </div>
            {customer.phone && (
              <div style={styles.customerInfo}>Ph: {customer.phone}</div>
            )}
            <div style={styles.customerInfo}>
              <strong>Billing Address:</strong><br />
              {customer.billingAddressLine1}
              {customer.billingAddressLine2 && <><br />{customer.billingAddressLine2}</>}
              <br />
              {customer.city}, {customer.state}, {customer.pincode}
            </div>
            {customer.gstin && (
              <div style={{ ...styles.customerInfo, marginTop: "5px" }}>
                GSTIN: {customer.gstin}
              </div>
            )}
          </div>
          <div style={styles.invoiceBox}>
            <table style={styles.invoiceTable}>
              <tbody>
                <tr>
                  <td style={styles.invoiceLabel}>Invoice #:</td>
                  <td style={styles.invoiceValue}>{meta.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={styles.invoiceLabel}>Invoice Date:</td>
                  <td style={styles.invoiceValue}>{formatDate(meta.invoiceDate)}</td>
                </tr>
                {meta.dueDate && (
                  <tr>
                    <td style={styles.invoiceLabel}>Due Date:</td>
                    <td style={styles.invoiceValue}>{formatDate(meta.dueDate)}</td>
                  </tr>
                )}
                {meta.placeOfSupply && (
                  <tr>
                    <td style={styles.invoiceLabel}>Place of Supply:</td>
                    <td style={styles.invoiceValue}>{meta.placeOfSupply}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ padding: "0 20px" }}>
          <table style={styles.itemsTable}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={{ ...styles.thCenter, width: "30px" }}>#</th>
                <th style={styles.th}>Item</th>
                <th style={{ ...styles.thCenter, width: "70px" }}>HSN/SAC</th>
                <th style={{ ...styles.thCenter, width: "45px" }}>Tax</th>
                <th style={{ ...styles.thCenter, width: "60px" }}>Qty</th>
                <th style={{ ...styles.thRight, width: "80px" }}>Rate / Item</th>
                <th style={{ ...styles.thLast, width: "90px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td style={styles.tdCenter}>{item.srNo || index + 1}</td>
                  <td style={styles.td}>{item.description}</td>
                  <td style={styles.tdCenter}>{item.hsnSac || "-"}</td>
                  <td style={styles.tdCenter}>{item.taxPercent ? `${item.taxPercent}%` : "-"}</td>
                  <td style={styles.tdCenter}>
                    {item.quantity} {item.unit || "PCS"}
                  </td>
                  <td style={styles.tdRight}>{formatCurrency(item.rate)}</td>
                  <td style={styles.tdLast}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}

              {/* Delivery/Shipping Charges */}
              {summary.deliveryCharges > 0 && (
                <tr>
                  <td colSpan={4} style={styles.td}></td>
                  <td colSpan={2} style={{ ...styles.tdRight, fontWeight: "500" }}>
                    Delivery/Shipping Charges<br />
                    <span style={{ fontSize: "9px", color: "#666" }}>Taxable Amount</span>
                  </td>
                  <td style={styles.tdLast}>
                    {formatCurrency(summary.deliveryCharges)}<br />
                    <span style={{ fontSize: "9px" }}>{formatCurrency(summary.taxableAmount)}</span>
                  </td>
                </tr>
              )}

              {/* Total Row */}
              <tr style={styles.totalRow}>
                <td colSpan={4} style={{ ...styles.tdRight, fontWeight: "bold" }}>Total</td>
                <td style={{ ...styles.tdCenter, fontWeight: "bold" }}>{summary.totalQuantity}</td>
                <td style={styles.tdRight}></td>
                <td style={{ ...styles.tdLast, ...styles.grandTotal }}>₹{formatCurrency(summary.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div style={styles.amountWords}>
          <strong>Amount Chargeable (in words):</strong> {summary.amountInWords}
        </div>

        {/* Amount Payable */}
        <div style={styles.amountPayable}>
          <span style={{ marginRight: "20px", color: "#555" }}>Amount Payable:</span>
          <span style={{ fontWeight: "bold", fontSize: "12px" }}>₹{formatCurrency(summary.grandTotal)}</span>
        </div>

        {/* Bank Details & QR & Signatory */}
        <div style={styles.bankSection}>
          <div style={styles.bankDetails}>
            <div style={styles.bankLabel}>Bank Details:</div>
            {bankDetails ? (
              <>
                <div style={styles.bankRow}>
                  <span style={styles.bankKey}>Bank:</span>
                  <span style={styles.bankValue}>{bankDetails.bankName}</span>
                </div>
                <div style={styles.bankRow}>
                  <span style={styles.bankKey}>Account #:</span>
                  <span style={styles.bankValue}>{bankDetails.accountNumber}</span>
                </div>
                <div style={styles.bankRow}>
                  <span style={styles.bankKey}>IFSC Code:</span>
                  <span style={styles.bankValue}>{bankDetails.ifscCode}</span>
                </div>
                <div style={styles.bankRow}>
                  <span style={styles.bankKey}>Branch:</span>
                  <span style={styles.bankValue}>{bankDetails.branch}</span>
                </div>
              </>
            ) : (
              <div style={{ color: "#999", fontSize: "10px" }}>Bank details not available</div>
            )}
          </div>
          <div style={styles.qrSection}>
            <div style={styles.qrLabel}>Pay using UPI:</div>
            {/* TODO: wire UPI QR code URL from backend */}
            {paymentDetails?.upiQrUrl ? (
              <img src={paymentDetails.upiQrUrl} alt="UPI QR" style={{ width: "70px", height: "70px" }} crossOrigin="anonymous" />
            ) : (
              <div style={styles.qrBox}>QR Code</div>
            )}
          </div>
          <div style={styles.signatorySection}>
            <div style={{ fontSize: "10px", color: "#555", marginBottom: "5px" }}>
              For {company.name}
            </div>
            {/* TODO: wire signatory name and signature image from backend */}
            <div style={{ minHeight: "40px" }}>
              {signatory?.signatureImageUrl ? (
                <img src={signatory.signatureImageUrl} alt="Signature" style={{ maxHeight: "35px" }} crossOrigin="anonymous" />
              ) : null}
            </div>
            <div style={{ fontSize: "9px", color: "#555", marginTop: "10px" }}>
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* Signature Row */}
        <div style={styles.signatureRow}>
          <div style={styles.receiverSig}>
            <div style={styles.sigLabel}>Receiver's Signature</div>
          </div>
          <div style={styles.authSig}>
            <div style={styles.sigLabel}>Authorized Signatory</div>
          </div>
        </div>

        {/* Footer */}
        {/* TODO: wire footer text / watermark from configurable settings */}
        <div style={styles.footer}>
          <div>
            {config?.footerText || "This is a computer generated invoice."}
          </div>
          {config?.poweredByText && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span>{config.poweredByText}</span>
              {config.poweredByLogoUrl && (
                <img src={config.poweredByLogoUrl} alt="" style={{ height: "18px" }} crossOrigin="anonymous" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InvoicePdfTemplate.displayName = "InvoicePdfTemplate";

export default InvoicePdfTemplate;
