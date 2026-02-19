import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.local...');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // simple unquote
            if (key && value && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Make sure .env.local exists and contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

const ORDER_ID = 'e0cd875b-503a-490b-b6b0-73e2662d3aec';

async function fixOrder() {
    console.log(`Attempting to fix order: ${ORDER_ID}`);

    // 1. Get Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, storybooks(*)')
        .eq('id', ORDER_ID)
        .single();

    if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return;
    }

    console.log(`Found order. Current status: ${order.status}`);
    const storybook = order.storybooks;

    if (storybook) {
        console.log(`Found storybook ${storybook.id}. Current status: ${storybook.status}`);

        // 2. Fix Content (Remove "The End" page) & Status
        let contentUpdate = {};
        if (storybook.content) {
            try {
                const content = typeof storybook.content === 'string'
                    ? JSON.parse(storybook.content)
                    : storybook.content;

                if (content.pages && Array.isArray(content.pages)) {
                    // Check if 'end' page exists
                    const hasEndPage = content.pages.some((p: any) => p.type === 'end');

                    if (hasEndPage) {
                        console.log('Removing "The End" page from content...');
                        // Filter out 'end' page
                        content.pages = content.pages.filter((p: any) => p.type !== 'end');

                        // Fix back cover page number
                        const backCover = content.pages.find((p: any) => p.type === 'back');
                        if (backCover) {
                            backCover.pageNumber = content.pages.length;
                        }

                        contentUpdate = { content };
                    }
                }
            } catch (e) {
                console.error('Error parsing storybook content:', e);
            }
        }

        if (storybook.status !== 'complete' || Object.keys(contentUpdate).length > 0) {
            console.log('Updating storybook status and content...');
            const { error: sbError } = await supabase
                .from('storybooks')
                .update({
                    status: 'complete',
                    ...contentUpdate
                })
                .eq('id', storybook.id);

            if (sbError) console.error('Error updating storybook:', sbError);
            else console.log('Storybook updated successfully.');
        } else {
            console.log('Storybook already complete and content is clean.');
        }
    } else {
        console.error('No storybook attached to order.');
    }

    // 3. Update Order
    if (order.status !== 'complete') {
        console.log('Updating order status to complete...');
        const { error: oError } = await supabase
            .from('orders')
            .update({
                status: 'complete',
                book_completed_at: new Date().toISOString()
            })
            .eq('id', ORDER_ID);

        if (oError) console.error('Error updating order:', oError);
        else console.log('Order updated successfully.');
    } else {
        console.log('Order already complete.');
    }
}

fixOrder();
