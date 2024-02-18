import '../styles/globals.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    grey: {
      main: '#DDDDDD',
    },
  },
});

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
    <CssBaseline /> {/* resets browser default styles (like margins, font sizes, and line heights)  */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
