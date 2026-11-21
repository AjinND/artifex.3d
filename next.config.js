/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/staff/sample": [
      "./studio-assets/balancing-form/review/balancing-form.glb",
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
