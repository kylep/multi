import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class GitService {
    constructor() {
        if (GitService.instance) {
            return GitService.instance;
        }
        this.gitDataLoaded = false;
        this.init().then(() => { this.gitDataLoaded = true; });
        GitService.instance = this;
        return this;
    }

    async init() {
        // NOTE: This command uses single quotes which don't work properly on Windows
        // when run through bash/npm. The %cd format specifier gets interpreted as a
        // Windows cmd.exe variable instead of a git format string.
        // Use bin/docker-build-blog-files.sh on Windows to build in a Linux container.
        const gitCommand = "git log -1 --format='%H|%cd' --date=short -- ./";
        const { stdout } = await execAsync(gitCommand, { cwd: process.cwd() });
        [this.hash, this.date] = stdout.trim().split('|');
    }

    async waitForReady() {
        while (!this.gitDataLoaded) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

export async function getGitService() {
    if (!GitService.instance) {
        new GitService();
    }
    await GitService.instance.waitForReady();
    return GitService.instance;
}
