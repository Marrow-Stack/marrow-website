import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Full-Text Search — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Full-Text Search block: PostgreSQL FTS via Supabase, autocomplete, facet counts, highlight extraction, recent searches, and a debounced React hook.",
}

export default function SearchDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Utility · Intermediate
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Full-Text Search</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          PostgreSQL full-text search via Supabase — weighted <InlineCode>tsvector</InlineCode> search,{" "}
          <InlineCode>websearch_to_tsquery</InlineCode> format, autocomplete, facet counts, highlight
          extraction, recent searches, and a debounced React hook with pagination.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/search" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Full-Text Search block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/search.ts</InlineCode> (and the React hook) into your project.
        </p>
        <p>
          Run the included migration SQL to add the <InlineCode>search_vector</InlineCode> column and
          trigger to your target table before wiring in the API route.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project with at least one table to search</li>
          <li>TypeScript 5+</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
          { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Anon key — used client-side for search queries" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — used server-side for migrations and index updates" },
        ]} />
      </Section>

      <Section title="5. Database setup">
        <p>
          Run this migration in Supabase SQL Editor → New query. Adjust{" "}
          <InlineCode>your_table</InlineCode>, column names, and weights to match your schema.
          <InlineCode>A</InlineCode> is highest weight, <InlineCode>D</InlineCode> is lowest.
        </p>
        <CodeBlock filename="Supabase SQL Editor" code={`-- 1. Add the search vector column
alter table your_table
  add column if not exists search_vector tsvector;

-- 2. Populate it from existing rows
update your_table
set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'C');

-- 3. Keep it updated automatically
create or replace function your_table_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.body, '')), 'C');
  return new;
end;
$$;

create trigger your_table_search_vector_trigger
  before insert or update on your_table
  for each row execute function your_table_search_vector_update();

-- 4. Create a GIN index for fast lookups
create index if not exists your_table_search_vector_idx
  on your_table using gin(search_vector);`} />
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/search/route.ts" code={`import { searchRecords } from '@/lib/search'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''
  const page  = Number(searchParams.get('page') ?? '1')

  if (!query.trim()) return NextResponse.json({ results: [], total: 0 })

  const { results, total } = await searchRecords({
    table: 'your_table',
    query,
    page,
    pageSize: 10,
    columns: ['id', 'title', 'description', 'slug'],
  })

  return NextResponse.json({ results, total })
}`} />

        <CodeBlock filename="Client — debounced search hook" code={`'use client'
import { useSearch } from '@/lib/search'

export function SearchBar() {
  const { query, setQuery, results, isLoading, total } = useSearch({
    endpoint: '/api/search',
    debounceMs: 300,
  })

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        className="w-full rounded border px-3 py-2"
      />
      {isLoading && <p className="text-xs mt-1">Searching…</p>}
      <ul className="mt-2 space-y-1">
        {results.map((r) => (
          <li key={r.id}>
            <a href={\`/posts/\${r.slug}\`}>{r.title}</a>
          </li>
        ))}
      </ul>
      {total > 0 && <p className="text-xs mt-2">{total} results</p>}
    </div>
  )
}`} />

        <CodeBlock filename="Autocomplete suggestions" code={`import { getAutocompleteSuggestions } from '@/lib/search'

// Call this in a GET /api/search/suggest route
const suggestions = await getAutocompleteSuggestions({
  table: 'your_table',
  column: 'title',
  prefix: 'next',
  limit: 5,
})`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Insert a row into your table and confirm the <InlineCode>search_vector</InlineCode> column is populated by the trigger.</li>
          <li>Call <InlineCode>GET /api/search?q=your+term</InlineCode> and confirm results are returned.</li>
          <li>Search for a partial word and confirm weighted ranking (title matches rank above body matches).</li>
          <li>Type quickly in the <InlineCode>SearchBar</InlineCode> and confirm the debounce delays the API call.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "search_vector column is always null", cause: "Existing rows were not backfilled after adding the column.", fix: "Run the UPDATE statement from the migration to populate search_vector for existing rows. New rows are handled automatically by the trigger." },
            { error: "No results for a query that should match", cause: "The tsvector uses 'english' dictionary but your content is in another language.", fix: "Change 'english' to the appropriate Postgres text search configuration (e.g. 'french', 'german', 'simple')." },
            { error: "Search is slow on large tables", cause: "The GIN index may not exist or may need a REINDEX.", fix: "Run CREATE INDEX IF NOT EXISTS ... USING gin(search_vector) and confirm the index is used with EXPLAIN ANALYZE." },
          ].map(({ error, cause, fix }) => (
            <div key={error} className="space-y-1 pb-4 border-b last:border-b-0" style={{ borderColor: "hsl(var(--metal-border))" }}>
              <p className="font-mono text-[11px]" style={{ color: "hsl(var(--status-error))" }}>{error}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Cause:</strong> {cause}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
