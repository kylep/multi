import React from 'react';
import PaddedRow from './PaddedRow';

function PageContent({ children }) {
  return (
    <PaddedRow>
      {children}
    </PaddedRow>
  );
}

export default PageContent;