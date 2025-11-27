// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
let cors;
try {
  cors = require('cors');
} catch (e) {
  console.warn('cors package not found; using manual CORS headers. Install it with npm i cors for enhanced handling.');
}
const { connectToDatabase } = require('./db');
const { logger, logDBOperation, logDBError } = require('./logger');
const fs = require('fs');
const path = require('path');
const { generateSpeech } = require('./tts');
const { generateFarmerPrompt } = require('./farmer-llm-prompt');
const sgMail = require('@sendgrid/mail');

// Ensure the working directory is the backend folder even if started from project root
// This prevents relative path lookups (e.g. accidental attempts to access `./health`) from resolving against the root.
try {
  if (process.cwd() !== __dirname) {
    process.chdir(__dirname);
  }
} catch (e) {
  // If changing directory fails, log but continue; all path-sensitive code uses __dirname.
  console.error('Failed to set working directory to backend:', e.message);
}

const app = express();

// Global CORS (first middleware): either use cors package or manual implementation
if (cors) {
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type'],
    })
  );
} else {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
}

// Explicit preflight handler (ensures Authorization header allowed before auth middleware)
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.sendStatus(204);
});

const PORT = process.env.PORT || 3001;

app.use(express.json());

// Database collections
let farmersCollection;
let activitiesCollection;
let mandipricesCollection;
let aiinteractionsCollection;
let usersCollection; // Add this line
let weatherDataCollection;

// Initialize database collections
async function initializeCollections() {
  const startTime = Date.now();
  try {
    const client = await connectToDatabase('admin');
    const db = client.db("KrushiMitraDB");
    
    farmersCollection = db.collection('farmers');
    activitiesCollection = db.collection('activities');
    mandipricesCollection = db.collection('mandiprices');
    aiinteractionsCollection = db.collection('aiinteractions');
    usersCollection = db.collection('users'); // Add this line
    weatherDataCollection = db.collection('weather_data');
    
    const duration = Date.now() - startTime;
    logDBOperation('initializeCollections', { 
      durationMs: duration,
      status: 'success',
      collections: ['farmers', 'activities', 'mandiprices', 'aiinteractions', 'weather_data']
    });
    
    logger.info('Database collections initialized', { durationMs: duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('initializeCollections', error, { durationMs: duration });
    logger.error('Error initializing database collections', { 
      error: error.message,
      durationMs: duration
    });
  }
}

// Helper function to verify Firebase token (mock implementation)
async function verifyFirebaseToken(idToken) {
  // In a real implementation, this would call Firebase Admin SDK
  // For now, we'll just check if it's a non-empty string
  return idToken && typeof idToken === 'string' && idToken.length > 0;
}

// Middleware to authenticate requests
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Authentication disabled: middleware now permits all requests.
async function authenticate(req, res, next) {
  setCorsHeaders(res); // keep CORS headers consistent
  req.userId = 'anonymous';
  return next();
}
// TTS route - supports GET with query params
app.get('/tts', async (req, res) => {
  try {
    const { text, lang = 'hi' } = req.query; // default to Hindi
    if (!text) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'text query parameter is required' } 
      });
    }

    const tmpPath = path.join(__dirname, `speech-${Date.now()}.mp3`);
    const saved = await generateSpeech(text, lang, { outputFile: tmpPath });

    if (!fs.existsSync(saved)) {
      return res.status(500).json({ 
        error: { code: 'TTS_ERROR', message: 'Speech file not found after generation' } 
      });
    }

    // Set headers for proper audio playback including ngrok compatibility
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = fs.createReadStream(saved);
    stream.pipe(res);
    stream.on('close', () => {
      fs.promises.unlink(saved).catch(() => {}); // cleanup temp file
    });
  } catch (error) {
    logger.error('TTS generation failed', { error: error.message });
    res.status(500).json({ 
      error: { code: 'TTS_ERROR', message: 'Failed to generate speech' } 
    });
  }
});

// 1. Farmer Profile Management

