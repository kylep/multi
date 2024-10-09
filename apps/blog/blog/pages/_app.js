import '../public/css/globals.css';
import '../public/css/prism.css';
import '../public/js/prism.js';

import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const customColors = {
  headerGrey: '#EEEEEE',
  headerBlue: '#337ab7',
  textGrey: '#333333',
  blogPostGrey: "#888888",
};

const theme = createTheme({
  palette: {
    headerGrey: customColors.headerGrey,
    headerBlue: customColors.headerBlue,
    textGrey: customColors.textGrey,
  },
  typography: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    titleHeaderH1: {
      fontWeight: 500,
      fontSize: ['50px', '63px'],
      '@media (min-width:0px)': { fontSize: "50px"},
      '@media (min-width:600px)': { fontSize: "63px"},
      color: customColors.headerBlue,
    },
    titleHeaderH3: {
      fontWeight: 250,
      fontSize: '21px',
      color: customColors.textGrey,
      lineHeight: '1.5',
    },
    BlogPostTitleHeader: {
      fontWeight: 550,
      fontSize: '35px',
      color: customColors.headerBlue,
    },
    blogPostGreySubtitle: {
      fontSize: '14px',
      color: customColors.blogPostGrey,
    },
    sidebarLink: {
      color: customColors.headerBlue,
      textDecoration: 'none',
      fontWeight: 500,
      fontSize: "small"
    },
    sidebarText: {
      color: customColors.textGrey,
      fontWeight: 500,
      fontSize: "small"
    },
    footerText: {
      fontSize: "small",
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
