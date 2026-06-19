import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'alysha_vercel_jwt_2022_secret_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alysha.family';
// bcrypt hash of Alysha@2022
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH ||
  '$2b$10$cuYaMU2Ehm0RMasoC09fBe/AMSy3M5HUUhYqA5r1YINfSZRi3f/8W';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, ADMIN_HASH);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: 'admin', email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({ token, user: { id: 'admin', email, role: 'admin' } });
}
