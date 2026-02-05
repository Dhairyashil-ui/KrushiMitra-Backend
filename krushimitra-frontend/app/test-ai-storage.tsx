import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { saveAIInteraction } from '@/src/utils/api';

export default function TestAIStorage() {
  const [status, setStatus] = useState<string>('');

  const testSaveInteraction = async () => {
    setStatus('Saving interaction...');
    
    try {
      const success = await saveAIInteraction({
        farmerId: 'test_user_123',
        query: 'Test query: What is the weather today?',
        response: 'Test response: The weather is sunny with a high of 28°C.',
        context: {}
      });
      
      
      if (success) {
        setStatus('Interaction saved successfully!');
      } else {
        setStatus('Failed to save interaction');
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Interaction Storage Test</Text>
      <TouchableOpacity style={styles.button} onPress={testSaveInteraction}>
        <Text style={styles.buttonText}>Test Save Interaction</Text>
      </TouchableOpacity>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});