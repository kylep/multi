FROM ubuntu:jammy

# Poetry is pinned because ubuntu:jammy is not PEP440 compliant, newer Poetry releases and Canonical
# disagree about it...

COPY RELEASE /

RUN apt-get update \
 && apt-get install -y \
      software-properties-common \
 && add-apt-repository -y ppa:deadsnakes/ppa \
 && apt-get update \
 && apt-get install -y \
      curl \
      wget \
      nginx \
      jq \
      vim \
      tmux \
      npm \
      python3.10 \
      python-is-python3 \
      python3-pip \
 && pip install \
      httpie \
      poetry==1.1.15 \
 && mkdir -p /root/.vim/autoload \
 && wget -o /root/.tmux.conf https://gist.githubusercontent.com/kylep/0a1b6db0c97fe34370f61d9c4064253d/raw/c9fc4abbbe69bb933b10418ef0ed20443136473f/tmux.conf \
 && curl -fLo /root/.vim/autoload/plug.vim --create-dirs https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim \
 && wget -o /root/.vimrc https://gist.githubusercontent.com/kylep/fbef9820d7a6315cfc955d8af41b2074/raw/348faa05c7187cfadd90b792ac91c23afa6d6e16/vimrc
