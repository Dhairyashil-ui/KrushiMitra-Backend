# Test Groq API Key
# Replace YOUR_API_KEY with your actual Groq API key

$apiKey = "gsk_YOUR_API_KEY_HERE"
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    model = "llama-3.1-8b-instant"
    messages = @(
        @{
            role = "system"
            content = "You are a helpful farming assistant."
        },
        @{
            role = "user"
            content = "Hello, test message"
        }
    )
    temperature = 0.7
    max_tokens = 100
} | ConvertTo-Json -Depth 10

Write-Host "Testing Groq API..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.groq.com/openai/v1/chat/completions" -Method Post -Headers $headers -Body $body
    Write-Host "`n✅ SUCCESS! Groq API is working!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Yellow
    Write-Host $response.choices[0].message.content
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "`nCheck:" -ForegroundColor Yellow
    Write-Host "1. API key is correct"
    Write-Host "2. You have internet connection"
}
