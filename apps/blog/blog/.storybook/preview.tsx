import type { Preview } from '@storybook/nextjs';
import '../design-system/tokens.css';
import '../public/css/globals.css';

// Theme toggle in the toolbar; flips the design-system token swap by setting
// data-theme on the story root (dark is the Terminal default).
const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    layout: 'fullscreen',
  },
  globalTypes: {
    theme: {
      description: 'Design system theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark (Terminal)' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'light' ? 'light' : undefined;
      return (
        <div
          data-theme={theme}
          className="bg-canvas text-default font-sans"
          style={{ padding: 24, minHeight: '100vh' }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
