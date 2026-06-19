import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'alysha_vercel_jwt_2022_secret_key';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ user: { id: decoded.id, email: decoded.email, role: decoded.role } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