// POST /farmers - Create or update farmer profile
app.post('/farmers', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { name, phone, language, location, crops, landSize, soilType } = req.body;
    
    // Validation
    if (!name || !phone) {
      const duration = Date.now() - startTime;
      logger.warn('Farmer profile validation failed - missing required fields', { 
        farmerId: req.body.phone,
        missingFields: [!name ? 'name' : null, !phone ? 'phone' : null].filter(Boolean),
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and phone are required'
        }
      });
    }
    
    const now = new Date();
    
    // Use MongoDB to find or create farmer
    const farmer = await farmersCollection.findOneAndUpdate(
      { phone: phone },
      {
        $set: {
          name,
          language,
          location,
          crops,
          landSize,
          soilType,
          updatedAt: now
        },
        $setOnInsert: {
          joinedAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    const duration = Date.now() - startTime;
    logDBOperation('upsertFarmer', { 
      farmerId: phone,
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('Farmer profile created/updated successfully', { 
      farmerId: phone,
      durationMs: duration
    });
    
    res.status(200).json({
      status: 'success',
      data: farmer
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('upsertFarmer', error, { 
      farmerId: req.body?.phone,
      durationMs: duration
    });
    logger.error('Error creating/updating farmer profile', { 
      error: error.message,
      farmerId: req.body?.phone,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error creating/updating farmer profile'
      }
    });
  }
});

// GET /farmers/:phone - Fetch profile by phone
app.get('/farmers/:phone', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { phone } = req.params;
    
    // Use MongoDB to find farmer
    const farmer = await farmersCollection.findOne({ phone: phone });
    
    const duration = Date.now() - startTime;
    if (farmer) {
      logDBOperation('findFarmer', { 
        farmerId: phone,
        durationMs: duration,
        status: 'success'
      });
      
      logger.info('Farmer profile retrieved successfully', { 
        farmerId: phone,
        durationMs: duration
      });
    } else {
      logDBOperation('findFarmer', { 
        farmerId: phone,
        durationMs: duration,
        status: 'not_found'
      });
      
      logger.warn('Farmer not found', { 
        farmerId: phone,
        durationMs: duration
      });
    }
    
    if (!farmer) {
      return res.status(404).json({
        error: {
          code: 'FARMER_NOT_FOUND',
          message: 'Farmer not found'
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: farmer
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('findFarmer', error, { 
      farmerId: req.params?.phone,
      durationMs: duration
    });
    logger.error('Error fetching farmer profile', { 
      error: error.message,
      farmerId: req.params?.phone,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching farmer profile'
      }
    });
  }
});

// 2. Authentication

// Google OAuth Authentication Endpoints

// POST /auth/google - Google OAuth login/signup
app.post('/auth/google', async (req, res) => {
  const startTime = Date.now();
  try {
    const { idToken, user } = req.body;
    
    if (!idToken || !user || !user.email) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'ID token and user email are required' }
      });
    }

    // In production, verify the idToken with Google
    // For now, we'll trust the client-side verification
    
    const { email, name, photo, id: googleId } = user;
    
    // Check if user exists
    let existingUser = await usersCollection.findOne({ email });
    
    if (existingUser) {
      // Update last login
      await usersCollection.updateOne(
        { email },
        { 
          $set: { 
            lastLogin: new Date(),
            name,
            photo
          } 
        }
      );
      
      logger.info('User logged in via Google', { userId: existingUser._id.toString(), email });
      
      return res.json({
        status: 'success',
        data: {
          user: {
            id: existingUser._id.toString(),
            email: existingUser.email,
            name: existingUser.name,
            photo: existingUser.photo,
            createdAt: existingUser.createdAt
          },
          token: 'google-auth-token-' + existingUser._id.toString()
        }
      });
    }
    
    // Create new user
    const newUser = {
      googleId,
      email,
      name,
      photo,
      createdAt: new Date(),
      lastLogin: new Date(),
      profile: {}
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    const duration = Date.now() - startTime;
    logger.info('New user registered via Google', { 
      userId: result.insertedId.toString(),
      email,
      durationMs: duration
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: result.insertedId.toString(),
          email,
          name,
          photo,
          createdAt: newUser.createdAt
        },
        token: 'google-auth-token-' + result.insertedId.toString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in Google auth', { error: error.message, durationMs: duration });
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error processing Google authentication' }
    });
  }
});

// GET /auth/user/:userId - Get user profile
app.get('/auth/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { ObjectId } = require('mongodb');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    
    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          photo: user.photo,
          profile: user.profile || {},
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user', { error: error.message });
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error fetching user profile' }
    });
  }
});

// PUT /auth/user/:userId - Update user profile
app.put('/auth/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profile } = req.body;
    const { ObjectId } = require('mongodb');
    
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profile, updatedAt: new Date() } }
    );
    
    res.json({ status: 'success', message: 'Profile updated' });
  } catch (error) {
    logger.error('Error updating user profile', { error: error.message });
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error updating profile' }
    });
  }
});

// Email/OTP System (SendGrid)

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Configure SendGrid if API key is available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM;

