# Docker Initialization Script for Memoralis (PowerShell version)
$ErrorActionPreference = "Stop"

function Write-Color {
    param([string]$Message, [string]$Color)
    Write-Host $Message -ForegroundColor $Color
}

Write-Color "Iniciant inicialitzacio de Docker per a Memoralis..." "Yellow"

# 1. Comprovar dependencies
$dockerFound = Get-Command docker -ErrorAction SilentlyContinue
if (!$dockerFound) {
    Write-Color "Error: La comanda 'docker' no s'ha trobat. Assegura't que Docker Desktop esta instal·lat i s'esta executant." "Red"
    exit 1
}

try {
    docker compose version | Out-Null
} catch {
    Write-Color "Error: 'docker compose' (v2) no esta disponible. Si utilitzes una versio antiga, instal·la el plugin Compose V2 o Docker Desktop actualitzat." "Red"
    exit 1
}

# 2. Crear carpetes de media
Write-Color "Creant carpetes de dades..." "Yellow"
$paths = @("./data/media/images", "./data/media/audios", "./data/media/pdfs")
foreach ($p in $paths) {
    if (!(Test-Path $p)) {
        New-Item -Path $p -ItemType Directory -Force | Out-Null
    }
}

# 3. Gestio de la Base de Dades
$dbPath = "./data/memoralis.db"
$oldDb = "./dev.db"

if (Test-Path $dbPath) {
    Write-Color "La base de dades $dbPath ja existeix. Saltant pas." "Yellow"
} elseif (Test-Path $oldDb) {
    Write-Color "S'ha trobat $oldDb. Copiant a $dbPath..." "Green"
    Copy-Item -Path $oldDb -Destination $dbPath
} else {
    Write-Color "No s'ha trobat cap BD existent. BD buida creada." "Yellow"
    New-Item -Path $dbPath -ItemType File | Out-Null
}

# 4. Docker Compose Build
Write-Color "Construint imatges de Docker..." "Yellow"
docker compose build

# 5. Executar migracions
Write-Color "Executant migracions de Prisma..." "Yellow"
docker compose run --rm memoralis npx prisma migrate deploy

Write-Host ""
Write-Color "SUCCESS: Llest! Executa: docker compose up -d" "Green"
