/** @type {import('next').NextConfig} */
module.exports = {

  productionBrowserSourceMaps: true,

  // Strip .html from URLs in dev so links like /foo.html work the same as
  // they do in prod (where static files are served directly). Rewrites are
  // not supported with output: 'export' at build time, so guard on NODE_ENV.
  ...(process.env.NODE_ENV === 'development' ? {
    async rewrites() {
      return [
        { source: '/:path*.html', destination: '/:path*' },
      ];
    },
  } : {}),

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
    config.optimization.minimize = false;
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
