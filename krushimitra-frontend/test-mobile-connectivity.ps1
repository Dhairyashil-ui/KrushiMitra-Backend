# Test Mobile Connectivity
# Run this to verify your services are accessible from mobile

Write-Host "`n=== KrushiMitra Mobile Connectivity Test ===" -ForegroundColor Cyan

# Get IP from .env if it exists
$envFile = Get-Content .env -ErrorAction SilentlyContinue
$backendUrl = ($envFile | Select-String "EXPO_PUBLIC_BACKEND_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
$ollamaUrl = ($envFile | Select-String "EXPO_PUBLIC_OLLAMA_SERVER=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })

if (!$backendUrl) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.0.*" } | Select-Object -First 1).IPAddress
    $backendUrl = "http://${ip}:3001"
    $ollamaUrl = "http://${ip}:11434"
}

Write-Host "`nTesting connectivity to:" -ForegroundColor White
Write-Host "  Backend: $backendUrl" -ForegroundColor Gray
Write-Host "  Ollama:  $ollamaUrl" -ForegroundColor Gray
Write-Host ""

# Test Backend
Write-Host "Testing Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is accessible!" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Backend not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure backend is running and listening on 0.0.0.0:3001" -ForegroundColor Yellow
}

Write-Host ""

# Test Ollama
Write-Host "Testing Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ollamaUrl/api/tags" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Ollama is accessible!" -ForegroundColor Green
        $models = ($response.Content | ConvertFrom-Json).models.name
        if ($models) {
            Write-Host "  Available models: $($models -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ Ollama not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure Ollama is running with OLLAMA_HOST=0.0.0.0:11434" -ForegroundColor Yellow
    Write-Host "  The app will use cloud LLM (Groq) as fallback" -ForegroundColor Cyan
}

Write-Host ""

# Test Weather API
Write-Host "Testing Weather API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/weather?lat=18.5919&lon=73.7389" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Weather API is working!" -ForegroundColor Green
        $weather = ($response.Content | ConvertFrom-Json)
        if ($weather.data.temperature) {
            Write-Host "  Temperature: $($weather.data.temperature)°C" -ForegroundColor Gray
            Write-Host "  Condition: $($weather.data.condition)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ Weather API not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nTo test from your mobile device:" -ForegroundColor White
Write-Host "1. Connect mobile to SAME WiFi as this computer" -ForegroundColor Gray
Write-Host "2. Open mobile browser and visit:" -ForegroundColor Gray
Write-Host "   $backendUrl/health" -ForegroundColor Yellow
Write-Host "3. You should see a JSON response with 'status: ok'" -ForegroundColor Gray
Write-Host ""
