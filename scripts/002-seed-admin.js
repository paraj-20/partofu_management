import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

// Simple hash for seeding - the app uses bcrypt-like hashing via Web Crypto
async function hashPassword(password) {
  const salt = "partofu_salt_2024";
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `sha256:${salt}:${hash}`;
}

async function seed() {
  const passwordHash = await hashPassword("paraj2006");

  // Insert admin user
  await sql`
    INSERT INTO users (email, password_hash, name, role, status)
    VALUES ('paraj.panchani.2006', ${passwordHash}, 'Paraj Panchani', 'admin', 'active')
    ON CONFLICT (email) DO UPDATE SET
      password_hash = ${passwordHash},
      role = 'admin',
      status = 'active',
      name = 'Paraj Panchani'
  `;

  console.log("Admin user seeded successfully!");

  // Seed some default packages
  const techPkg = await sql`
    INSERT INTO packages (name, category, description, is_active)
    VALUES ('Website Development', 'tech', 'Professional website development services', true)
    RETURNING id
  `;

  await sql`
    INSERT INTO package_tiers (package_id, name, price, features, scope, ideal_for, sort_order)
    VALUES 
      (${techPkg[0].id}, 'Starter', '15,000 INR', ARRAY['5 Pages', 'Mobile Responsive', 'Contact Form', 'Basic SEO'], 'Simple informational website', 'Small businesses', 1),
      (${techPkg[0].id}, 'Professional', '35,000 INR', ARRAY['10 Pages', 'CMS Integration', 'Advanced SEO', 'Analytics Dashboard', 'E-commerce Ready'], 'Full business website with CMS', 'Growing businesses', 2),
      (${techPkg[0].id}, 'Enterprise', '75,000 INR', ARRAY['Unlimited Pages', 'Custom Features', 'API Integrations', 'Priority Support', 'Performance Optimization'], 'Enterprise-grade web application', 'Large organizations', 3)
  `;

  const brandPkg = await sql`
    INSERT INTO packages (name, category, description, is_active)
    VALUES ('Brand Identity', 'branding', 'Complete brand identity design services', true)
    RETURNING id
  `;

  await sql`
    INSERT INTO package_tiers (package_id, name, price, features, scope, ideal_for, sort_order)
    VALUES 
      (${brandPkg[0].id}, 'Basic', '8,000 INR', ARRAY['Logo Design', 'Color Palette', 'Typography Selection', 'Brand Guidelines PDF'], 'Logo and basic branding', 'Startups', 1),
      (${brandPkg[0].id}, 'Complete', '25,000 INR', ARRAY['Logo + Variations', 'Stationery Design', 'Social Media Kit', 'Brand Book', 'Icon Set'], 'Full brand identity system', 'Established businesses', 2)
  `;

  console.log("Default packages seeded successfully!");
}

seed().catch(console.error);
