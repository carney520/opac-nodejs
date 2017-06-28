module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "opac-nodejs",
      script: "./bin/run",
      instances: 0,
      exec_mode: "cluster",
      env: {
        watch: true,
        NODE_ENV: "development",
        PORT: "3000",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
}
