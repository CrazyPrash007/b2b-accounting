// Invoice types for PDF export
// These types define the structure of invoice data used for PDF generation
// Note: These are JSDoc type definitions for JavaScript

/**
 * @typedef {Object} Company
 * @property {string} name
 * @property {string} gstin
 * @property {string} addressLine1
 * @property {string} [addressLine2]
 * @property {string} city
 * @property {string} state
 * @property {string} pincode
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [website]
 * @property {string} [logoUrl]
 */

/**
 * @typedef {Object} Customer
 * @property {string} name
 * @property {string} [partyName]
 * @property {string} [phone]
 * @property {string} billingAddressLine1
 * @property {string} [billingAddressLine2]
 * @property {string} city
 * @property {string} state
 * @property {string} pincode
 * @property {string} [gstin]
 */

/**
 * @typedef {Object} InvoiceItem
 * @property {string|number} id
 * @property {number} srNo
 * @property {string} description
 * @property {string} [hsnSac]
 * @property {number} [taxPercent]
 * @property {number} quantity
 * @property {string} [unit]
 * @property {number} rate
 * @property {number} amount
 */

/**
 * @typedef {Object} InvoiceMeta
 * @property {string} invoiceNumber
 * @property {string} invoiceDate - ISO or formatted date string
 * @property {string} [dueDate]
 * @property {string} [placeOfSupply]
 */

/**
 * @typedef {Object} InvoiceSummary
 * @property {number} totalQuantity
 * @property {number} [deliveryCharges]
 * @property {number} taxableAmount
 * @property {number} grandTotal
 * @property {string} amountInWords
 */

/**
 * @typedef {Object} BankDetails
 * @property {string} bankName
 * @property {string} accountNumber
 * @property {string} ifscCode
 * @property {string} branch
 */

/**
 * @typedef {Object} PaymentDetails
 * @property {string} [upiQrUrl]
 */

/**
 * @typedef {Object} Signatory
 * @property {string} [name]
 * @property {string} [signatureImageUrl]
 */

/**
 * @typedef {Object} InvoiceData
 * @property {Company} company
 * @property {Customer} customer
 * @property {InvoiceMeta} meta
 * @property {InvoiceItem[]} items
 * @property {InvoiceSummary} summary
 * @property {BankDetails} [bankDetails]
 * @property {PaymentDetails} [paymentDetails]
 * @property {Signatory} [signatory]
 */

/**
 * Configuration for footer/watermark
 * @typedef {Object} InvoiceConfig
 * @property {string} [footerText]
 * @property {string} [watermarkText]
 * @property {string} [termsAndConditions]
 * @property {string} [poweredByText]
 * @property {string} [poweredByLogoUrl]
 */

// Export empty object to make this a module
export default {};
