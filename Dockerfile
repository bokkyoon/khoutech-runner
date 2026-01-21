# Utiliser l'image officielle d'Ubuntu
FROM ubuntu:latest

# Définir un répertoire de travail
WORKDIR /workspace

# Installer Java 21, Git, Curl et autres outils nécessaires
RUN apt-get update && apt-get install -y \
    openjdk-21-jdk \
    git \
    curl \
    unzip \
    libxml2-utils \
    jq \
    ruby-full \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Définir l'environnement Java
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH
ENV MAVEN_VERSION=3.9.11

# Installer Maven 3.9.6
RUN curl -fsSL https://downloads.apache.org/maven/maven-3/3.9.12/binaries/apache-maven-3.9.12-bin.tar.gz | tar -xz -C /opt \
    && ln -s /opt/apache-maven-3.9.12 /opt/maven

# Définir les variables d'environnement pour Maven
ENV MAVEN_HOME=/opt/maven
ENV PATH=$MAVEN_HOME/bin:$PATH

# Vérification des versions installées (facultatif, pour debug)
RUN java -version && mvn -version

# Créer un répertoire pour Maven et y copier le fichier settings.xml
RUN mkdir -p /root/.m2
COPY ci/settings.xml /root/.m2/settings.xml

# Installer les gems nécessaires pour la documentation
RUN gem install asciidoctor -v 2.0.0 && \
    gem install asciidoctor-pdf --pre -v 1.5.0.alpha.5 && \
    gem install concurrent-ruby && \
    # Patch du bug Ruby 3+: File.exists? -> File.exist?
    find /var/lib/gems/ -type f -name interface.rb -exec sed -i 's/File\.exists?/File.exist?/g' {} \;

# Vérification des versions installées (facultatif, pour debug)
RUN ruby -v && gem -v && asciidoctor -v

# Installer Python3 et pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Créer un environnement virtuel
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV

# Ajouter l'environnement virtuel au PATH
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Installer des paquets Python dans le venv
RUN pip install --upgrade pip setuptools

# Installer Node.js et markdownlint-cli
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g markdownlint-cli

# Install of our tools
WORKDIR /usr/src/tools/checkProperties
COPY tools/checkProperties .
RUN npm install && npm link

WORKDIR /usr/src/tools/properties-documentation
COPY tools/properties-documentation .
RUN npm install && npm link

WORKDIR /usr/src/tools/release
COPY tools/release .
RUN npm install && npm link

WORKDIR /usr/src/tools/keepachangelog-linter
COPY tools/keepachangelog-linter .
RUN npm install && npm link

WORKDIR /usr/src/tools/changelog-cli
COPY tools/changelog-cli .
RUN npm install && npm link

WORKDIR /usr/src/tools/markdownlint
# Note: original file can be found here:
# /usr/lib/node_modules/markdownlint-cli/node_modules/markdownlint/schema/.markdownlint.jsonc
COPY tools/markdownlint/.markdownlint.jsonc .markdownlint.jsonc

RUN pip install yamllint

RUN checkProperties --help && \
  docgen --help && \
  asciidoctor-pdf -v && \
  log2release --help && \
  markdownlint --help

# Définir un répertoire de travail
WORKDIR /workspace

# Copier le script d'entrée
COPY ci/entrypoint.sh /usr/local/bin/entrypoint.sh

# Rendre le script exécutable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Commande par défaut pour lancer le container (ouvre un shell)
CMD ["bash"]
