/**
 * Generate cryptographic keys for DevLock.
 * Run: pnpm generate:keys
 */
import { generateKeyPairSync, randomBytes } from 'crypto';

console.log('═══════════════════════════════════════════');
console.log('  DevLock Key Generation');
console.log('═══════════════════════════════════════════\n');

// Ed25519 key pair for license signing
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('🔐 Ed25519 License Signing Keys:\n');
console.log(`LICENSE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
console.log(`LICENSE_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"\n`);

// AES-256 encryption key
const encKey = randomBytes(32).toString('hex');
console.log('🔑 AES-256 Encryption Key:\n');
console.log(`ENCRYPTION_KEY=${encKey}\n`);

// JWT secret
const jwtSecret = randomBytes(48).toString('base64url');
console.log('🎫 JWT Secret:\n');
console.log(`JWT_SECRET=${jwtSecret}\n`);

console.log('═══════════════════════════════════════════');
console.log('  Copy the above values into your .env file');
console.log('  ⚠️  Never commit secrets to version control');
console.log('═══════════════════════════════════════════');
