import { Box, Typography, Link } from '@mui/material';
import Image from 'next/image';
import Head from 'next/head';
import Pagination from '../components/Pagination';

const SITE_URL = 'https://kyle.pericak.com';


function IndexRowContainer({ children, sx }) {
  return (
    <Box sx={{
      width: '100%',
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

function ImageBox({ thumbnail, title, sx }) {
  const imagePath = thumbnail ? (`/images/${thumbnail}`) : '/images/gear-thumb.png';
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
      <Image src={imagePath} alt={title || ''} width={70} height={70} />
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
      fontSize: ['16px', '18px'],  // Smaller font size on smaller screens
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

function BlogPostIndexSummary({ file }) {
  return (
    <IndexRowContainer>
        <ImageBox thumbnail={file.thumbnail} title={file.title} />
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

const handlePageChange = (page) => {
    window.location.href = `/index${page}.html`;
};

function getCanonicalUrl(route) {
	if (!route || route[0] === 'index') return SITE_URL + '/';
	if (route[0] === 'category') return `${SITE_URL}/category/${route[1]}`;
	if (route[0] === 'tag') return `${SITE_URL}/tag/${route[1]}`;
	return `${SITE_URL}/${route[0]}.html`;
}

function getPageTitle(route) {
	if (!route || route[0] === 'index' || route[0].startsWith('index')) return "Kyle Pericak's Blog";
	if (route[0] === 'category') return `${route[1]} - Kyle Pericak's Blog`;
	if (route[0] === 'tag') return `${route[1]} - Kyle Pericak's Blog`;
	return "Kyle Pericak's Blog";
}

const SITE_DESCRIPTION = "Kyle Pericak's blog about infrastructure, DevOps, security, and software engineering.";

export function IndexPage({ markdownFiles, currentPageIndexNumber, pageCount, route }) {
	const canonicalUrl = getCanonicalUrl(route);
	const pageTitle = getPageTitle(route);
	return (
		<>
			<Head>
				<title>{pageTitle}</title>
				<meta name="description" content={SITE_DESCRIPTION} />
				<link rel="canonical" href={canonicalUrl} />
				<meta property="og:title" content={pageTitle} />
				<meta property="og:description" content={SITE_DESCRIPTION} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:type" content="website" />
				<meta name="twitter:card" content="summary" />
				<meta name="twitter:title" content={pageTitle} />
				<meta name="twitter:description" content={SITE_DESCRIPTION} />
			</Head>
			{markdownFiles.map((file) => (
				<BlogPostIndexSummary key={file.metaData.slug} file={file.metaData} />
			))}
			{pageCount > 1 && (
				<Pagination 
          currentPage={currentPageIndexNumber} 
					totalPages={pageCount} 
					//shape="rounded"
					onPageChange={handlePageChange}
					sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
				/>
			)}
		</>
	);
}

export default IndexPage;