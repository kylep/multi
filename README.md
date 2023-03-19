# Kyle's projects

## Dev Env

### Prerequisites

- [Docker & Compose](https://docs.docker.com/get-docker/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- [pre-commit](https://pre-commit.com/)
- [PyEnv](https://github.com/pyenv/pyenv)
- [Poetry](https://python-poetry.org/)
- [Terraform](https://www.terraform.io/)
- [Helmfile](https://github.com/helmfile/helmfile)
- [Helm-diff](https://github.com/databus23/helm-diff)
- Vim & Tmux (optional, VSCode works too) as an IDE


### [Secrets](secrets/): Environment File(s)

The exports files set your local environment variables for local development and deployments.

Right now everything is in `export-kytrade.sh.SAMPLE`. Copy it, remove the `.SAMPLE` suffix,
and fill it in. Then set all your env vars by sourcing the file.

```
source secrets/export-kytrade.sh
```



### Setting up the precommit hooks

In the multi/ directory, run `pre-commit install`.

Now all commits and pushes will run the hook. This will:
- Run [Trufflehog](https://github.com/trufflesecurity/trufflehog) to check for committed secrets
- *TODO:* Run [Megalinter](https://megalinter.io/latest/)
- *TODO:* Choose then run some static code analysis tool


### Setting up Vim & Tmux
This part's optional, but its what I use for local dev.


#### Get the config files
```
# Configure TMUX
wget -o ~/.tmux.conf https://gist.githubusercontent.com/kylep/0a1b6db0c97fe34370f61d9c4064253d/raw/c9fc4abbbe69bb933b10418ef0ed20443136473f/tmux.conf

# Install Vim plugin manager vim-plug
curl -fLo ~/.vim/autoload/plug.vim --create-dirs https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

# Configure Vim
wget -o ~/.vimrc https://gist.githubusercontent.com/kylep/fbef9820d7a6315cfc955d8af41b2074/raw/348faa05c7187cfadd90b792ac91c23afa6d6e16/vimrc
```

To install the VIM plugins configured below, open vim and run `:PlugInstall`



### GitPods
*TODO* - I've got a custom GitPod image partially made that will take care of the above, wip


## [Infra](infra/)
Shared infrastructure used by my projects


## [Kytrade](kytrade/)
My personal trading tools and hobby project. This project is more about the proccess of building it
than the actual end result.

Installed to K8s with [helm](kytrade/helm/)


# [Blog](blog/)
Rewriting my blog to use React instead of Pelican templates
