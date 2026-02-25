import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { getInvoiceData } from "@/actions/invoice";
import InvoicePDF from "@/app/components/invoice/InvoicePDF";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
    const { orderId } = await params;

    // Fetch invoice data (handles auth + ownership check)
    const invoiceData = await getInvoiceData(orderId);

    if (!invoiceData) {
        return NextResponse.json(
            { error: "Invoice not available. Order not found or not yet paid." },
            { status: 404 }
        );
    }

    try {
        // Render PDF to buffer on the server
        // Cast required because @react-pdf/renderer types expect DocumentProps
        // but our component wraps <Document> internally
        const element = React.createElement(InvoicePDF, {
            data: invoiceData,
        }) as unknown as ReactElement<DocumentProps>;

        const pdfBuffer = await renderToBuffer(element);

        const filename = `invoice-${invoiceData.payment.orderId}.pdf`;

        // Convert Buffer to Uint8Array for NextResponse compatibility
        const body = new Uint8Array(pdfBuffer);

        return new NextResponse(body, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error("[Invoice API] PDF generation error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate invoice PDF",
            },
            { status: 500 }
        );
    }
}
