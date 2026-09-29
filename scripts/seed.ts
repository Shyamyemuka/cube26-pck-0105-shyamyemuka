import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createAdminClient } from '../lib/supabase/admin';
import { parseOrderLines } from '../lib/ingest/parse-lines';

interface SeedCatalogueItem {
  sku: string;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
}

interface SeedOrderRow {
  order_id: string;
  unit_id: string;
  channel: string;
  order_lines: string;
}

export async function seed() {
  console.log('Seeding Pack Manager database with demo orgs, operators, and orders...');
  const supabase = createAdminClient();

  // 1. Insert Orgs
  const orgs = [
    { id: 'org_demo_alpha', name: 'Alpha Logistics & Packs' },
    { id: 'org_demo_bravo', name: 'Bravo Fulfillment 3PL' },
  ];

  for (const org of orgs) {
    const { error } = await supabase.from('orgs').upsert(org, { onConflict: 'id' });
    if (error) console.error(`Error upserting org ${org.id}:`, error.message);
  }
  console.log('✓ Orgs seeded: org_demo_alpha, org_demo_bravo');

  // 2. Create Auth Users and Profiles
  const password = process.env.SEED_PASSWORD || 'Password123!';
  const users = [
    {
      email: 'operator.alpha@example.test',
      org_id: 'org_demo_alpha',
      display_name: 'Meera (Alpha Operator)',
      role: 'operator',
    },
    {
      email: 'operator.bravo@example.test',
      org_id: 'org_demo_bravo',
      display_name: 'Rohan (Bravo Operator)',
      role: 'operator',
    },
  ];

  for (const u of users) {
    // Check if user exists
    const { data: userList } = await supabase.auth.admin.listUsers();
    let authUser = userList?.users?.find((x) => x.email === u.email);

    if (!authUser) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`Error creating user ${u.email}:`, error.message);
        continue;
      }
      authUser = created.user;
    }

    if (authUser) {
      const { error: profileErr } = await supabase.from('profiles').upsert(
        {
          user_id: authUser.id,
          org_id: u.org_id,
          display_name: u.display_name,
          role: u.role,
        },
        { onConflict: 'user_id' }
      );
      if (profileErr) console.error(`Error upserting profile for ${u.email}:`, profileErr.message);
    }
  }
  console.log('✓ Operators seeded for alpha and bravo');

  // 3. Load demo catalogue
  const catPath = path.resolve(process.cwd(), 'demo-data/demo_catalogue.json');
  if (fs.existsSync(catPath)) {
    const rawCat = JSON.parse(fs.readFileSync(catPath, 'utf-8')) as SeedCatalogueItem[];
    for (const org of orgs) {
      const itemsToInsert = rawCat.map((item) => ({
        org_id: org.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        attributes: item.attributes,
      }));
      const { error } = await supabase.from('catalogue_items').upsert(itemsToInsert, {
        onConflict: 'org_id,sku',
      });
      if (error) console.error(`Error inserting catalogue for ${org.id}:`, error.message);
    }
    console.log(`✓ Loaded ${rawCat.length} catalogue items per org`);
  }

  // 4. Load demo orders
  const ordersPath = path.resolve(process.cwd(), 'demo-data/demo_orders.csv');
  if (fs.existsSync(ordersPath)) {
    const rawCsv = fs.readFileSync(ordersPath, 'utf-8');
    const orderRows = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as SeedOrderRow[];

    // Split orders across orgs: first half alpha, second half bravo
    const half = Math.ceil(orderRows.length / 2);
    const alphaOrders = orderRows.slice(0, half);
    const bravoOrders = orderRows.slice(half);

    async function insertOrgOrders(orgId: string, rows: SeedOrderRow[]) {
      for (const row of rows) {
        const { error: ordErr } = await supabase.from('orders').upsert(
          {
            org_id: orgId,
            order_id: row.order_id,
            unit_id: row.unit_id,
            channel: row.channel,
            status: 'open',
          },
          { onConflict: 'org_id,order_id' }
        );
        if (ordErr) console.error(`Order error (${row.order_id}):`, ordErr.message);

        const lines = parseOrderLines(row.order_lines);
        const lineRows = lines.map((l) => ({
          org_id: orgId,
          order_id: row.order_id,
          sku: l.sku,
          qty: l.qty,
        }));
        const { error: lineErr } = await supabase.from('order_lines').upsert(lineRows, {
          onConflict: 'org_id,order_id,sku',
        });
        if (lineErr) console.error(`Line error (${row.order_id}):`, lineErr.message);
      }
    }

    await insertOrgOrders('org_demo_alpha', alphaOrders);
    await insertOrgOrders('org_demo_bravo', bravoOrders);
    console.log(`✓ Loaded ${alphaOrders.length} orders for Alpha and ${bravoOrders.length} for Bravo`);
  }

  console.log('Seeding complete!\n');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seed().catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
