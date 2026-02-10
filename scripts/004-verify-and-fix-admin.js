import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Check what's currently stored
  const users = await sql`SELECT id, email, password_hash, role, status FROM users WHERE email = 'paraj.panchani.2006@gmail.com'`;
  
  if (users.length === 0) {
    console.log("No user found with email paraj.panchani.2006@gmail.com");
    
    // Check if old email exists
    const oldUsers = await sql`SELECT id, email, password_hash, role, status FROM users`;
    console.log("All users:", JSON.stringify(oldUsers, null, 2));
    
    // Insert fresh admin
    const salt = "partofu_salt_2024";
    const hash = createHash("sha256").update("paraj2006" + salt).digest("hex");
    const passwordHash = `sha256:${salt}:${hash}`;
    
    await sql`
      INSERT INTO users (email, password_hash, name, role, status)
      VALUES ('paraj.panchani.2006@gmail.com', ${passwordHash}, 'Paraj Panchani', 'admin', 'active')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = ${passwordHash},
        role = 'admin',
        status = 'active',
        name = 'Paraj Panchani'
    `;
    console.log("Admin user created fresh with correct email and password hash");
  } else {
    console.log("Found user:", JSON.stringify(users[0], null, 2));
    
    // Re-hash password to make sure it matches
    const salt = "partofu_salt_2024";
    const hash = createHash("sha256").update("paraj2006" + salt).digest("hex");
    const expectedHash = `sha256:${salt}:${hash}`;
    
    console.log("Expected hash:", expectedHash);
    console.log("Stored hash:", users[0].password_hash);
    console.log("Match:", expectedHash === users[0].password_hash);
    
    if (expectedHash !== users[0].password_hash) {
      await sql`UPDATE users SET password_hash = ${expectedHash} WHERE email = 'paraj.panchani.2006@gmail.com'`;
      console.log("Password hash updated!");
    }
  }
  
  // Clean up any stale sessions
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
  console.log("Cleaned up expired sessions");
}

main().catch(console.error);
