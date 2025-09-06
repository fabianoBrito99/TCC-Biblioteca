module.exports = {
  apps: [
    {
      name: "api",
      cwd: "/srv/apps/biblioteca/api",
      script: "main.js",
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
      name: "web",
      cwd: "/srv/apps/biblioteca",
      script: "npm",
      args: "start -- -p 3001",
      instances: 1,
      autorestart: true,
      env: { NODE_ENV: "production" }
    }
  ]
}
