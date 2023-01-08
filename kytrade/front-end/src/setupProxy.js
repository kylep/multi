const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://kytrade2-kytrade-api-1:5000',
			pathRewrite: {
				'^/api': '/',
			},
      changeOrigin: true,
    })
  );
};
