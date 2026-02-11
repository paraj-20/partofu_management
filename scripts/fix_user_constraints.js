const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

neonConfig.webSocketConstructor = ws;
neonConfig.wsProxy = (host) => {
    if (host.includes("neon.tech")) {
        return "52.220.170.93:443/v2";
    }
    return `${host}/v2`;
};

const connectionString = "postgresql://neondb_owner:npg_4uws8vlyrCec@ep-polished-surf-a1ii39gu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-polished-surf-a1ii39gu-pooler";
const pool = new Pool({ connectionString });

async function fixUserConstraints() {
    try {
        console.log("Updating users_status_check constraint...");

        // Drop the old constraint
        await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check");

        // Add the new constraint including 'inactive'
        await pool.query("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'rejected'::text, 'inactive'::text]))");

        console.log("Successfully updated users_status_check constraint!");
    } catch (err) {
        console.error("Error updating constraint:", err);
    } finally {
        await pool.end();
    }
}

fixUserConstraints();
