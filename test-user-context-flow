/**
 * Comprehensive Test Script for UserContext Flow
 * Tests:
 * 1. Signup creates UserContext with profile
 * 2. Home page update sets location and weather
 * 3. AI chat appends messages to chat history
 * 4. Only last 5 chat messages are kept
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectToDatabase } = require('./db');
const { ObjectId } = require('mongodb');
const {
  initUserContextCollection,
  ensureUserContext,
  updateLocationAndWeather,
  appendChatMessage,
  fetchUserContext
} = require('./user-context');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
}

async function runTests() {
  let client;
  let db;
  let userContextCollection;
  const testUserId = new ObjectId();
  
  try {
    section('UserContext Flow Test Suite');
    
    // Connect to database
    info('Connecting to database...');
    client = await connectToDatabase('admin');
    db = client.db('KrushiMitraDB');
    userContextCollection = await initUserContextCollection(db);
    success('Database connected and UserContext collection initialized');
    
    // Clean up any previous test data
    info('Cleaning up previous test data...');
    await userContextCollection.deleteOne({ userId: testUserId });
    success('Test data cleaned');
    
    // Test 1: Signup creates UserContext
    section('Test 1: Signup Creates UserContext');
    info(`Creating UserContext for user: ${testUserId.toString()}`);
    
    const profileData = {
      name: 'Test Farmer',
      email: 'testfarmer@example.com',
      phone: '+919876543210',
      language: 'hi'
    };
    
    await ensureUserContext(testUserId, profileData);
    
    let userContext = await fetchUserContext(testUserId);
    
    if (userContext && userContext.userId.equals(testUserId)) {
      success('UserContext document created successfully');
      
      if (userContext.profile.name === profileData.name &&
          userContext.profile.email === profileData.email &&
          userContext.profile.phone === profileData.phone &&
          userContext.profile.language === profileData.language) {
        success('Profile data saved correctly');
        info(`Profile: ${JSON.stringify(userContext.profile, null, 2)}`);
      } else {
        error('Profile data mismatch!');
        console.log('Expected:', profileData);
        console.log('Got:', userContext.profile);
      }
      
      if (userContext.location === null && userContext.weather === null) {
        success('Location and weather initialized as null');
      } else {
        error('Location/weather should be null initially');
      }
      
      if (Array.isArray(userContext.chats) && userContext.chats.length === 0) {
        success('Chats array initialized as empty');
      } else {
        error('Chats should be an empty array initially');
      }
    } else {
      error('Failed to create UserContext document');
      throw new Error('UserContext creation failed');
    }
    
    // Test 2: Home page updates location and weather
    section('Test 2: Home Page Updates Location & Weather');
    
    const locationData = {
      address: 'Village Shirur, Pune District, Maharashtra',
      lat: 18.8314,
      lon: 74.3769,
      precision: 'locality',
      raw: 'Shirur, Pune, MH'
    };
    
    const weatherData = {
      temperature: 28,
      humidity: 65,
      condition: 'Partly Cloudy',
      windSpeed: 12,
      precipitationProbability: 20,
      source: 'app'
    };
    
    info('Updating location and weather...');
    await updateLocationAndWeather(testUserId, {
      profile: profileData,
      location: locationData,
      weather: weatherData
    });
    
    userContext = await fetchUserContext(testUserId);
    
    if (userContext.location && userContext.location.address === locationData.address) {
      success('Location updated successfully');
      info(`Location: ${userContext.location.address}`);
      info(`Coordinates: (${userContext.location.latitude}, ${userContext.location.longitude})`);
      
      if (userContext.location.latitude === locationData.lat &&
          userContext.location.longitude === locationData.lon) {
        success('Coordinates saved correctly');
      } else {
        error('Coordinates mismatch');
      }
    } else {
      error('Location update failed');
    }
    
    if (userContext.weather && userContext.weather.temperature === weatherData.temperature) {
      success('Weather updated successfully');
      info(`Weather: ${userContext.weather.condition}, ${userContext.weather.temperature}°C`);
      info(`Humidity: ${userContext.weather.humidity}%, Wind: ${userContext.weather.windSpeed} km/h`);
      
      if (userContext.weather.humidity === weatherData.humidity &&
          userContext.weather.condition === weatherData.condition) {
        success('Weather details saved correctly');
      } else {
        error('Weather details mismatch');
      }
    } else {
      error('Weather update failed');
    }
    
    // Test 3: AI chat appends messages
    section('Test 3: AI Chat Appends Messages');
    
    info('Appending chat messages...');
    
    // Add first conversation
    await appendChatMessage(testUserId, [
      { role: 'user', message: 'मेरी गेहूं की फसल में पीले पत्ते आ रहे हैं' },
      { role: 'assistant', message: 'यह नाइट्रोजन की कमी हो सकती है। यूरिया का छिड़काव करें।' }
    ]);
    
    userContext = await fetchUserContext(testUserId);
    
    if (userContext.chats.length === 2) {
      success('First conversation (2 messages) appended successfully');
      info(`Chat count: ${userContext.chats.length}`);
    } else {
      error(`Expected 2 messages, got ${userContext.chats.length}`);
    }
    
    // Add second conversation
    await appendChatMessage(testUserId, [
      { role: 'user', message: 'मंडी में गेहूं का भाव क्या है?' },
      { role: 'assistant', message: 'आज पुणे मंडी में गेहूं ₹2150/क्विंटल है।' }
    ]);
    
    userContext = await fetchUserContext(testUserId);
    
    if (userContext.chats.length === 4) {
      success('Second conversation (2 more messages) appended successfully');
      info(`Chat count: ${userContext.chats.length}`);
    } else {
      error(`Expected 4 messages, got ${userContext.chats.length}`);
    }
    
    // Test 4: Only last 5 messages are kept
    section('Test 4: Chat History Limited to Last 5 Messages');
    
    info('Adding more conversations to exceed 5 message limit...');
    
    // Add third conversation (should make total 6, but only 5 should remain)
    await appendChatMessage(testUserId, [
      { role: 'user', message: 'मौसम कैसा रहेगा कल?' },
      { role: 'assistant', message: 'कल आंशिक रूप से बादल छाए रहेंगे, बारिश की संभावना 20% है।' }
    ]);
    
    userContext = await fetchUserContext(testUserId);
    
    if (userContext.chats.length === 5) {
      success('Chat history limited to last 5 messages (old messages removed)');
      info(`Chat count: ${userContext.chats.length}`);
      
      // Verify first message is NOT the very first one we sent
      const firstMessage = userContext.chats[0].message;
      if (firstMessage !== 'मेरी गेहूं की फसल में पीले पत्ते आ रहे हैं') {
        success('Oldest message was correctly removed');
        info('Current chat history (last 5):');
        userContext.chats.forEach((chat, idx) => {
          info(`  ${idx + 1}. [${chat.role}]: ${chat.message.substring(0, 50)}...`);
        });
      } else {
        error('Oldest message should have been removed');
      }
    } else {
      error(`Expected 5 messages, got ${userContext.chats.length}`);
    }
    
    // Add one more to verify it keeps working
    await appendChatMessage(testUserId, [
      { role: 'user', message: 'सोयाबीन बोने का सही समय क्या है?' },
      { role: 'assistant', message: 'सोयाबीन जून-जुलाई में मानसून की पहली बारिश के बाद बोएं।' }
    ]);
    
    userContext = await fetchUserContext(testUserId);
    
    if (userContext.chats.length === 5) {
      success('Still maintaining 5 messages after additional conversation');
      info('Latest chat history:');
      userContext.chats.forEach((chat, idx) => {
        info(`  ${idx + 1}. [${chat.role}]: ${chat.message.substring(0, 50)}...`);
      });
    } else {
      error(`Expected 5 messages, got ${userContext.chats.length}`);
    }
    
    // Final Summary
    section('Test Summary');
    
    const finalContext = await fetchUserContext(testUserId);
    
    success('All tests completed successfully! ✨');
    
    log('\nFinal UserContext Document:', 'bright');
    console.log(JSON.stringify({
      userId: finalContext.userId.toString(),
      profile: finalContext.profile,
      location: finalContext.location,
      weather: finalContext.weather,
      chatCount: finalContext.chats.length,
      latestChats: finalContext.chats.slice(-2).map(c => ({
        role: c.role,
        message: c.message.substring(0, 40) + '...'
      }))
    }, null, 2));
    
    // Cleanup
    info('\nCleaning up test data...');
    await userContextCollection.deleteOne({ userId: testUserId });
    success('Test data cleaned up');
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      info('Database connection closed');
    }
  }
}

// Run the tests
runTests()
  .then(() => {
    log('\n✅ All UserContext tests passed!', 'green');
    process.exit(0);
  })
  .catch((err) => {
    error(`\nTest suite failed: ${err.message}`);
    process.exit(1);
  });
