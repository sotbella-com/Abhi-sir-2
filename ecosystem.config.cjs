module.exports = {
  apps: [{
    name: 'sotbella',
    script: 'npm',
    args: 'run preview',
    cwd: '/var/www/sotbella/B2C_Tailwaind',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/sotbella-error.log',
    out_file: '/var/log/pm2/sotbella-out.log',
    log_file: '/var/log/pm2/sotbella-combined.log',
    time: true
  }]
};
