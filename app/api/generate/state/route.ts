import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    try {
        const orderId = req.nextUrl.searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
                id,
                status,
                generation_progress,
                storybooks (
                    id,
                    title,
                    cover_url
                )
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error("[get-generate-state] Order lookup failed:", orderError);
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            status: order.status,
            progress: order.generation_progress,
            data: (order.generation_progress as any)?.data || {},
            storybook: order.storybooks
        });

    } catch (error) {
        console.error("[get-generate-state] API Error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
