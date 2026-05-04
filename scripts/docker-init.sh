#!/bin/bash
set -e

# Colors ANSI
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funció per sortir amb error
fail() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

echo -e "${YELLOW}Iniciant inicialització de Docker per a Memoralis...${NC}"

# 1. Comprovar dependències
command -v docker &> /dev/null || fail "docker no està disponible al PATH."
docker compose version &> /dev/null || fail "docker compose no està disponible al PATH."

# 2. Crear carpetes de media
echo -e "${YELLOW}Creant carpetes de dades...${NC}"
mkdir -p ./data/media/images ./data/media/audios ./data/media/pdfs || fail "No s'han pogut crear les carpetes de dades."

# 3. Gestió de la Base de Dades
DB_PATH="./data/memoralis.db"
OLD_DB="./dev.db"

if [ -f "$DB_PATH" ]; then
    echo -e "${YELLOW}La base de dades $DB_PATH ja existeix.${NC}"
elif [ -f "$OLD_DB" ]; then
    echo -e "${GREEN}S'ha trobat $OLD_DB. Copiant a $DB_PATH...${NC}"
    cp "$OLD_DB" "$DB_PATH" || fail "Error en copiar la base de dades."
else
    echo -e "${YELLOW}No s'ha trobat cap BD existent. BD buida creada.${NC}"
    touch "$DB_PATH" || fail "No s'ha pogut crear el fitxer de la base de dades."
fi

# 4. Docker Compose Build
echo -e "${YELLOW}Construint imatges de Docker...${NC}"
docker compose build || fail "La construcció de les imatges ha fallat."

# 5. Executar migracions
echo -e "${YELLOW}Executant migracions de Prisma...${NC}"
docker compose run --rm memoralis npx prisma migrate deploy || fail "L'execució de les migracions ha fallat."

echo -e "\n${GREEN}✓ Llest! Executa: docker compose up -d${NC}"
