import React from 'react';
import SiteNavHeader from '../components/SiteNavHeader'
import SiteTitle from '../components/SiteTitle'
import PageContent from '../components/PageContent'
import SiteFooter from '../components/SiteFooter';

function SiteLayout({ children }) {
  return (
    <>
      <SiteNavHeader />
      <SiteTitle />
      <PageContent>
        {children}
      </PageContent>
      <SiteFooter></SiteFooter>
    </>
  );
}

export default SiteLayout;
