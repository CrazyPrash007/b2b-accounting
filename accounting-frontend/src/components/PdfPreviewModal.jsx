import React, { useState, useEffect } from "react";

/**
 * PdfPreviewModal - Modal for previewing and downloading PDFs from backend
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.fetchPdfBlob - Async function that returns PDF blob
 * @param {string} props.title - Modal title (e.g., "Invoice Preview")
 * @param {string} props.filename - Filename for download (e.g., "Invoice_001.pdf")
 * @param {Object} props.shareData - Optional data for sharing (partyName, invoiceNo, amount, type)
 */
export default function PdfPreviewModal({ 
    isOpen, 
    onClose, 
    fetchPdfBlob, 
    title = "PDF Preview", 
    filename = "document.pdf",
    shareData = null // { partyName, invoiceNo, amount, type: 'sale'|'purchase'|'receipt'|'payment' }
}) {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && fetchPdfBlob) {
            loadPdf();
        }

        return () => {
            // Cleanup: revoke the object URL when modal closes
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen]);

    const loadPdf = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const blob = await fetchPdfBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (err) {
            console.error("Failed to load PDF:", err);
            setError(err?.message || "Failed to load PDF");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Generate WhatsApp share message
    const generateShareMessage = () => {
        if (!shareData) return `Please find attached ${title}`;
        
        const { partyName, invoiceNo, amount, type } = shareData;
        const typeLabel = {
            sale: 'Sales Invoice',
            purchase: 'Purchase Invoice',
            receipt: 'Payment Receipt',
            payment: 'Payment Voucher'
        }[type] || 'Document';
        
        let message = `Hi${partyName ? ` ${partyName}` : ''},\n\n`;
        message += `Please find the details of your ${typeLabel}:\n`;
        if (invoiceNo) message += `📄 ${type === 'sale' || type === 'purchase' ? 'Invoice' : 'Receipt'} No: ${invoiceNo}\n`;
        if (amount) message += `💰 Amount: ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
        message += `\nPlease download the PDF to view the complete document.\n`;
        message += `\nThank you for your business!`;
        
        return message;
    };

    // Share via WhatsApp (opens WhatsApp with pre-filled message)
    const handleWhatsAppShare = () => {
        const message = encodeURIComponent(generateShareMessage());
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    // Native share (uses Web Share API if available)
    const handleNativeShare = async () => {
        if (navigator.share && pdfUrl) {
            try {
                // Try to share with file
                const blob = await (await fetch(pdfUrl)).blob();
                const file = new File([blob], filename, { type: 'application/pdf' });
                
                await navigator.share({
                    title: title,
                    text: generateShareMessage(),
                    files: [file]
                });
            } catch (err) {
                // Fall back to text-only share
                try {
                    await navigator.share({
                        title: title,
                        text: generateShareMessage()
                    });
                } catch (shareErr) {
                    console.error('Share failed:', shareErr);
                }
            }
        } else {
            // Fallback: copy message to clipboard
            try {
                await navigator.clipboard.writeText(generateShareMessage());
                alert('Message copied to clipboard! You can now paste it to share.');
            } catch (err) {
                console.error('Copy failed:', err);
            }
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <div className="flex items-center gap-3">
                        {pdfUrl && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download PDF
                            </button>
                        )}
                        {pdfUrl && (
                            <>
                                {/* WhatsApp Share Button */}
                                <button
                                    onClick={handleWhatsAppShare}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                                    title="Share via WhatsApp"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    WhatsApp
                                </button>
                                {/* Native Share Button */}
                                <button
                                    onClick={handleNativeShare}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                                    title="Share"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-gray-100">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-gray-600">Loading PDF...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-600 font-medium mb-2">Failed to load PDF</p>
                                <p className="text-gray-600 text-sm">{error}</p>
                                <button
                                    onClick={loadPdf}
                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {pdfUrl && !isLoading && !error && (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            title={title}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
