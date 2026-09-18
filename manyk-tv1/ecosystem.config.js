// PM2 Ecosystem Configuration - Load Balanced Multi-Instance Setup
module.exports = {
  apps: [
    {
      name: 'manyak-tv-production',
      script: './server.js',
      
      // ═══ LOAD BALANCING: CLUSTER MODE ═══
      // PM2 avtomatik ravishda bir nechta instance yaratadi va
      // ularni load balancing qiladi (round-robin algoritmi)
      instances: 'max', // CPU yadrolari soniga teng (masalan, 4 core = 4 instance)
      exec_mode: 'cluster', // Cluster mode (load balancing)
      
      // ═══ PRODUCTION OPTIMIZATIONS ═══
      node_args: '--max-old-space-size=2048 --no-warnings=ExperimentalWarning', // 2GB heap + disable warnings
      max_memory_restart: '1G', // 1GB dan oshsa, restart
      
      // ═══ AUTO RESTART & ERROR HANDLING ═══
      autorestart: true, // Crash bo'lsa avtomatik qayta ishga tushiradi
      max_restarts: 10, // Maksimal restart soni (1 daqiqada)
      min_uptime: '10s', // Kamida 10s ishlasa, restart count reset
      restart_delay: 4000, // Restart orasida 4s kutish
      
      // ═══ WATCH MODE (Development uchun - Production'da o'chiring) ═══
      watch: false, // Production'da false, dev'da true
      ignore_watch: ['node_modules', 'dist', 'data', 'uploads', 'logs'],
      
      // ═══ ENVIRONMENT VARIABLES ═══
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        WATCH: true,
      },
      
      // ═══ LOGGING ═══
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      merge_logs: true,
      
      // ═══ GRACEFUL SHUTDOWN ═══
      kill_timeout: 5000, // 5s kutib, keyin SIGKILL
      listen_timeout: 3000,
      shutdown_with_message: true,
    },
  ],

  // ═══ DEPLOYMENT CONFIGURATION (opsional) ═══
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/manyak-tv.git',
      path: '/var/www/manyak-tv',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
