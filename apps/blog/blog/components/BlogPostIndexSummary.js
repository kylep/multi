import { Box, Typography, Link } from '@mui/material';
import React from 'react';

function IndexRowContainer({ children, sx }) {
  return (
    <Box sx={{
      width: '100%',
      height: "80px",
      display: 'flex',
      flexDirection: 'row',
      borderBottom: '1px dotted black',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...sx
    }}>
      {children}
    </Box>
  );
}

function ImageBox({ sx }) {
  return (
    <Box sx={{
      width: '75px',
      height: '75px',
      marginTop: '2px',
      marginaBottom: '3px',
      marginRight: '10px',
      padding: 0,
      border: '1px solid black',
      ...sx
    }} />
  );
}


function IndexPostTextContainer({ children, sx }) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      width: '100%',
      ...sx
    }}>
      {children}
    </Box>
  );
}

function IndexPostTitle({ children, sx }) {
  return (
    <Typography sx={{
      fontWeight: 500,
      color: 'rgb(35, 82, 124)',
      fontSize: "18px",
      ...sx
    }}>
      {children}
    </Typography>
  );
}

function IndexPostSummary({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: "14px",
      color: 'rgb(35, 82, 124)',
      ...sx
    }}>
      {children}
    </Typography>
  );
}

function BlogPostIndexSummary({ file, sx }) {
  return (
    <IndexRowContainer>
        <ImageBox />
        <IndexPostTextContainer>
          <Link underline="hover" href={`/posts/${file.slug}`}>
            <IndexPostTitle>Title: {file.title}</IndexPostTitle>
          </Link>
          <IndexPostSummary>Summary: {file.summary}</IndexPostSummary>
        </IndexPostTextContainer>
    </IndexRowContainer>
  );
}

export default BlogPostIndexSummary;