if (SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    logger.info('SendGrid configured for OTP emails', {
      fromConfigured: Boolean(SENDGRID_FROM)
    });
  } catch (e) {
    logger.error('Failed to configure SendGrid', { error: e?.message || String(e) });
  }
} else {
  logger.warn('SENDGRID_API_KEY not configured - OTP email sending disabled');
}

async function sendOtpEmail(to, otp) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM) {
    const reason = !SENDGRID_API_KEY ? 'SENDGRID_API_KEY missing' : 'SENDGRID_FROM missing';
    throw new Error(`Email not configured: ${reason}`);
  }

  const subject = 'KrushiMitra - Your OTP Code';
  const text = `Your KrushiMitra OTP is ${otp}. It is valid for 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">KrushiMitra</h1>
        <p style="color: #E8F5E9; margin: 5px 0;">AI-Powered Farming Assistant</p>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">Your OTP Code</h2>
        <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for KrushiMitra login/signup is:</p>
        <div style="background-color: #F1F8E9; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <h1 style="color: #2E7D32; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">© 2025 KrushiMitra. All rights reserved.</p>
      </div>
    </div>
  `;

  const msg = {
    to,
    from: SENDGRID_FROM,
    subject,
    text,
    html
  };

  try {
    console.log('📨 Sending email to:', to);
    console.log('SG API Key exists:', Boolean(SENDGRID_API_KEY));
    console.log('From:', SENDGRID_FROM);
    await sgMail.send(msg);
    console.log('✅ SendGrid accepted request for:', to);
    return true;
  } catch (err) {
    const sgError = {
      message: err?.message || String(err),
      code: err?.code,
      responseStatus: err?.response?.statusCode,
      responseBody: err?.response?.body
    };
    console.error('❌ SENDGRID EMAIL ERROR:', err?.response?.body || err);
    logger.error('SendGrid send failed', sgError);
    throw new Error(sgError.message || 'Failed to send OTP email');
  }
}

// GET /auth/email-status - SendGrid diagnostics
app.get('/auth/email-status', (req, res) => {
  res.json({
    status: 'success',
    data: {
      provider: 'SendGrid',
      hasApiKey: Boolean(SENDGRID_API_KEY),
      hasFrom: Boolean(SENDGRID_FROM),
      configured: Boolean(SENDGRID_API_KEY && SENDGRID_FROM)
    }
  });
});

// POST /auth/send-otp - Send OTP to email
app.post('/auth/send-otp', async (req, res) => {
  try {
    console.log('🔍 /auth/send-otp hit');
    console.log('Body:', req.body);
    console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'OK' : 'MISSING');
    console.log('SENDGRID_FROM:', process.env.SENDGRID_FROM);
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' }
      });
    }
    
    // Check SendGrid configuration
    if (!SENDGRID_API_KEY || !SENDGRID_FROM) {
      logger.error('Email service not configured', {
        hasApiKey: Boolean(SENDGRID_API_KEY),
        hasFrom: Boolean(SENDGRID_FROM)
      });
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Email service is not configured. Please contact administrator.'
        }
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiration
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });
    
    // Send OTP email via SendGrid
    await sendOtpEmail(email, otp);
    
    logger.info('OTP sent successfully', { email });
    
    res.json({
      status: 'success',
      message: 'OTP sent to your email'
    });
    
  } catch (error) {
    console.error('🔥 OTP ERROR:', error);
    logger.error('Error sending OTP', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      error: { 
        code: 'SERVER_ERROR', 
        message: 'Error sending OTP. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// POST /auth/verify-otp - Verify OTP and login/signup
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, landSize, soilType } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and OTP are required' }
      });
    }
    
    // Check if OTP exists
    const storedOtpData = otpStore.get(email);
    
    if (!storedOtpData) {
      return res.status(400).json({
        error: { code: 'OTP_NOT_FOUND', message: 'OTP not found. Please request a new one.' }
      });
    }
    
    // Check if OTP expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new one.' }
      });
    }
    
    // Check attempts
    if (storedOtpData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Please request a new OTP.' }
      });
    }
    
    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts++;
      return res.status(400).json({
        error: { code: 'INVALID_OTP', message: `Invalid OTP. ${3 - storedOtpData.attempts} attempts remaining.` }
      });
    }
    
    // OTP verified - clear it
    otpStore.delete(email);
    
    // Check if user exists
    let existingUser = await usersCollection.findOne({ email });
    
    if (existingUser) {
      // User exists - login
      await usersCollection.updateOne(
        { email },
        { $set: { lastLogin: new Date() } }
      );
      
      logger.info('User logged in via email OTP', { userId: existingUser._id.toString(), email });
      
      return res.json({
        status: 'success',
        message: 'Login successful',
        user: {
          id: existingUser._id.toString(),
          email: existingUser.email,
          name: existingUser.name,
          photo: existingUser.photo || null,
          profile: existingUser.profile || {},
          createdAt: existingUser.createdAt
        }
      });
    } else {
      // New user - signup
      if (!name) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Name is required for signup' }
        });
      }
      
      const newUser = {
        email,
        name,
        photo: null,
        profile: {
          landSize: landSize || '',
          soilType: soilType || ''
        },
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      
      logger.info('New user registered via email OTP', { userId: result.insertedId.toString(), email });
      
      return res.json({
        status: 'success',
        message: 'Registration successful',
        user: {
          id: result.insertedId.toString(),
          email: newUser.email,
          name: newUser.name,
          photo: null,
          profile: newUser.profile,
          createdAt: newUser.createdAt
        }
      });
    }
    
  } catch (error) {
    logger.error('Error verifying OTP', { error: error.message });
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error verifying OTP' }
    });
  }
});

