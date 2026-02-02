/**
 * Test file to debug chapter querying issue
 * Run with: npx tsx test-chapter-query.ts
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const STORYBOOK_ID = 'bbe1a85f-7e65-4cf8-881a-5e2862b5588d';

// Load environment variables from .env.local
function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf-8');
        envFile.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=').trim();
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
    }
}

async function testChapterQuery() {
    console.log('='.repeat(60));
    console.log('CHAPTER QUERY TEST');
    console.log('='.repeat(60));
    console.log('Storybook ID:', STORYBOOK_ID);
    console.log('');

    // Load environment variables
    loadEnv();

    // Create Supabase client (anon key - public access)
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false
            }
        }
    );

    console.log('✓ Supabase client created');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('');

    // Test 1: Query ALL chapters (no filter)
    console.log('Test 1: Query ALL chapters in database');
    console.log('-'.repeat(60));
    const { data: allChapters, error: allError, count: totalCount } = await supabase
        .from('chapters')
        .select('*', { count: 'exact' });

    console.log('Result:');
    console.log('  Total count:', totalCount);
    console.log('  Rows returned:', allChapters?.length || 0);
    console.log('  Error:', allError?.message || 'None');
    
    if (allChapters && allChapters.length > 0) {
        console.log('  Sample chapters:');
        allChapters.slice(0, 3).forEach((ch: any) => {
            console.log(`    - ID: ${ch.id.substring(0, 8)}..., Storybook: ${ch.storybook_id?.substring(0, 8)}..., Title: ${ch.title}`);
        });
    }
    console.log('');

    // Test 2: Query chapters for specific storybook
    console.log('Test 2: Query chapters for storybook:', STORYBOOK_ID);
    console.log('-'.repeat(60));
    const { data: storybookChapters, error: storybookError } = await supabase
        .from('chapters')
        .select('*')
        .eq('storybook_id', STORYBOOK_ID)
        .order('chapter_number', { ascending: true });

    console.log('Result:');
    console.log('  Chapters found:', storybookChapters?.length || 0);
    console.log('  Error:', storybookError?.message || 'None');
    
    if (storybookChapters && storybookChapters.length > 0) {
        console.log('  Chapters:');
        storybookChapters.forEach((ch: any) => {
            console.log(`    ${ch.chapter_number}. ${ch.title}`);
            console.log(`       ID: ${ch.id}`);
            console.log(`       Content length: ${ch.content?.length || 0} chars`);
        });
    }
    console.log('');

    // Test 3: Query storybook itself
    console.log('Test 3: Query storybook details');
    console.log('-'.repeat(60));
    const { data: storybook, error: storybookErr } = await supabase
        .from('storybooks')
        .select('*')
        .eq('id', STORYBOOK_ID)
        .single();

    console.log('Result:');
    console.log('  Found:', !!storybook);
    console.log('  Error:', storybookErr?.message || 'None');
    
    if (storybook) {
        console.log('  Title:', storybook.title);
        console.log('  Status:', storybook.status);
        console.log('  Target chapters:', storybook.target_chapters);
        console.log('  Content:', storybook.content ? JSON.stringify(storybook.content).substring(0, 100) + '...' : 'Empty');
        console.log('  User ID:', storybook.user_id);
    }
    console.log('');

    // Test 4: Check if there's ANY chapter with this storybook_id using different query
    console.log('Test 4: Alternative query methods');
    console.log('-'.repeat(60));
    
    // Using .contains()
    const { data: containsResult } = await supabase
        .from('chapters')
        .select('id, title, storybook_id')
        .textSearch('storybook_id', STORYBOOK_ID);
    
    console.log('  Text search result:', containsResult?.length || 0);

    // Using .filter()
    const { data: filterResult } = await supabase
        .from('chapters')
        .select('id, title, storybook_id')
        .filter('storybook_id', 'eq', STORYBOOK_ID);
    
    console.log('  Filter result:', filterResult?.length || 0);
    console.log('');

    // Test 5: Check content column
    console.log('Test 5: Content column analysis');
    console.log('-'.repeat(60));
    if (storybook && storybook.content) {
        const content = storybook.content as any;
        console.log('  Content.title:', content.title);
        console.log('  Content.chapters.length:', content.chapters?.length || 0);
        console.log('  Content.author:', content.author);
        
        if (content.chapters && content.chapters.length > 0) {
            console.log('  Content chapters ARE synced ✓');
        } else {
            console.log('  ⚠️  Content chapters are EMPTY - sync failed!');
        }
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('Total chapters in DB:', totalCount || 0);
    console.log('Chapters for this storybook:', storybookChapters?.length || 0);
    console.log('Storybook exists:', !!storybook);
    console.log('');

    if ((totalCount || 0) > 0 && (storybookChapters?.length || 0) === 0) {
        console.log('⚠️  ISSUE IDENTIFIED:');
        console.log('   - Chapters exist in database');
        console.log('   - But query for this storybook returns 0');
        console.log('   - Possible causes:');
        console.log('     1. Wrong storybook_id (check database)');
        console.log('     2. RLS policy blocking reads');
        console.log('     3. Chapters have NULL storybook_id');
        console.log('     4. Data type mismatch (UUID vs string)');
    }

    console.log('='.repeat(60));
}

// Run the test
testChapterQuery()
    .then(() => {
        console.log('\n✓ Test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Test failed:', error);
        process.exit(1);
    });
