module.exports = {
  apps: [
    {
      name: "villa-api",
      cwd: "/var/www/Booking-Villa/apps/api",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "villa-public",
      cwd: "/var/www/Booking-Villa/apps/web-public",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "villa-admin",
      cwd: "/var/www/Booking-Villa/apps/web-admin",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "3010",
      },
    },
  ],
};
