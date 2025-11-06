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

async function exportDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apoiase-telegram-bot');
    console.log('✅ Connected to MongoDB');

    // Create export directory if it doesn't exist
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const exportPath = path.join(EXPORT_DIR, `backup-${timestamp}`);
    fs.mkdirSync(exportPath, { recursive: true });

    console.log(`📦 Exporting data to: ${exportPath}`);

    // Export each collection
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

    const exportSummary: Record<string, number> = {};

    for (const collection of collections) {
      console.log(`  📄 Exporting ${collection.name}...`);
      const data = await collection.model.find({}).lean();
      const filePath = path.join(exportPath, `${collection.name}.json`);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      exportSummary[collection.name] = data.length;
      console.log(`  ✅ Exported ${data.length} documents from ${collection.name}`);
    }

    // Save export metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      timestamp,
      mongodbUri: process.env.MONGODB_URI,
      collections: exportSummary,
      totalDocuments: Object.values(exportSummary).reduce((sum, count) => sum + count, 0),
    };

    fs.writeFileSync(
      path.join(exportPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n✅ Export completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Total collections: ${collections.length}`);
    console.log(`   Total documents: ${metadata.totalDocuments}`);
    console.log(`   Export location: ${exportPath}`);

    Object.entries(exportSummary).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} documents`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    process.exit(1);
  }
}

// Run export
exportDatabase();
