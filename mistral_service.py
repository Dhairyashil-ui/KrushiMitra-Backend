import json
import sys
import os
import requests

def get_groq_response(prompt, action='chat'):
    """Get response from Groq API using a supported model"""
    
    # Get API key from environment
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        return {"response": "Groq API key not configured. Please set GROQ_API_KEY environment variable."}
    
    # Use the latest supported model
    model = 'llama-3.1-8b-instant'
    
    # Create appropriate prompt based on action
    if action == 'advice':
        full_prompt = f"You are a helpful farming assistant. Provide practical farming advice for this query: {prompt}"
    elif action == 'diagnose':
        full_prompt = f"You are a crop disease diagnosis expert. Analyze these symptoms and provide diagnosis: {prompt}"
    else:  # chat
        full_prompt = prompt
    
    try:
        # Make request to Groq API
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'messages': [{'role': 'user', 'content': full_prompt}],
                'temperature': 0.7,
                'max_tokens': 1000
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            ai_response = data['choices'][0]['message']['content']
            return {"response": ai_response}
        else:
            error_data = response.json()
            return {"response": f"Error from Groq API: {error_data.get('error', {}).get('message', 'Unknown error')}"}
            
    except Exception as e:
        return {"response": f"Error connecting to Groq API: {str(e)}"}

def main():
    """Main function to handle stdin input"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"response": "No input provided"}))
            return
            
        # Parse JSON input
        request = json.loads(input_data)
        action = request.get('action', 'chat')
        input_text = request.get('input', '')
        
        if not input_text:
            print(json.dumps({"response": "No input text provided"}))
            return
            
        # Get response from Groq
        result = get_groq_response(input_text, action)
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({"response": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"response": f"Error processing request: {str(e)}"}))

if __name__ == "__main__":
    main()