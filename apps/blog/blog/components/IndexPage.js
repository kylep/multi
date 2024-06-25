import { Box, Typography, Link } from '@mui/material';
import React from 'react';
import Image from 'next/image';
import Pagination from '../components/Pagination';


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

function ImageBox({ thumbnail, sx }) {
  const imagePath = thumbnail ? ('/images/'+thumbnail) : '/images/gear-thumb.png';
  return (
    <Box sx={{
      width: '75px',
      height: '75px',
      marginTop: '2px',
      marginaBottom: '3px',
      marginRight: '10px',
      padding: 0,
      ...sx
    }}>
      <Image src={imagePath} alt="" width={70} height={70} />
    </Box>
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
      height: "24px",
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

function DateStamp({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: "10px",
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
        <ImageBox thumbnail={file.thumbnail} />
        <IndexPostTextContainer>
          <Link underline="hover" href={`/${file.slug}.html`}>
            <IndexPostTitle>{file.title}</IndexPostTitle>
          </Link>
          <DateStamp>Created: {file.date}, Modified: {file.modified}</DateStamp>
          <IndexPostSummary>{file.summary}</IndexPostSummary>
        </IndexPostTextContainer>
    </IndexRowContainer>
  );
}

const handlePageChange = (_, page) => {
    window.location.href = `/index${page}.html`;
};

export function IndexPage({ markdownFiles, currentPageIndexNumber, pageCount }) {
	return (
		<>
			{markdownFiles.map((file) => (
				<BlogPostIndexSummary key={file.metaData.slug} file={file.metaData} />
			))}
			<Pagination 
				page={currentPageIndexNumber} 
				count={pageCount} 
				shape="rounded"
				onChange={handlePageChange}
				sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
			/>
		</>
	);
}

export default IndexPage;