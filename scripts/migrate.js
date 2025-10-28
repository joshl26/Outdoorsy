/* eslint-disable no-console */
// Migration runner with version tracking
// Run with: node scripts/migrate.js [up|down|status|create]

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';

// Migration tracking schema
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
  batch: { type: Number, required: true },
});

const Migration = mongoose.model('Migration', migrationSchema);

// Get all migration files
async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  return files
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => ({
      name: f,
      path: path.join(migrationsDir, f),
    }));
}

// Get applied migrations from database
async function getAppliedMigrations() {
  return await Migration.find({}).sort({ name: 1 }).lean();
}

// Get pending migrations
async function getPendingMigrations() {
  const allFiles = await getMigrationFiles();
  const applied = await getAppliedMigrations();
  const appliedNames = new Set(applied.map((m) => m.name));
  return allFiles.filter((f) => !appliedNames.has(f.name));
}

// Run migrations up
async function migrateUp() {
  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    console.log('✓ No pending migrations');
    return;
  }

  const currentBatch =
    (await Migration.findOne().sort({ batch: -1 }).lean())?.batch || 0;
  const nextBatch = currentBatch + 1;

  console.log(
    `\n--- Running ${pending.length} migration(s) (Batch ${nextBatch}) ---\n`
  );

  for (const migration of pending) {
    try {
      console.log(`Running: ${migration.name}`);
      const migrationModule = require(migration.path);

      if (!migrationModule.up) {
        throw new Error(`Migration ${migration.name} missing 'up' function`);
      }

      await migrationModule.up();

      await Migration.create({
        name: migration.name,
        batch: nextBatch,
      });

      console.log(`✓ ${migration.name} completed\n`);
    } catch (error) {
      console.error(`✗ ${migration.name} failed:`, error.message);
      throw error;
    }
  }

  console.log(`✓ All migrations completed (Batch ${nextBatch})`);
}

// Rollback last batch
async function migrateDown() {
  const lastBatch = await Migration.findOne().sort({ batch: -1 }).lean();

  if (!lastBatch) {
    console.log('✓ No migrations to rollback');
    return;
  }

  const migrationsToRollback = await Migration.find({
    batch: lastBatch.batch,
  })
    .sort({ name: -1 })
    .lean();

  console.log(
    `\n--- Rolling back ${migrationsToRollback.length} migration(s) (Batch ${lastBatch.batch}) ---\n`
  );

  for (const migration of migrationsToRollback) {
    try {
      console.log(`Rolling back: ${migration.name}`);
      const migrationPath = path.join(__dirname, 'migrations', migration.name);
      const migrationModule = require(migrationPath);

      if (!migrationModule.down) {
        console.log(`⚠ ${migration.name} has no 'down' function, skipping...`);
        continue;
      }

      await migrationModule.down();
      await Migration.deleteOne({ name: migration.name });

      console.log(`✓ ${migration.name} rolled back\n`);
    } catch (error) {
      console.error(`✗ ${migration.name} rollback failed:`, error.message);
      throw error;
    }
  }

  console.log(`✓ Batch ${lastBatch.batch} rolled back`);
}

// Show migration status
async function showStatus() {
  const allFiles = await getMigrationFiles();
  const applied = await getAppliedMigrations();
  const appliedNames = new Set(applied.map((m) => m.name));

  console.log('\n--- Migration Status ---\n');

  if (allFiles.length === 0) {
    console.log('No migrations found');
    return;
  }

  for (const file of allFiles) {
    const isApplied = appliedNames.has(file.name);
    const status = isApplied ? '✓ Applied' : '○ Pending';
    const batch = applied.find((m) => m.name === file.name)?.batch || '';
    const batchInfo = batch ? ` (Batch ${batch})` : '';
    console.log(`${status} ${file.name}${batchInfo}`);
  }

  const pendingCount = allFiles.length - applied.length;
  console.log(
    `\nTotal: ${allFiles.length} | Applied: ${applied.length} | Pending: ${pendingCount}`
  );
}

// Create new migration file
async function createMigration(name) {
  if (!name) {
    console.error('✗ Please provide a migration name');
    console.log('Usage: node scripts/migrate.js create <migration-name>');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.js`;
  const filepath = path.join(__dirname, 'migrations', filename);

  const template = `// Migration: ${name}
// Created: ${new Date().toISOString()}

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: ${name}');
  
  // Add your migration logic here
  // Example:
  // const Model = require('../../models/yourmodel');
  // await Model.updateMany({}, { $set: { newField: 'value' } });
  
  console.log('✓ Migration completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: ${name}');
  
  // Add your rollback logic here
  // Example:
  // const Model = require('../../models/yourmodel');
  // await Model.updateMany({}, { $unset: { newField: '' } });
  
  console.log('✓ Rollback completed');
}

module.exports = { up, down };
`;

  await fs.writeFile(filepath, template);
  console.log(`✓ Created migration: ${filename}`);
}

// Main execution
async function main() {
  const command = process.argv[2] || 'up';
  const arg = process.argv[3];

  if (command === 'create') {
    await createMigration(arg);
    return;
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUrl);
    console.log('✓ Connected to MongoDB');

    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'status':
        await showStatus();
        break;
      default:
        console.log(
          'Usage: node scripts/migrate.js [up|down|status|create <name>]'
        );
        console.log('  up      - Run pending migrations');
        console.log('  down    - Rollback last batch');
        console.log('  status  - Show migration status');
        console.log('  create  - Create new migration file');
    }
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

main();
