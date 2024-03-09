import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import SiteLayout from '../components/SiteLayout';

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
		<div>
			<h1>Pages</h1>
			<ul>
				{markdownFiles.map(file => (
					<li key={file.slug}>
						<Link href={`/posts/${file.slug}`}>{file.title}</Link>
					</li>
				))}
			</ul>
		</div>
	</SiteLayout>
  );
}

export default IndexPage;

