import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getDatabase } from './database';
import { runMigrations } from './migrate';

dotenv.config();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

export async function seedDatabase(skipClose = false) {
  // First run migrations (don't close connection)
  await runMigrations(true);

  const db = getDatabase(DB_PATH);
  // Database is already connected from migrations

  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existingAdmin = await db.get(
    'SELECT * FROM users WHERE email = ?',
    [process.env.ADMIN_EMAIL || 'admin@10xscale.ai']
  );

  if (!existingAdmin) {
    const adminId = 'admin_default';
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Jack@123', 10);

    await db.run(
      `INSERT INTO users (id, email, password, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        process.env.ADMIN_EMAIL || 'admin@10xscale.ai',
        hashedPassword,
        'admin',
        Date.now(),
        Date.now()
      ]
    );

    console.log('✅ Admin user created successfully!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  console.log('✅ Database seeding completed!');

  if (!skipClose) {
    await db.close();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export default seedDatabase;

