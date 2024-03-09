import React from 'react';
import PaddedRow from './PaddedRow';
import BlogPostRow from './BlogPostRow';
import BlogSidebar from './BlogSidebar';

function PageContent({ children, sx }) {
  return (
    <PaddedRow sx={sx}>
      <BlogPostRow>
        {children}
      </BlogPostRow>
      <BlogSidebar />
    </PaddedRow>
  );
}

export default PageContent;