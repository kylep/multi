import { Box } from '@mui/material';
import React from 'react';

function BlogPostRow({ children, sx }) {
  return (
    <Box sx={{
      width: 'calc(100% - 200px)',
      padding: '20px',
      ...sx
    }}>
      {children}
    </Box>
  );
}

export default BlogPostRow;