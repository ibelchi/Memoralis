# Memoralis

**Memoralis** és una aplicació personal dissenyada per arxivar, organitzar i enriquir els records digitals de les creacions dels més petits de la casa. 

> [!IMPORTANT]
> **Estat del projecte:** Actualment el software es troba en fase **MVP (Producte Mínim Viable)**. És funcional per a ús personal, però pot contenir errors o faltar-li característiques avançades.

A diferència d'una galeria de fotos convencional, Memoralis se centra en l'**emoció del moment**: permet associar cada dibuix o manualitat amb un **àudio** on el mateix infant explica què ha creat, convertint una simple imatge en un record viu per al futur.

## ✨ Característiques principals

- **Arxiu Multimèdia:** Combina fotografies d'obres amb notes de veu.
- **Suport PDF:** Puja quaderns o llibres sencers en PDF i l'app els convertirà en una seqüència d'imatges automàticament.
- **Timeline Organitzat:** Visualitza les creacions per data original de creació.
- **Privacitat per Disseny:** Storage local i base de dades SQLite per a un control total de les dades.
- **Disseny Minimalista:** Interfície neta centrada en el contingut visual, amb estats buits il·lustrats.
- **Gestió d'Autores:** Personalitza la identitat visual de cada filla amb colors i avatars propis.
- **Configuració Flexible:** Defineix el mode de visualització per defecte i gestiona l'arxiu des d'un sol lloc.
- **Suport PWA:** Instal·la Memoralis al teu telèfon com una app nativa amb captura directa de càmera i micròfon.
- **Docker Ready:** Desplega l'app fàcilment amb Docker Compose per a ús personal en NAS o servidor domèstic.

## 🛠️ Stack Tecnològic

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router & TypeScript)
- **Base de dades:** [SQLite](https://www.sqlite.org/) via [Prisma 7](https://www.prisma.io/)
- **Estils:** [Tailwind CSS](https://tailwindcss.com/)
- **Storage:** Sistema de fitxers local per a una gestió senzilla i portable.

## 🚀 Començar

Primer, instal·la les dependències:

```bash
npm install
```

Configura el fitxer `.env` amb la ruta de la base de dades i el storage (pots usar `.env.example` com a base):

```env
DATABASE_URL="file:./dev.db"
MEDIA_PATH="./media"
```

Executa les migracions de Prisma:

```bash
npx prisma migrate dev
```

Finalment, arrenca el servidor de desenvolupament:

```bash
npm run dev
```

Obre [http://localhost:3000](http://localhost:3000) al teu navegador per veure el resultat.

### 🐳 Docker (Recomanat)

Si tens Docker instal·lat, pots arrencar l'aplicació amb una sola comanda:

```bash
docker compose up -d --build
```

L'aplicació estarà disponible a `http://localhost:3000`. Les dades i fitxers es persistiran a la carpeta `./data`.

## 🗺️ Roadmap

- [x] **Gestió de multimèdia avançada:** Suport per a múltiples imatges, eliminació individual de fitxers i millores en la reproducció d'àudio (seeking).
- [x] **Interfície de cerca i galeria:** Implementació de filtres avançats, indicadors d'àudio visuals i optimització de la visualització d'imatges sense retalls.
- [x] **Suport PDF:** Processament automàtic de fitxers PDF per a quaderns i llibres d'art.
- [x] **Exploració aleatòria:** Mode "Descoberta" per redescobrir records a l'atzar.
- [x] **Gestió d'autores i configuració:** Pantalla dedicada per a la gestió d'avatars, colors i preferències de l'aplicació.
- [x] **Exportació simplificada:** Implementada l'exportació en ZIP (DB + fitxers) des de Configuració.
- [ ] **Personalització de la quadrícula:** Permetre configurar la quantitat de columnes i el tamany de l'espaiat a la galeria principal.
- [x] **Dockerització:** Desplegament senzill amb Docker Compose.
- [x] **Suport PWA:** App instal·lable amb experiència mòbil nativa.


## 📝 Llicència

Aquest projecte està sota la llicència **MIT**. Consulta el fitxer [LICENSE](LICENSE) per a més detalls.

