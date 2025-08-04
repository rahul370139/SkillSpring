#!/bin/bash

# TrainPI Backend Deployment Script for Vercel

echo "🚀 Deploying TrainPI Backend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Set environment variables (if not already set)
echo "🔧 Setting up environment variables..."
echo "Note: You may need to set these in the Vercel dashboard:"
echo "- GROQ_API_KEY"
echo "- NEXT_PUBLIC_SUPABASE_URL" 
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your API will be available at: https://your-project.vercel.app/api"
echo "📖 Check DEPLOYMENT.md for testing instructions" 