// ============================================
// Invoice types for PDF generation
// ============================================

export interface InvoiceSupplier {
    name: string;
    street: string;
    city: string;
    country: string;
    companyId: string;
    email: string;
    website: string;
}

export interface InvoiceCustomer {
    name: string;
    street: string;
    city: string;
    country: string;
    email: string;
}

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPrice: string;      // formatted, e.g. "490 CZK"
    total: string;           // formatted, e.g. "490 CZK"
}

export interface InvoicePaymentInfo {
    method: string;          // e.g. "Credit card (Stripe)"
    orderId: string;         // e.g. "ORD-2026-0001"
    paidOn: string;          // formatted date string
}

export interface InvoiceData {
    invoiceNumber: string;   // e.g. "2026-0001"
    issueDate: string;
    supplyDate: string;
    dueDate: string;

    supplier: InvoiceSupplier;
    customer: InvoiceCustomer;

    lineItems: InvoiceLineItem[];

    subtotal: string;        // formatted
    vatRate: string;         // e.g. "0%"
    vatAmount: string;       // formatted, e.g. "0 CZK"
    totalAmountDue: string;  // formatted

    currency: string;        // e.g. "CZK"

    payment: InvoicePaymentInfo;
}
