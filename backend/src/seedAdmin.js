// Run once to create the first admin account:
//   node src/seedAdmin.js "Admin Name" admin@example.com yourPassword
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: node src/seedAdmin.js "Admin Name" admin@example.com yourPassword');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (role, name, email, password_hash) VALUES (?,?,?,?)',
    ['admin', name, email, hash]
  );
  console.log(`Admin account created for ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
