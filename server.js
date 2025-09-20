const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./db');
const { logger, logDBOperation, logDBError } = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database collections
let farmersCollection;
let activitiesCollection;
let mandipricesCollection;
let aiinteractionsCollection; // Add this line

// Initialize database collections
async function initializeCollections() {
  const startTime = Date.now();
  try {
    const client = await connectToDatabase('admin');
    const db = client.db("KrushiMitraDB");
    
    farmersCollection = db.collection('farmers');
    activitiesCollection = db.collection('activities');
    mandipricesCollection = db.collection('mandiprices');
    aiinteractionsCollection = db.collection('aiinteractions'); // Add this line
    
    const duration = Date.now() - startTime;
    logDBOperation('initializeCollections', { 
      durationMs: duration,
      status: 'success',
      collections: ['farmers', 'activities', 'mandiprices', 'aiinteractions'] // Update this line
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
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header', { 
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header'
      }
    });
  }
  
  const idToken = authHeader.substring(7);
  try {
    const isValid = await verifyFirebaseToken(idToken);
    if (!isValid) {
      logger.warn('Invalid Firebase ID token', { 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid Firebase ID token'
        }
      });
    }
    
    // Add user info to request for logging purposes
    req.userId = 'user_' + Date.now(); // In a real app, this would be the actual user ID
    next();
  } catch (error) {
    logger.error('Error verifying token', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Error verifying token'
      }
    });
  }
}

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
    const { farmerId, query, context } = req.body;
    
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
    
    // Mock AI response - in reality, you'd call an AI service
    const aiResponse = `Based on your query "${query}", I recommend checking the latest mandi prices for your crops and considering weather conditions in your area.`;
    
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
    const { farmerId, query, response, context } = req.body;
    
    // Validation
    if (!farmerId || !query || !response) {
      const duration = Date.now() - startTime;
      logger.warn('AI interaction save failed - missing required fields', { 
        farmerId,
        missingFields: [
          !farmerId ? 'farmerId' : null, 
          !query ? 'query' : null,
          !response ? 'response' : null
        ].filter(Boolean),
        durationMs: duration
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Farmer ID, query, and response are required'
        }
      });
    }
    
    // Save AI interaction to database
    const aiInteraction = {
      farmerId,
      query,
      response,
      context: context || {},
      timestamp: new Date()
    };
    
    const result = await aiinteractionsCollection.insertOne(aiInteraction);
    
    const duration = Date.now() - startTime;
    logDBOperation('saveAIInteraction', { 
      farmerId,
      interactionId: result.insertedId.toString(),
      durationMs: duration,
      status: 'success'
    });
    
    logger.info('AI interaction saved successfully', { 
      farmerId,
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
      farmerId: req.body?.farmerId,
      durationMs: duration
    });
    logger.error('Error saving AI interaction', { 
      error: error.message,
      farmerId: req.body?.farmerId,
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

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  
  res.status(200).json({
    status: 'success',
    message: 'KrushiMitra API is running',
    timestamp: new Date()
  });
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

// Start server
app.listen(PORT, async () => {
  logger.info(`KrushiMitra API server running on port ${PORT}`);
  
  // Initialize database collections
  try {
    await initializeCollections();
    logger.info('Database collections initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database collections', { error: error.message });
  }
});

module.exports = app;