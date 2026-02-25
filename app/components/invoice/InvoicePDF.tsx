import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceData } from "@/types/invoice";

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: "#ffffff",
        fontFamily: "Helvetica",
        fontSize: 9,
        color: "#333333",
    },

    // ── Header ──────────────────────────────────────────────────────────
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    invoiceTitle: {
        fontSize: 28,
        fontFamily: "Helvetica-Bold",
        color: "#c0392b",
        letterSpacing: 1,
    },
    headerRight: {
        textAlign: "right",
    },
    headerLabel: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#333333",
    },
    headerValue: {
        fontSize: 9,
        color: "#555555",
    },
    headerDueDate: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#c0392b",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 4,
        marginBottom: 2,
    },

    // ── Parties ─────────────────────────────────────────────────────────
    partiesContainer: {
        flexDirection: "row",
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    partyColumn: {
        flex: 1,
    },
    partyTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#888888",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 6,
    },
    partyName: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: "#333333",
        marginBottom: 3,
    },
    partyDetail: {
        fontSize: 9,
        color: "#555555",
        marginBottom: 2,
    },

    // ── Service Details ─────────────────────────────────────────────────
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: "#333333",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#cccccc",
        paddingBottom: 6,
        marginBottom: 8,
    },
    tableHeaderCell: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#666666",
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    colDescription: {
        flex: 4,
    },
    colQty: {
        width: 40,
        textAlign: "center",
    },
    colUnitPrice: {
        width: 70,
        textAlign: "right",
    },
    colTotal: {
        width: 70,
        textAlign: "right",
    },
    tableCell: {
        fontSize: 9,
        color: "#333333",
    },

    // ── Totals ──────────────────────────────────────────────────────────
    totalsContainer: {
        marginTop: 15,
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    totalsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 4,
    },
    totalsLabel: {
        fontSize: 9,
        color: "#666666",
        width: 120,
        textAlign: "right",
        marginRight: 15,
    },
    totalsValue: {
        fontSize: 9,
        color: "#333333",
        width: 80,
        textAlign: "right",
    },
    totalsDueLabel: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: "#333333",
        width: 120,
        textAlign: "right",
        marginRight: 15,
    },
    totalsDueValue: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: "#333333",
        width: 80,
        textAlign: "right",
    },

    // ── Payment Information ─────────────────────────────────────────────
    paymentSection: {
        marginBottom: 30,
    },
    paymentDetail: {
        fontSize: 9,
        color: "#555555",
        marginBottom: 2,
    },

    // ── Footer ──────────────────────────────────────────────────────────
    footer: {
        position: "absolute",
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: "center",
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    footerText: {
        fontSize: 8,
        color: "#999999",
        marginBottom: 2,
    },
});

// ─── Component ─────────────────────────────────────────────────────────────

interface InvoicePDFProps {
    data: InvoiceData;
}

export default function InvoicePDF({ data }: InvoicePDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ── Header ───────────────────────────────────────────── */}
                <View style={styles.header}>
                    <Text style={styles.invoiceTitle}>INVOICE</Text>
                    <View style={styles.headerRight}>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerLabel}>Invoice Number: </Text>
                            <Text style={styles.headerValue}>{data.invoiceNumber}</Text>
                        </View>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerLabel}>Issue Date: </Text>
                            <Text style={styles.headerValue}>{data.issueDate}</Text>
                        </View>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerLabel}>Supply Date: </Text>
                            <Text style={styles.headerValue}>{data.supplyDate}</Text>
                        </View>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerLabel}>Due Date: </Text>
                            <Text style={styles.headerDueDate}>{data.dueDate}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Supplier / Customer ──────────────────────────────── */}
                <View style={styles.partiesContainer}>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyTitle}>SUPPLIER</Text>
                        <Text style={styles.partyName}>{data.supplier.name}</Text>
                        <Text style={styles.partyDetail}>{data.supplier.street}</Text>
                        <Text style={styles.partyDetail}>{data.supplier.city}</Text>
                        <Text style={styles.partyDetail}>{data.supplier.country}</Text>
                        <Text style={styles.partyDetail}>
                            Company ID (IČO): {data.supplier.companyId}
                        </Text>
                        <Text style={styles.partyDetail}> </Text>
                        <Text style={styles.partyDetail}>
                            Email: {data.supplier.email}
                        </Text>
                        <Text style={styles.partyDetail}>
                            Website: {data.supplier.website}
                        </Text>
                    </View>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyTitle}>CUSTOMER</Text>
                        <Text style={styles.partyName}>{data.customer.name}</Text>
                        {data.customer.street ? (
                            <Text style={styles.partyDetail}>{data.customer.street}</Text>
                        ) : null}
                        {data.customer.city ? (
                            <Text style={styles.partyDetail}>{data.customer.city}</Text>
                        ) : null}
                        {data.customer.country ? (
                            <Text style={styles.partyDetail}>{data.customer.country}</Text>
                        ) : null}
                        <Text style={styles.partyDetail}>
                            Email: {data.customer.email}
                        </Text>
                    </View>
                </View>

                {/* ── Service Details ──────────────────────────────────── */}
                <View>
                    <Text style={styles.sectionTitle}>SERVICE DETAILS</Text>

                    {/* Table header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colDescription]}>
                            Description
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                        <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>
                            Unit Price
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>

                    {/* Table rows */}
                    {data.lineItems.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={[styles.tableCell, styles.colDescription]}>
                                {item.description}
                            </Text>
                            <Text style={[styles.tableCell, styles.colQty]}>
                                {item.quantity}
                            </Text>
                            <Text style={[styles.tableCell, styles.colUnitPrice]}>
                                {item.unitPrice}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {item.total}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ── Totals ──────────────────────────────────────────── */}
                <View style={styles.totalsContainer}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Subtotal:</Text>
                        <Text style={styles.totalsValue}>{data.subtotal}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>VAT Rate:</Text>
                        <Text style={styles.totalsValue}>{data.vatRate}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>VAT Amount:</Text>
                        <Text style={styles.totalsValue}>{data.vatAmount}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsDueLabel}>Total Amount Due:</Text>
                        <Text style={styles.totalsDueValue}>{data.totalAmountDue}</Text>
                    </View>
                </View>

                {/* ── Payment Information ──────────────────────────────── */}
                <View style={styles.paymentSection}>
                    <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
                    <Text style={styles.paymentDetail}>
                        Payment method: {data.payment.method}
                    </Text>
                    <Text style={styles.paymentDetail}>
                        Order ID: {data.payment.orderId}
                    </Text>
                    <Text style={styles.paymentDetail}>
                        Paid on: {data.payment.paidOn}
                    </Text>
                </View>

                {/* ── Footer ──────────────────────────────────────────── */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        Supplier is not a VAT payer.
                    </Text>
                    <Text style={styles.footerText}>
                        Thank you for choosing AI Kids Books!
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