// POST /auth/verify - Accept Firebase idToken, verify, return farmer record or create
app.post('/auth/verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      logger.warn('Authentication failed - missing ID token');
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID token is required'
        }
      });
    }
    
    const isValid = await verifyFirebaseToken(idToken);
    if (!isValid) {
      logger.warn('Authentication failed - invalid Firebase ID token');
      
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid Firebase ID token'
        }
      });
    }
    
    // For demo purposes, we'll create a mock farmer
    // In a real implementation, you'd extract user info from the token
    const mockFarmer = {
      name: 'Test Farmer',
      phone: '+919876543210',
      language: 'English',
      location: 'Pune, Maharashtra',
      crops: ['Wheat'],
      landSize: 5.0,
      soilType: 'Black soil',
      joinedAt: new Date(),
      updatedAt: new Date()
    };
    
    logger.info('User authenticated successfully', { farmerId: mockFarmer.phone });
    
    res.status(200).json({
      status: 'success',
      data: {
        farmer: mockFarmer,
        isNewUser: true
      }
    });
  } catch (error) {
    logger.error('Error verifying token', { error: error.message });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error verifying token'
      }
    });
  }
});

// 3. Activity Tracking

// POST /activities - Log activity for a farmer
app.post('/activities', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { farmerId, description, type, details } = req.body;
    
    // Validation
    if (!farmerId || !description) {
      const duration = Date.now() - startTime;
      logger.warn('Activity logging failed - missing required fields', { 
        farmerId,
        missingFields: [!farmerId ? 'farmerId' : null, !description ? 'description' : null].filter(Boolean),
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Farmer ID and description are required'
        }
      });
    }
    
    const activity = {
      farmerId,
      description,
      type: type || 'general',
      details: details || {},
      date: new Date()
    };
    
    // Insert activity into MongoDB
    const result = await activitiesCollection.insertOne(activity);
    activity._id = result.insertedId;
    
    const duration = Date.now() - startTime;
    logDBOperation('insertActivity', { 
      farmerId,
      activityType: type,
      activityId: result.insertedId.toString(),
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('Activity logged successfully', { 
      farmerId, 
      activityId: result.insertedId.toString(),
      durationMs: duration
    });
    
    res.status(201).json({
      status: 'success',
      data: activity
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('insertActivity', error, { 
      farmerId: req.body?.farmerId, 
      activityType: req.body?.type,
      durationMs: duration
    });
    logger.error('Error logging activity', { 
      error: error.message,
      farmerId: req.body?.farmerId,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error logging activity'
      }
    });
  }
});

