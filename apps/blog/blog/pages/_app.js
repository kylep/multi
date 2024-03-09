import '../styles/globals.css';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const customColors = {
  headerGrey: '#EEEEEE',
  headerBlue: '#337ab7',
  textGrey: '#333333',
};

const theme = createTheme({
  palette: {
    headerGrey: customColors.headerGrey,
    headerBlue: customColors.headerBlue,
    textGrey: customColors.textGrey,
  },
  typography: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '63px',
      color: customColors.headerBlue,
    },
    h3: {
      fontWeight: 250,
      fontSize: '21px',
      color: customColors.textGrey,
      lineHeight: '1.5',
    }
  },
});



export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* resets browser default styles (like margins, font sizes, and line heights)  */}
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
