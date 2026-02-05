# KrushiMitra - Quick Deploy to Vercel Script
# Run this script before deploying

Write-Host "🚀 KrushiMitra Frontend - Vercel Deployment Preparation" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git repository not initialized" -ForegroundColor Red
    Write-Host "Run: git init" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git repository found" -ForegroundColor Green

# Check if vercel.json exists
if (-not (Test-Path vercel.json)) {
    Write-Host "❌ vercel.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ vercel.json found" -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path .env.production)) {
    Write-Host "⚠️  .env.production not found - creating from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env.production
    Write-Host "📝 Please edit .env.production with your production values" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.production found" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Pre-deployment Checklist:" -ForegroundColor Cyan
Write-Host ""

# Display current environment variables
Write-Host "Current Production Configuration:" -ForegroundColor Yellow
Write-Host "  Backend URL: https://krushimitra-backend-1.onrender.com" -ForegroundColor White
Write-Host "  LLM Server: https://measurement-worked-contamination-sustainable.trycloudflare.com" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Required Environment Variables for Vercel:" -ForegroundColor Cyan
Write-Host "  1. EXPO_PUBLIC_ENVIRONMENT=production"
Write-Host "  2. EXPO_PUBLIC_BACKEND_URL=https://krushimitra-backend-1.onrender.com"
Write-Host "  3. EXPO_PUBLIC_OLLAMA_SERVER=https://measurement-worked-contamination-sustainable.trycloudflare.com"
Write-Host "  4. EXPO_PUBLIC_FIREBASE_* (all Firebase config variables)"
Write-Host ""

Write-Host "📦 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Commit your changes: git add . && git commit -m 'Prepare for deployment'"
Write-Host "  2. Push to GitHub: git push origin main"
Write-Host "  3. Go to vercel.com/new and import your repository"
Write-Host "  4. Add environment variables in Vercel dashboard"
Write-Host "  5. Deploy!"
Write-Host ""

Write-Host "Alternative: Use Vercel CLI" -ForegroundColor Cyan
Write-Host "  1. Install: npm install -g vercel"
Write-Host "  2. Login: vercel login"
Write-Host "  3. Deploy: vercel --prod"
Write-Host ""

# Ask if user wants to test build locally
$testBuild = Read-Host "Would you like to test the build locally first? (y/n)"

if ($testBuild -eq "y" -or $testBuild -eq "Y") {
    Write-Host ""
    Write-Host "🔨 Building project..." -ForegroundColor Cyan
    npm run build:mobile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
        Write-Host "📁 Output directory: dist-web" -ForegroundColor White
    } else {
        Write-Host "❌ Build failed - please fix errors before deploying" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Ready for deployment! Follow the steps above." -ForegroundColor Green
Write-Host "📖 For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Cyan
