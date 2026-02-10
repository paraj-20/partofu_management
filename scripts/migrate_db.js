const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
neonConfig.webSocketConstructor = ws;

const connectionString = "postgresql://neondb_owner:npg_4uws8vlyrCec@ep-polished-surf-a1ii39gu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-polished-surf-a1ii39gu-pooler";

neonConfig.wsProxy = (host) => host.includes("neon.tech") ? "52.220.170.93:443/v2" : `${host}/v2`;

const pool = new Pool({ connectionString, ssl: true });

async function migrate() {
    try {
        console.log("Starting migrations...");

        // Packages: rename title to name
        await pool.query(`ALTER TABLE packages RENAME COLUMN title TO name`);
        console.log("Renamed packages.title to name");

        // Package Tiers: add missing columns
        await pool.query(`
      ALTER TABLE package_tiers 
      ADD COLUMN IF NOT EXISTS scope TEXT,
      ADD COLUMN IF NOT EXISTS ideal_for TEXT,
      ADD COLUMN IF NOT EXISTS add_ons JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS included JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS not_included JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);
        console.log("Added columns to package_tiers");

        // Task Assignments
        await pool.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, user_id)
      )
    `);
        console.log("Created task_assignments table");

        // Task Comments
        await pool.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
        console.log("Created task_comments table");

        console.log("Migrations completed successfully!");
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await pool.end();
    }
}

migrate();