// GET /activities/:farmerId - Fetch activity log
app.get('/activities/:farmerId', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { farmerId } = req.params;
    const { limit = 10, offset = 0, type } = req.query;
    
    // Build query
    const query = { farmerId: farmerId };
    if (type) {
      query.type = type;
    }
    
    // Get total count
    const total = await activitiesCollection.countDocuments(query);
    
    // Get paginated activities
    const activities = await activitiesCollection
      .find(query)
      .sort({ date: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();
    
    const duration = Date.now() - startTime;
    logDBOperation('findActivities', { 
      farmerId, 
      limit, 
      offset, 
      type,
      total,
      returned: activities.length,
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('Activities retrieved successfully', { 
      farmerId, 
      count: activities.length,
      durationMs: duration
    });
    
    res.status(200).json({
      status: 'success',
      data: activities,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('findActivities', error, { 
      farmerId: req.params?.farmerId,
      durationMs: duration
    });
    logger.error('Error fetching activities', { 
      error: error.message,
      farmerId: req.params?.farmerId,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching activities'
      }
    });
  }
});

// 4. Mandi Prices

// POST /mandiprices/update - Ingest mandi price data (bulk)
app.post('/mandiprices/update', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { prices } = req.body;
    
    // Validation
    if (!Array.isArray(prices)) {
      const duration = Date.now() - startTime;
      logger.warn('Mandi price update failed - prices must be an array', {
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Prices must be an array'
        }
      });
    }
    
    // Insert prices into MongoDB
    const result = await mandipricesCollection.insertMany(prices);
    
    const duration = Date.now() - startTime;
    logDBOperation('insertMandiPrices', { 
      priceCount: prices.length,
      insertedCount: result.insertedCount,
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('Mandi prices updated successfully', { 
      insertedCount: result.insertedCount,
      durationMs: duration
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        inserted: result.insertedCount,
        updated: 0
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('insertMandiPrices', error, {
      durationMs: duration
    });
    logger.error('Error updating mandi prices', { 
      error: error.message,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating mandi prices'
      }
    });
  }
});

// GET /mandiprices - Get latest prices
app.get('/mandiprices', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { crop, location } = req.query;
    
    // Build aggregation pipeline to get latest prices
    const pipeline = [];
    
    // Match stage
    const match = {};
    if (crop) match.crop = crop;
    if (location) match.location = location;
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }
    
    // Sort by date descending
    pipeline.push({ $sort: { date: -1 } });
    
    // Group by crop and location to get latest for each
    pipeline.push({
      $group: {
        _id: { crop: "$crop", location: "$location" },
        latestPrice: { $first: "$$ROOT" }
      }
    });
    
    // Project to get the original document structure
    pipeline.push({
      $replaceRoot: { newRoot: "$latestPrice" }
    });
    
    // Execute aggregation
    const latestPrices = await mandipricesCollection.aggregate(pipeline).toArray();
    
    const duration = Date.now() - startTime;
    logDBOperation('findMandiPrices', { 
      crop, 
      location,
      returned: latestPrices.length,
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('Mandi prices retrieved successfully', { 
      count: latestPrices.length, 
      crop, 
      location,
      durationMs: duration
    });
    
    res.status(200).json({
      status: 'success',
      data: latestPrices
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('findMandiPrices', error, { 
      crop, 
      location,
      durationMs: duration
    });
    logger.error('Error fetching mandi prices', { 
      error: error.message,
      crop,
      location,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching mandi prices'
      }
    });
  }
});

// POST /ai/chat - Send user query to AI
app.post('/ai/chat', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { farmerId, query, context, language = 'en' } = req.body;
    
    // Validation
    if (!farmerId || !query) {
      const duration = Date.now() - startTime;
      logger.warn('AI chat request failed - missing required fields', { 
        farmerId,
        missingFields: [!farmerId ? 'farmerId' : null, !query ? 'query' : null].filter(Boolean),
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Farmer ID and query are required'
        }
      });
    }
    
    // Get farmer profile for context
    let farmerProfile = null;
    try {
      farmerProfile = await farmersCollection.findOne({ phone: farmerId });
    } catch (error) {
      logger.warn('Could not fetch farmer profile for AI context', { 
        farmerId, 
        error: error.message 
      });
    }
    
    // Generate farmer-friendly prompt for LLaMA 3
    const farmerPrompt = generateFarmerPrompt(language, query, { farmerProfile, ...context });
    
    // In a real implementation, you would call the LLaMA 3 model with the farmerPrompt
    // For now, we'll simulate a farmer-friendly response
    let aiResponse = `Based on your query "${query}", I recommend checking the latest mandi prices for your crops and considering weather conditions in your area.`;
    
    // For demonstration, we'll customize the response based on language
    if (language === 'hi') {
      aiResponse = `आपके प्रश्न "${query}" के आधार पर, मैं अनुशंसा करता हूं कि आप अपनी फसलों के नवीनतम मंडी भाव देखें और अपने क्षेत्र में मौसम की स्थिति पर विचार करें।`;
    } else if (language === 'ml') {
      aiResponse = `നിങ്ങളുടെ "${query}" എന്ന ചോദ്യത്തിന്റെ അടിസ്ഥാനത്തിൽ, നിങ്ങളുടെ വിളകൾക്കായുള്ള ഏറ്റവും പുതിയ മണ്ടി വിലകൾ പരിശോധിക്കാനും നിങ്ങളുടെ പ്രദേശത്തെ കാലാവസ്ഥാ സ്ഥിതിഗതികൾ പരിഗണിക്കാനും ഞാൻ ശുപാർശ ചെയ്യുന്നു.`;
    } else if (language === 'mr') {
      aiResponse = `तुमच्या "${query}" प्रश्नाच्या आधारावर, मी तुम्हाला तुमच्या पीकांसाठी नवीनतम मंडी भाव तपासण्याची आणि तुमच्या क्षेत्रातील हवामानाच्या परिस्थितीचा विचार करण्याची शिफारस करतो.`;
    }
    
    // Mock automations
    const automations = [
      {
        type: 'mandi_alert',
        triggered: true,
        details: {
          message: 'Wheat prices in your area are currently favorable'
        }
      }
    ];
    
    // Mock related data
    const relatedData = {
      weatherForecast: {
        nextWeekRainfall: '50mm',
        temperatureRange: '25-32°C'
      }
    };
    
    // Save AI interaction to database
    try {
      const aiInteraction = {
        farmerId,
        query,
        response: aiResponse,
        context: context || {},
        timestamp: new Date()
      };
      
      await aiinteractionsCollection.insertOne(aiInteraction);
      logger.info('AI interaction saved to database', { farmerId });
    } catch (dbError) {
      logger.error('Failed to save AI interaction to database', { 
        error: dbError.message,
        farmerId
      });
      // Don't fail the whole request if we can't save to DB, just log the error
    }
    
    const duration = Date.now() - startTime;
    logDBOperation('aiChat', { 
      farmerId,
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('AI chat response generated', { 
      farmerId,
      durationMs: duration
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        response: aiResponse,
        automations,
        relatedData
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('aiChat', error, { 
      farmerId: req.body?.farmerId,
      durationMs: duration
    });
    logger.error('Error processing AI chat request', { 
      error: error.message,
      farmerId: req.body?.farmerId,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error processing AI chat request'
      }
    });
  }
});

// POST /ai/interactions - Save AI interaction (user query and AI response)
app.post('/ai/interactions', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { farmerId, userId, query, response, context, language } = req.body;
    
    // Accept either farmerId (legacy) or userId (new)
    const userIdentifier = userId || farmerId;
    
    // Validation
    if (!userIdentifier || !query || !response) {
      const duration = Date.now() - startTime;
      logger.warn('AI interaction save failed - missing required fields', { 
        userIdentifier,
        missingFields: [
          !userIdentifier ? 'userId/farmerId' : null, 
          !query ? 'query' : null,
          !response ? 'response' : null
        ].filter(Boolean),
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID, query, and response are required'
        }
      });
    }
    
    // Save AI interaction to database
    const aiInteraction = {
      userId: userIdentifier,  // Store as userId for consistency
      farmerId: farmerId || userIdentifier,  // Keep farmerId for backward compatibility
      query,
      response,
      context: context || {},
      language: language || 'en',
      timestamp: new Date()
    };
    
    const result = await aiinteractionsCollection.insertOne(aiInteraction);
    
    const duration = Date.now() - startTime;
    logDBOperation('saveAIInteraction', { 
      userId: userIdentifier,
      interactionId: result.insertedId.toString(),
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('AI interaction saved successfully', { 
      userId: userIdentifier,
      interactionId: result.insertedId.toString(),
      durationMs: duration
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        interactionId: result.insertedId
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDBError('saveAIInteraction', error, { 
      userId: req.body?.userId || req.body?.farmerId,
      durationMs: duration
    });
    logger.error('Error saving AI interaction', { 
      error: error.message,
      userId: req.body?.userId || req.body?.farmerId,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error saving AI interaction'
      }
    });
  }
});

// Weather cache - 10 minutes TTL
const weatherCache = new Map();
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Weather endpoint - Tomorrow.io integration with caching & fallback
app.get('/weather', async (req, res) => {
  const startTime = Date.now();
  try {
    const { lat, lon } = req.query;
    
    // Validation
    if (!lat || !lon) {
      const duration = Date.now() - startTime;
      logger.warn('Weather request failed - missing coordinates', { 
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Latitude and longitude are required'
        }
      });
    }
    
    // Check cache first
    const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
    const cachedData = weatherCache.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < WEATHER_CACHE_TTL) {
      const duration = Date.now() - startTime;
      logger.info('Weather data served from cache', { 
        lat, lon, durationMs: duration
      });
      return res.status(200).json({
        status: 'success',
        data: { ...cachedData.data, cached: true }
      });
    }
    
    const apiKey = process.env.TOMORROW_API_KEY;
    if (!apiKey) {
      logger.error('Tomorrow.io API key not configured');
      // Return fallback data if available
      if (cachedData) {
        return res.status(200).json({
          status: 'success',
          data: { ...cachedData.data, cached: true, stale: true }
        });
      }
      return res.status(500).json({
        error: {
          code: 'CONFIG_ERROR',
          message: 'Weather service not configured'
        }
      });
    }
    
    // Call Tomorrow.io API
    const tomorrowUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${apiKey}`;
    const response = await fetch(tomorrowUrl);
    
    if (!response.ok) {
      // Handle rate limiting - use cached data if available
      if (response.status === 429) {
        logger.warn('Tomorrow.io rate limit exceeded, using cache or fallback', { 
          status: response.status
        });
        
        // Return stale cache if available
        if (cachedData) {
          return res.status(200).json({
            status: 'success',
            data: { ...cachedData.data, cached: true, stale: true }
          });
        }
        
        // Return fallback data
        return res.status(200).json({
          status: 'success',
          data: {
            temperature: 28,
            humidity: 65,
            windSpeed: 10,
            precipitationProbability: 20,
            weatherCode: 1101,
            condition: 'Partly Cloudy',
            advisory: 'Weather data temporarily unavailable. Using estimated conditions.',
            fallback: true
          }
        });
      }
      throw new Error(`Tomorrow.io API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse current weather data
    const current = data.timelines?.minutely?.[0]?.values || data.timelines?.hourly?.[0]?.values || {};
    
    // Extract weather values
    const temperature = current.temperature || current.temperatureApparent || 0;
    const humidity = current.humidity || 0;
    const windSpeed = current.windSpeed || 0;
    const precipitationProbability = current.precipitationProbability || 0;
    const weatherCode = current.weatherCode || 0;
    
    // Extract 7-day forecast from daily timeline
    const dailyTimeline = data.timelines?.daily || [];
    const forecast = dailyTimeline.slice(0, 7).map(day => {
      const values = day.values || {};
      return {
        date: day.time,
        temperatureMax: Math.round(values.temperatureMax || values.temperature || 0),
        temperatureMin: Math.round(values.temperatureMin || values.temperature || 0),
        weatherCode: values.weatherCode || 0,
        precipitationProbability: Math.round(values.precipitationProbability || 0)
      };
    });
    
    // Map weather codes to descriptions
    const weatherDescriptions = {
      0: 'Unknown',
      1000: 'Clear',
      1001: 'Cloudy',
      1100: 'Mostly Clear',
      1101: 'Partly Cloudy',
      1102: 'Mostly Cloudy',
      2000: 'Fog',
      2100: 'Light Fog',
      3000: 'Light Wind',
      3001: 'Wind',
      3002: 'Strong Wind',
      4000: 'Drizzle',
      4001: 'Rain',
      4200: 'Light Rain',
      4201: 'Heavy Rain',
      5000: 'Snow',
      5001: 'Flurries',
      5100: 'Light Snow',
      5101: 'Heavy Snow',
      6000: 'Freezing Drizzle',
      6001: 'Freezing Rain',
      6200: 'Light Freezing Rain',
      6201: 'Heavy Freezing Rain',
      7000: 'Ice Pellets',
      7101: 'Heavy Ice Pellets',
      7102: 'Light Ice Pellets',
      8000: 'Thunderstorm'
    };
    
    const condition = weatherDescriptions[weatherCode] || 'Unknown';
    
    // Generate advisory based on weather conditions
    let advisory = '';
    if (precipitationProbability > 70) {
      advisory = 'High chance of rain. Postpone spraying activities. Good time for indoor planning.';
    } else if (precipitationProbability > 40) {
      advisory = 'Moderate rain expected. Good time for irrigation planning and soil preparation.';
    } else if (temperature > 35) {
      advisory = 'High temperature. Ensure adequate irrigation. Avoid midday fieldwork.';
    } else if (temperature < 15) {
      advisory = 'Cool weather. Monitor frost-sensitive crops. Good for harvesting.';
    } else if (windSpeed > 20) {
      advisory = 'Windy conditions. Avoid pesticide application. Secure farm equipment.';
    } else {
      advisory = 'Favorable conditions for farming activities. Plan your fieldwork accordingly.';
    }
    
    const duration = Date.now() - startTime;
    logger.info('Weather data retrieved successfully', { 
      lat,
      lon,
      temperature,
      condition,
      durationMs: duration
    });
    
    // Prepare weather data for database
    const weatherDataDoc = {
      location: {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)]
      },
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      temperature: Math.round(temperature),
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed),
      precipitationProbability: Math.round(precipitationProbability),
      weatherCode,
      condition,
      advisory,
      forecast,
      timestamp: new Date(),
      source: 'tomorrow.io'
    };
    
    // Save to MongoDB
    try {
      await weatherDataCollection.insertOne(weatherDataDoc);
      logger.info('Weather data saved to database', { lat, lon });
    } catch (dbError) {
      logger.error('Failed to save weather data to database', { 
        error: dbError.message,
        lat,
        lon
      });
      // Don't fail the request if DB save fails
    }
    
    // Cache the result
    weatherCache.set(cacheKey, {
      timestamp: Date.now(),
      data: {
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed),
        precipitationProbability: Math.round(precipitationProbability),
        weatherCode,
        condition,
        advisory,
        forecast
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed),
        precipitationProbability: Math.round(precipitationProbability),
        weatherCode,
        condition,
        advisory,
        forecast,
        cached: false
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching weather data', { 
      error: error.message,
      durationMs: duration
    });
    
    // Try to return cached data even if stale
    const cacheKey = `${parseFloat(req.query.lat).toFixed(2)},${parseFloat(req.query.lon).toFixed(2)}`;
    const cachedData = weatherCache.get(cacheKey);
    
    if (cachedData) {
      logger.info('Returning stale cached data due to error');
      return res.status(200).json({
        status: 'success',
        data: { ...cachedData.data, cached: true, stale: true }
      });
    }
    
    // Last resort fallback
    res.status(200).json({
      status: 'success',
      data: {
        temperature: 28,
        humidity: 65,
        windSpeed: 10,
        precipitationProbability: 20,
        weatherCode: 1101,
        condition: 'Partly Cloudy',
        advisory: 'Weather data temporarily unavailable. Using estimated conditions.',
        fallback: true
      }
    });
  }
});

