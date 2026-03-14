import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/esp32/:ip/:path*",
        destination: "http://:ip/:path*", // Proxy to the ESP32 IP
      },
    ];
  },
};

export default nextConfig;
