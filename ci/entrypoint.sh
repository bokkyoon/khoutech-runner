#!/bin/sh

# Parcours les fichiers dans le répertoire courant
for file in ./*.jar; do
  if [ -f "$file" ]; then
    JAR_FILE="$file"
    break
  fi
done

# Vérifie si un fichier JAR a été trouvé
if [ -z "$JAR_FILE" ]; then
  echo "Erreur : Aucun fichier JAR trouvé dans $(pwd)."
  exit 1
fi

echo "Lancement de l'application : $JAR_FILE"

# Exécute le JAR
exec java ${JAVA_OPTS} -Djava.security.egd=file:/dev/./urandom -jar "$JAR_FILE" "$@"

