import React from 'react';
import SiteNavHeader from '../components/SiteNavHeader'
import SiteTitle from '../components/SiteTitle'
import PageContent from '../components/PageContent'
import SiteFooter from '../components/SiteFooter';

function SiteLayout({ children }) {
  return (
    <box suppressHydrationWarning>
      <SiteNavHeader />
      <SiteTitle />
      <PageContent>
        {children}
      </PageContent>
      <SiteFooter></SiteFooter>
    </box>
  );
}

export default SiteLayout;
