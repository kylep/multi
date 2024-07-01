/** @type {import('next').NextConfig} */
module.exports = {

  productionBrowserSourceMaps: true,

  async rewrites() {

    return [
      // make dev work like stage/prod's post-build index file overwite
      {source: '/', destination: '/index1.html',},

      // strip .html from URLs for matching dev and staging... Maybe.
      { source: '/:path*.html', destination: '/:path*',},
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
    config.optimization.minimize = false;
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
