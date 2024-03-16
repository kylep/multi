import fs from 'fs';
import path from 'path';
import SiteLayout from '../components/SiteLayout';
import BlogPostIndexSummary from '../components/BlogPostIndexSummary';
import { Typography } from '@mui/material';

export async function getStaticProps() {
  const files = fs.readdirSync(path.join('markdown','posts'));
  const markdownFiles = files.map(filename => ({
    slug: filename.replace('.md', ''),
    title: filename.replace('.md', ''),
  }));
  return {props: {markdownFiles,},};
}

function IndexPage({ markdownFiles }) {
  return (
	<SiteLayout>
		{markdownFiles.map(file => (
			<BlogPostIndexSummary key={file.slug} file={file} />
		))}
	</SiteLayout>
  );
}

export default IndexPage;