// POST /weather/location - Save user location and address
app.post('/weather/location', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { lat, lon, address, userId } = req.body;
    
    // Validation
    if (!lat || !lon) {
      const duration = Date.now() - startTime;
      logger.warn('Location save request failed - missing coordinates', { 
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Latitude and longitude are required'
        }
      });
    }
    
    // Prepare location document
    const locationDoc = {
      userId: userId || 'anonymous',
      location: {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)]
      },
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      address: address || 'Address not provided',
      timestamp: new Date(),
      lastAccessed: new Date()
    };
    
    // Update or insert location (upsert based on userId)
    try {
      await weatherDataCollection.updateOne(
        { userId: locationDoc.userId },
        { 
          $set: locationDoc,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      
      const duration = Date.now() - startTime;
      logger.info('User location and address saved to database', { 
        userId: locationDoc.userId,
        lat,
        lon,
        address,
        durationMs: duration
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Location and address saved successfully'
      });
    } catch (dbError) {
      const duration = Date.now() - startTime;
      logger.error('Failed to save location to database', { 
        error: dbError.message,
        userId: locationDoc.userId,
        durationMs: duration
      });
      
      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save location data'
        }
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error processing location save request', { 
      error: error.message,
      durationMs: duration
    });
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error saving location data'
      }
    });
  }
});

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'KrushiMitra Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tts: '/tts?lang=hi&text=नमस्ते',
      weather: '/weather?lat=18.5204&lon=73.8567',
      auth: '/auth/verify',
      farmers: '/farmers (POST, GET)',
      activities: '/activities (POST, GET)',
      mandiprices: '/mandiprices (GET, POST)',
      ai: '/ai/chat (POST), /ai/interactions (POST)'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /training/metrics - Reads training-metrics.json if present
app.get('/training/metrics', async (req, res) => {
  try {
    const metricsPath = path.join(__dirname, 'training-metrics.json');
    let metrics;
    if (fs.existsSync(metricsPath)) {
      const raw = await fs.promises.readFile(metricsPath, 'utf-8');
      metrics = JSON.parse(raw);
    } else {
      metrics = {
        model: 'yolov8n',
        dataset: process.env.TRAIN_DATASET || 'unknown',
        epoch: Number(process.env.TRAIN_EPOCH || 0),
        accuracyProxy: Number(process.env.VAL_F1 || 0.0),
        map50: Number(process.env.VAL_MAP50 || 0.0),
        timestamp: new Date().toISOString(),
        note: 'Metrics file not found; showing placeholder values.'
      };
    }
    res.json({ status: 'success', data: metrics });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Endpoint not found', { 
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { 
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  });
});

// Start server only if executed directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`KrushiMitra API server running on port ${PORT} (bound to all interfaces)`);
    try {
      await initializeCollections();
      logger.info('Database collections initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database collections', { error: error.message });
    }
  });
}

module.exports = { app };
