import pg from 'pg';
const { Client } = pg;

const regions = [
  'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'sa-east-1', 'ca-central-1', 'me-central-1'
];

async function testAll() {
  console.log("Scanning pooler hosts for project jndpwfzfoxhgcbtwepro ...");
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const client = new Client({
      connectionString: `postgresql://postgres.jndpwfzfoxhgcbtwepro:Lve9iAWPRcNgANQg@${host}:6543/postgres`,
      connectionTimeoutMillis: 3000,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`\n🎉 BINGO! Pooler Region is: ${r} (Host: ${host}:6543)\n`);
      await client.end();
      process.exit(0);
    } catch (err) {
      if (!err.message.includes('ENOTFOUND') && !err.message.includes('timeout')) {
        console.log(`  ${r}: ${err.message}`);
      }
    }
  }
  console.log("Finished scan.");
}

testAll();
