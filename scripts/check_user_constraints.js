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

async function checkConstraints() {
    try {
        const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass AND contype = 'c';
    `);
        console.log("Users table check constraints:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkConstraints();
