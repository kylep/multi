/** @type {import('next').NextConfig} */

module.exports = {
  async rewrites() {
    return [
      {
        source: '/:path*.html',
        destination: '/:path*',
      },
    ]
  },
  output: 'export',
  images: {unoptimized: true},
  webpack: (config, { isServer }) => {
    // don't polyfill `fs`
    // https://stackoverflow.com/questions/64926174/module-not-found-cant-resolve-fs-in-next-js-application
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
