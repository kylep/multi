import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    //window.location.replace('/index1.html');
  }, []);
  return (
  <html>
    <head>
      <meta httpEquiv="refresh" content="0; url=/index1.html" />
    </head>
    <div>
      Redirecting to <a href="/index1.html">/index1.html</a>
    </div>
  </html>
  );
}
