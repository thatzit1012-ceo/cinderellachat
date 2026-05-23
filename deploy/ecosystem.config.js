module.exports = {
  apps: [
    {
      name: 'cinderellachat-server',
      script: './server/src/index.js',
      cwd: '/var/www/cinderellachat',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_file: '/var/www/cinderellachat/server/.env',
      error_file: '/var/log/cinderellachat/error.log',
      out_file:   '/var/log/cinderellachat/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
