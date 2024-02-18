import React from 'react';
import PaddedRow from './PaddedRow';
import BlogPostRow from './BlogPostRow';
import BlogSidebar from './BlogSidebar';

function PageContent({ children }) {
  return (
    <PaddedRow>
      <BlogPostRow>
        {children}
      </BlogPostRow>
      <BlogSidebar />
    </PaddedRow>
  );
}

export default PageContent;