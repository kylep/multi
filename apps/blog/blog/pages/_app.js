import '../design-system/tokens.css';
import '../public/css/globals.css';
import '../public/css/prism.css';
import '../public/js/prism.js';

import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof window.gtag === 'function') {
        window.gtag('config', 'G-LF6FVVWFMN', { page_path: url });
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-LF6FVVWFMN"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-LF6FVVWFMN');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}
