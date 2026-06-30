import 'dotenv/config';
import { connectMongo, disconnectMongo, UserModel, TenantModel } from '@devlock/database';
import { hashPassword } from '@devlock/encryption';
import mongoose from 'mongoose';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: tsx scripts/create-superadmin.ts <email> <password>');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI?.replace('?replicaSet=rs0', '') || 'mongodb://localhost:27017/devlock';
    await connectMongo(mongoUri);
    console.log('Connected to MongoDB.');

    let user = await UserModel.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log('User already exists, upgrading to super admin...');
      user.isSuperAdmin = true;
      if (password) {
        user.passwordHash = await hashPassword(password);
      }
      await user.save();
      console.log('User upgraded successfully.');
    } else {
      console.log('User does not exist, creating new super admin...');
      
      const passwordHash = await hashPassword(password);
      
      const org = await TenantModel.create({
        name: 'Super Admin Org',
        slug: 'super-admin-org-' + Date.now(),
        plan: 'enterprise',
        settings: {},
        billing: {},
      });

      user = await UserModel.create({
        tenantId: org._id,
        email: email.toLowerCase(),
        name: 'Super Admin',
        passwordHash,
        role: 'owner',
        mfa: { enabled: false },
        isSuperAdmin: true,
      });

      org.owner = user._id;
      await org.save();

      console.log('Super admin created successfully.');
    }

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await disconnectMongo();
    process.exit(0);
  }
}

main();
