# SSG-003: Material UI in a Static Site

This is intended to build upon [ssg-02-metadata-and-style](../ssg-02-metadata-and-style).
Reference that to see the starting state for these instructions.

## Objective
Last guide added some basic styles and metadata that can be used in templates. This one
will show how to set up MUI and provide some really basic examples. I'll add a fair bit
of styling to this sample repo too.

# Install Material UI

Install the base packages.

- @mui/material: Core Material UI library. Provides React components.
- @emotion/react: MUI uses it for styling its components. Install it, to enable
  styling of components using the CSS-in-JS approach.
- @emotion/styled: Allows you to create React components with styles attached to them.
  Used for customizing Material UI components beyond basic theming.
- styled-components: Lets you style components like `StyledAppBar = styled(AppBar)`
- babel-plugin-styled-components: improves the server-side rendering of styled components. Tbh I'm not sure we need this.
- @mui/icons-material: Used for icons like the HomeIcon

```bash
npm install \
  @mui/material \
  @emotion/react \
  @emotion/styled \
  styled-components \
  babel-plugin-styled-components \
  @mui/icons-material
```

# Set up styles

## Basic style sheet

```bash
mkdir -p style
```

Make a really basic stylesheet for global styles
`vi style/main.css`
```css
body {
    margin: 0;
    padding: 0;
}
```

# Make some components

```bash
mkdir -p components
```

The page will be split out into 4 vertical sections:
- `TopBar`: The nav bar with links at the top
- `TitleHeader`: A section for the title of the website
- `MainContentRow`: Where the content and sidebar go.
- `PageFooter`: Regular ol' footer

From there, `MainContent` aught to be split into two sections horizontally:
- `PageContent`: Where the content goes
- `ContentSidebar`: Where the sidebar goes

Then we wrap the whole thing up as a `PageTemplate`.
