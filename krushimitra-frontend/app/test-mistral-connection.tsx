import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { queryMistralStream } from '../src/utils/mistral';

export default function TestMistralConnection() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      console.log('🧪 Testing Mistral connection...');
      
      const testQuery = 'नमस्ते! मैं KrushiMitra ऐप का परीक्षण कर रहा हूं। क्या आप काम कर रहे हैं?';
      
      // Use regular query instead of stream for simpler testing
      const response = await fetch('http://localhost:5000/api/mistral/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery,
          language: 'hi'
        }),
      });
      
      const data = await response.json();
      const result = data.response || 'No response received';
      
      console.log('✅ Mistral response received:', result);
      setResponse(result);
      
      Alert.alert('सफलता!', 'Mistral AI सफलतापूर्वक जुड़ा है।');
      
    } catch (error: any) {
      console.error('❌ Mistral connection error:', error);
      setResponse(`Error: ${error?.message || 'Unknown error'}`);
      Alert.alert('त्रुटि', `Connection failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    try {
      console.log('🔍 Testing health endpoint...');
      
      const response = await fetch('http://localhost:5000/api/mistral/health');
      const data = await response.json();
      
      console.log('Health check result:', data);
      
      Alert.alert('Health Check', JSON.stringify(data, null, 2));
      
    } catch (error: any) {
      console.error('Health check error:', error);
      Alert.alert('Health Check Failed', error?.message || 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mistral AI Connection Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testHealth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Test Health Check</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Mistral AI'}
        </Text>
      </TouchableOpacity>
      
      {response ? (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response:</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ) : null}
      
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Expected Setup:</Text>
        <Text style={styles.infoText}>
          • Flask server running on http://localhost:5000{'\n'}
          • Mistral model loaded successfully{'\n'}
          • React Native app connected to local API{'\n'}
          • No Ollama dependency
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
  },
  info: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7f8c8d',
  },
});