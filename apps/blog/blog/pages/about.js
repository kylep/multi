import Head from 'next/head';
import { Box, Grid, Typography } from '@mui/material';
import SiteLayout  from '../components/SiteLayout';

const About = () => {
  return (
    <>
        <Head>
            <title>About</title>
        </Head>
        <SiteLayout  context={false}>
            <h1>About</h1>
            <img src = "/images/kyle-school-computers.png" alt="Me" className="me" />
            <hr />
            <pre><code>
                "Find a job you enjoy doing, and you will never have to work a day in your life." <br />
                - Mark Twain
            </code></pre>
            <hr />
            <h2>Social</h2>
            <Box sx={{ textAlign: "center", width: "100%", border: 0 }}>
                <Grid container spacing={2} justifyContent="left">
                    <Grid item>
                        <a href="https://www.linkedin.com/in/kpericak/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <img src="/images/LinkedIn.png" alt="LinkedIn" className="social-button" />
                            <Typography variant="body1">LinkedIn</Typography>
                        </a>
                    </Grid>
                    <Grid item>
                        <a href="https://github.com/kylep/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <img src="/images/GitHub.png" alt="GitHub" className="social-button" />
                            <Typography variant="body1">GitHub</Typography>
                        </a>
                    </Grid>
                    <Grid item>
                        <a href="https://twitter.com/kylepericak" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <img src="/images/Twitter.png" alt="Twitter" className="social-button" />
                            <Typography variant="body1">Twitter</Typography>
                        </a>
                    </Grid>
                    <Grid item>
                        <a href="https://www.reddit.com/user/kepper/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <img src="/images/Reddit.png" alt="Reddit" className="social-button" />
                            <Typography variant="body1">Reddit</Typography>
                        </a>
                    </Grid>
                </Grid>
            </Box>
            <hr />
            <h2>This here's my technology blog.</h2>
            It's intended to serve a few purposes:
            <ol>
                <li>Help other people solve problems I've ran into, particularly ones that were hard to google.</li>
                <li>Save my notes in an easy to reference format</li>
                <li>Showcase the cool stuff I've worked with</li>
                <li>Encourage me to keep learning new things</li>
            </ol>
            <hr />
            <h2>About the Author</h2>
            <p>
                My name's Kyle Pericak, and I'm a technological jack-of-all-trades working around the Toronto, Canada area. <br />
                I currently work as an Engineering Director at <a href="https://super.com">Super.com</a>, where I'm responsible for the DevOps, QA, Security, and Internal Tooling teams.<br />
                I'm most interested in leading in areas related to infrastructure, developer experience, security, and full stack web dev. <br />
                While I work in a purely public-cloud environment lately (mainly AWS), physical datacenters remain my <i>happy place</i>, and OpenStack maintains a place in my heart. <br /><br />
                Outside of work I'm a father to two boys, a husband, a bad musician, and when time allows I enjoy board games and strategy video games. <br />
                I listen to a lot of audiobooks and podcasts. <br /> <br />
                I love learning new things, meeting new people, and travelling.
            </p>
            <hr />
            <h2>Contact</h2>
            To contact me, use one of my social pages. Happy to chat about just about anything! LinkedIn will probably get you the fastest response.
            <br /><br /> <br /><br />

        </SiteLayout>
       
    </>
  );
};

export default About;