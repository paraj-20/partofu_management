const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Bypass SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

neonConfig.webSocketConstructor = ws;

// Endpoint ID MUST be included in options query parameter
const connectionString = "postgresql://neondb_owner:npg_4uws8vlyrCec@ep-polished-surf-a1ii39gu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-polished-surf-a1ii39gu-pooler";

// Bypass DNS resolution by routing the hostname to the IP directly
neonConfig.wsProxy = (host) => {
    if (host.includes("neon.tech")) {
        return "52.220.170.93:443/v2"; // Direct WS endpoint on Neon
    }
    return `${host}/v2`;
};

const pool = new Pool({
    connectionString,
    ssl: true
});

async function inspectSchema(tableName) {
    try {
        const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
    `);
        console.log(`Schema for ${tableName}:`, JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error(`Error inspecting ${tableName}:`, error);
    }
}

async function run() {
    await inspectSchema('tasks');
    await inspectSchema('packages');
    await inspectSchema('package_tiers');
    await inspectSchema('activity_logs');
    await pool.end();
}

run();
