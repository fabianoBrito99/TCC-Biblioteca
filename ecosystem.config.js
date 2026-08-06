module.exports = {
  apps: [
    {
      name: "biblioteca-api",
      cwd: "/srv/apps/biblioteca",
      script: "api/main.js",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        DB_HOST: "127.0.0.1",
        DB_PORT: 3306,
        DB_USER: "bibli",
        DB_PASSWORD: "93234428Fbs#", 
        DB_NAME: "biblioteca_tcc",
        IMAGES_BASE_URL: "https://img.helenaramazzotte.online",
        CORS_ORIGINS: "https://app.helenaramazzotte.online"
      }
    },
    {
      name: "biblioteca-web",
      cwd: "/srv/apps/biblioteca",
      script: "npm",
      args: "run start -- -p 3000 -H 127.0.0.1",
      instances: 1,
      autorestart: true,
      env: { NODE_ENV: "production" }
    },
    {
      name: "cpu-guard",
      cwd: "/srv/apps/biblioteca",
      script: "/bin/bash",
      args: "-lc ./ops/cpu-guard.sh",
      instances: 1,
      autorestart: true,
      env: {
        SCAN_INTERVAL: 15,
        CPU_THRESHOLD: 80
      }
    }
  ]
}
