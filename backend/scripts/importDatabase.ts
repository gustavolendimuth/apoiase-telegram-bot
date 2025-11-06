import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from '../src/models/User';
import Campaign from '../src/models/Campaign';
import Support from '../src/models/Support';
import Integration from '../src/models/Integration';
import Member from '../src/models/Member';
import EventLog from '../src/models/EventLog';
import IntegrationAuthSession from '../src/models/IntegrationAuthSession';
import TelegramAuthToken from '../src/models/TelegramAuthToken';

const EXPORT_DIR = path.join(__dirname, '..', 'database-exports');

async function importDatabase(backupName?: string) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apoiase-telegram-bot');
    console.log('✅ Connected to MongoDB');

    // Find the backup directory
    let backupPath: string;

    if (backupName) {
      backupPath = path.join(EXPORT_DIR, backupName);
    } else {
      // Use the most recent backup
      const backups = fs.readdirSync(EXPORT_DIR)
        .filter(file => file.startsWith('backup-'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        throw new Error('No backups found in database-exports directory');
      }

      backupPath = path.join(EXPORT_DIR, backups[0]);
      console.log(`📦 Using most recent backup: ${backups[0]}`);
    }

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }

    // Read metadata
    const metadataPath = path.join(backupPath, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      console.log(`📊 Backup info:`);
      console.log(`   Export date: ${metadata.exportDate}`);
      console.log(`   Total documents: ${metadata.totalDocuments}`);
    }

    console.log(`\n⚠️  WARNING: This will DELETE all existing data and import from backup!`);
    console.log(`   Target database: ${process.env.MONGODB_URI}`);
    console.log(`   Backup location: ${backupPath}`);

    // In production, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically

    // Import each collection
    const collections = [
      { name: 'users', model: User },
      { name: 'campaigns', model: Campaign },
      { name: 'supports', model: Support },
      { name: 'integrations', model: Integration },
      { name: 'members', model: Member },
      { name: 'eventlogs', model: EventLog },
      { name: 'integrationauthsessions', model: IntegrationAuthSession },
      { name: 'telegramauthtokens', model: TelegramAuthToken },
    ];

    const importSummary: Record<string, number> = {};

    for (const collection of collections) {
      const filePath = path.join(backupPath, `${collection.name}.json`);

      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  Skipping ${collection.name} (file not found)`);
        continue;
      }

      console.log(`  🗑️  Clearing ${collection.name}...`);
      await collection.model.deleteMany({});

      console.log(`  📄 Importing ${collection.name}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (data.length > 0) {
        await collection.model.insertMany(data);
        importSummary[collection.name] = data.length;
        console.log(`  ✅ Imported ${data.length} documents to ${collection.name}`);
      } else {
        importSummary[collection.name] = 0;
        console.log(`  ℹ️  No documents to import for ${collection.name}`);
      }
    }

    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Total collections: ${Object.keys(importSummary).length}`);
    console.log(`   Total documents: ${Object.values(importSummary).reduce((sum, count) => sum + count, 0)}`);

    Object.entries(importSummary).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} documents`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error importing database:', error);
    process.exit(1);
  }
}

// Get backup name from command line argument
const backupName = process.argv[2];
importDatabase(backupName);
