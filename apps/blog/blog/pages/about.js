import Head from 'next/head';
import { PageShell } from '../components/PageShell';
import { Prose } from '../components/primitives/prose';
import { GlobalContextProvider } from '../utils/GlobalContext';
import { getMarkdownService } from '../utils/MarkdownService';
import { getGitService } from '../utils/GitService';

const SITE_URL = 'https://kyle.pericak.com';

export async function getStaticProps() {
	const markdownService = await getMarkdownService();
	const gitService = await getGitService();
	return {
		props: {
			categories: markdownService.categories,
			tags: markdownService.tags,
			lastGitCommitHash: gitService.hash,
			siteLastModified: gitService.date,
		},
	};
}

const SOCIALS = [
	{ href: 'https://www.linkedin.com/in/kpericak/', img: '/images/LinkedIn.png', label: 'LinkedIn' },
	{ href: 'https://github.com/kylep/', img: '/images/GitHub.png', label: 'GitHub' },
	{ href: 'https://twitter.com/kylepericak', img: '/images/Twitter.png', label: 'Twitter' },
	{ href: 'https://www.reddit.com/user/kepper/', img: '/images/Reddit.png', label: 'Reddit' },
	{ href: 'https://bsky.app/profile/pericak.bsky.social', img: '/images/Bluesky.png', label: 'Bluesky' },
];

const About = ({ categories, tags, lastGitCommitHash, siteLastModified }) => {
	const description =
		'About Kyle Pericak - Senior Engineering Director working in infrastructure, DevOps, security, and software engineering.';
	const canonicalUrl = `${SITE_URL}/about.html`;
	return (
		<GlobalContextProvider
			globalData={{ categories, tags, lastGitCommitHash, siteLastModified }}
		>
			<Head>
				<title>About - Kyle Pericak</title>
				<meta name="description" content={description} />
				<link rel="canonical" href={canonicalUrl} />
				<meta property="og:title" content="About - Kyle Pericak" />
				<meta property="og:description" content={description} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:type" content="website" />
				<meta name="twitter:card" content="summary" />
			</Head>
			<PageShell lastModified={siteLastModified} commitHash={lastGitCommitHash}>
				<Prose>
					<h1>About</h1>
					<img src="/images/kyle-school-computers.png" alt="Me" />
					<pre>
						<code>{`"Find a job you enjoy doing, and you will never have to work a day in your life."\n- Mark Twain`}</code>
					</pre>

					<h2>Social</h2>
				</Prose>

				<div className="my-4 flex flex-wrap gap-6">
					{SOCIALS.map((s) => (
						<a
							key={s.href}
							href={s.href}
							className="flex flex-col items-center gap-1 text-muted no-underline transition-colors hover:text-accent"
						>
							<img src={s.img} alt={s.label} width={44} height={44} />
							<span className="font-mono text-xs">{s.label}</span>
						</a>
					))}
				</div>

				<Prose>
					<h2>This here&apos;s my technology blog.</h2>
					<p>It&apos;s intended to serve a few purposes:</p>
					<ol>
						<li>Help other people solve problems I&apos;ve ran into, particularly ones that were hard to google.</li>
						<li>Save my notes in an easy to reference format</li>
						<li>Showcase the cool stuff I&apos;ve worked with</li>
						<li>Encourage me to keep learning new things</li>
					</ol>

					<h2>About</h2>
					<p>
						My name&apos;s Kyle Pericak, and I&apos;m a technological jack-of-all-trades working around the
						Toronto, Canada area.
					</p>
					<p>
						Today I work as a Senior Engineering Director - Infrastructure at{' '}
						<a href="https://super.com">Super.com</a>, where I&apos;m responsible for DevOps/Infra, QA,
						TAM/PSE, Security, and Sales/Support Tooling teams. I&apos;m most interested in leading areas
						related to infrastructure, developer experience/productivity, platform engineering, security,
						and full stack software engineering.
					</p>
					<p>
						While I work in a purely public-cloud environment lately (mainly AWS), I love working with
						physical infra and OpenStack + Ceph still hold a place in my heart.
					</p>
					<p>
						Outside of work I&apos;m a father to two boys, a husband, a bad musician, and when time allows
						I enjoy board games and running. I listen to a <em>lot</em> of audiobooks and always enjoy
						talking about them. I enjoy learning new things, meeting new people, conferences and
						travelling.
					</p>

					<h2>Contact</h2>
					<p>
						To contact me, use one of my social pages. Happy to chat about just about anything! LinkedIn
						will probably get you the fastest response.
					</p>
				</Prose>
			</PageShell>
		</GlobalContextProvider>
	);
};

export default About;
