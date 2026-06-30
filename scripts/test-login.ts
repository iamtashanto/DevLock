import 'dotenv/config';
import { connectMongo, UserModel } from '@devlock/database';
async function test() {
  await connectMongo(process.env.MONGODB_URI?.replace('?replicaSet=rs0', ''));
  const user = await UserModel.findOne({ email: 'admin@gmail.com' }).lean();
  console.log('User from DB:', user);
  process.exit(0);
}
test();
