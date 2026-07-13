#!/bin/bash

# AWS EC2 Deployment Script for Sotbella
# Run this on your EC2 instance after initial setup

echo "🚀 Starting Sotbella deployment on EC2 (ubuntu user)..."


# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Create app directory
sudo mkdir -p /var/www/sotbella/B2C_Tailwaind
# Ensure ubuntu owns the directory to avoid npm EACCES
sudo chown -R ubuntu:ubuntu /var/www/sotbella

# Clone repository (supports private repo via GITHUB_TOKEN if provided)
cd /var/www/sotbella/B2C_Tailwaind
if [ -n "$GITHUB_TOKEN" ]; then
  echo "Using GITHUB_TOKEN for private repo access"
  git clone https://$GITHUB_TOKEN@github.com/sotbella-com/B2C_Tailwaind.git .
else
  git clone https://github.com/sotbella-com/B2C_Tailwaind.git .
fi

# Install dependencies
npm install  --legacy-peer-deps

# Use production environment file for build
# Copy .env.production to .env for the build process
if [ -f .env.production ]; then
  cp .env.production .env
  echo "✅ Using .env.production for build"
else
  echo "⚠️  Warning: .env.production not found, using .env"
fi

# Build the application
npm run build

# Start the application with PM2 (using repo's ecosystem.config.js if present)
if [ -f ecosystem.config.cjs ]; then
  pm2 start ecosystem.config.cjs
elif [ -f ecosystem.config.js ]; then
  pm2 start ecosystem.config.js
else
  pm2 start npm --name sotbella -- run preview
fi
pm2 save
# Configure PM2 to start on boot for ubuntu user
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ Application deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy uae.conf to /etc/nginx/sites-available/sotbella-uae"
echo "2. Create symlink: sudo ln -s /etc/nginx/sites-available/sotbella-uae /etc/nginx/sites-enabled/"
echo "3. Test nginx: sudo nginx -t"
echo "4. Reload nginx: sudo systemctl reload nginx"
echo "5. Configure DNS for sotbella.ae to point to this server"
echo ""
echo "🌐 Nginx configuration for sotbella.ae is ready in uae.conf"
