import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Signup
router.post('/signup', async (req, res) => {
  const { name, pin, user_type } = req.body;

  if (!name || !pin || !user_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 4 digits' });
  }

  try {
    const pinHash = await bcrypt.hash(pin, 10);
    const id = uuidv4();

    const stmt = db.prepare('INSERT INTO users (id, name, pin_hash, user_type) VALUES (?, ?, ?, ?)');
    stmt.run(id, name, pinHash, user_type);

    res.status(201).json({ message: 'Profile created successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Profile name already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { name, pin } = req.body;

  if (!name || !pin) {
    return res.status(400).json({ error: 'Name and PIN are required' });
  }

  const stmt = db.prepare('SELECT * FROM users WHERE name = ?');
  const user = stmt.get(name) as any;

  if (!user) {
    return res.status(401).json({ error: 'Profile not found' });
  }

  const validPin = await bcrypt.compare(pin, user.pin_hash);
  if (!validPin) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, user_type: user.user_type }, JWT_SECRET, { expiresIn: '24h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      user_type: user.user_type
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Get Current User
router.get('/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ user: null });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.json({ user: null });
    
    const stmt = db.prepare('SELECT id, name, user_type, tin, period_code FROM users WHERE id = ?');
    const user = stmt.get(decoded.id);
    res.json({ user });
  });
});

// Update Profile
router.put('/profile', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });

    const { tin, period_code } = req.body;
    const stmt = db.prepare('UPDATE users SET tin = ?, period_code = ? WHERE id = ?');
    stmt.run(tin, period_code, decoded.id);
    res.json({ message: 'Profile updated' });
  });
});

// Change PIN
router.put('/change-pin', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });

    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required' });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be 4 digits' });
    }

    try {
      const userStmt = db.prepare('SELECT pin_hash FROM users WHERE id = ?');
      const user = userStmt.get(decoded.id) as any;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validPin = await bcrypt.compare(currentPin, user.pin_hash);
      if (!validPin) {
        return res.status(401).json({ error: 'Current PIN is incorrect' });
      }

      const newPinHash = await bcrypt.hash(newPin, 10);
      const updateStmt = db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?');
      updateStmt.run(newPinHash, decoded.id);

      res.json({ message: 'PIN changed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export default router;
