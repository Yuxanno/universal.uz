# Universal.uz - VPS Deployment Guide

## Current Status
✅ Backend running on PM2 (port 5000)
⚠️ Nginx needs configuration

## Step-by-Step Deployment

### 1. Build Frontend
```bash
cd /var/www/universal.uz/client
npm install
npm run build
```

### 2. Configure Nginx

Copy the configuration file:
```bash
sudo cp /var/www/universal.uz/nginx-config/universal.uz.conf /etc/nginx/sites-available/universal.uz
```

Create symbolic link:
```bash
sudo ln -s /etc/nginx/sites-available/universal.uz /etc/nginx/sites-enabled/universal.uz
```

Test Nginx configuration:
```bash
sudo nginx -t
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

### 3. Update Environment Variables

Edit server .env file:
```bash
nano /var/www/universal.uz/.env
```

Update these values:
```env
BASE_URL=https://pos.universalbozor.uz
CLIENT_URL=https://pos.universalbozor.uz
```

### 4. Restart PM2 Process

```bash
cd /var/www/universal.uz
pm2 restart universal-uz
pm2 save
```

### 5. Setup SSL Certificate (Optional but Recommended)

Install Certbot:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d pos.universalbozor.uz
```

After SSL is obtained, edit the Nginx config to uncomment the HTTPS section:
```bash
sudo nano /etc/nginx/sites-available/universal.uz
```

Uncomment the HTTPS server block and the HTTP redirect line, then reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup PM2 Startup

Make PM2 start on system boot:
```bash
pm2 startup
pm2 save
```

## Monitoring

Check PM2 status:
```bash
pm2 status
pm2 logs universal-uz
```

Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/universal.uz-access.log
sudo tail -f /var/log/nginx/universal.uz-error.log
```

## Troubleshooting

### Backend not responding
```bash
pm2 restart universal-uz
pm2 logs universal-uz --lines 50
```

### Nginx errors
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Port already in use
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
pm2 restart universal-uz
```

## File Structure on VPS

```
/var/www/universal.uz/
├── client/
│   ├── dist/              # Built frontend files
│   └── ...
├── server/
│   ├── src/
│   │   └── index.js       # Main server file
│   └── uploads/           # User uploaded files
├── .env                   # Environment variables
└── nginx-config/          # Nginx configuration
```

## Multiple Projects Setup

For additional projects, create separate Nginx config files:

```bash
/etc/nginx/sites-available/
├── universal.uz           # This project
├── project2.com          # Another project
└── project3.com          # Another project
```

Each project should:
- Run on a different port (5000, 5001, 5002, etc.)
- Have its own PM2 process
- Have its own Nginx configuration
- Have its own domain/subdomain

## Quick Commands Reference

```bash
# PM2
pm2 list                    # List all processes
pm2 restart universal-uz    # Restart app
pm2 logs universal-uz       # View logs
pm2 stop universal-uz       # Stop app
pm2 delete universal-uz     # Remove from PM2

# Nginx
sudo nginx -t               # Test config
sudo systemctl reload nginx # Reload config
sudo systemctl restart nginx # Restart Nginx
sudo systemctl status nginx # Check status

# Build & Deploy
cd /var/www/universal.uz/client && npm run build
pm2 restart universal-uz
```

## Security Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Setup SSL certificate
- [ ] Configure firewall (ufw)
- [ ] Setup regular backups
- [ ] Enable fail2ban
- [ ] Keep system updated
- [ ] Monitor logs regularly
