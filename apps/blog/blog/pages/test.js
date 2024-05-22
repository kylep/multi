import { getMarkdownService } from '../utils/MarkdownService';
import SiteLayout from '../components/SiteLayout';


export async function getStaticProps() {
	const markdownService = getMarkdownService();
	return { 
		props: { 
			markdownFiles: markdownService.markdownFiles, 
			categories: markdownService.categories,
		}, 
	};
}

function TestPage({categories}) {
    return <div>
        <SiteLayout>
            <h1>Hello</h1>
        </SiteLayout>
    </div>

}

export default TestPage;
