module.exports = {
  apps: [
    {
      name: "devlock-backend",
      script: "npm",
      args: "run start",
      cwd: "./backend",
      env: {
        NODE_ENV: "production",
        PORT: 6002
      }
    },
    {
      name: "devlock-frontend",
      script: "npm",
      args: "run start",
      cwd: "./frontend",
      env: {
        NODE_ENV: "production",
        PORT: 6001
      }
    }
  ]
};
