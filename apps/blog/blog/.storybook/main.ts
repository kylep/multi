import type { StorybookConfig } from '@storybook/nextjs';

// Webpack framework (not nextjs-vite): next.config.js has a custom webpack
// config, which the Vite builder does not support.
const config: StorybookConfig = {
  stories: [
    '../design-system/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
};

export default config;
