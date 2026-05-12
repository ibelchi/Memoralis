# Memoralis — Documentació del projecte

## Què és

Aplicació personal per arxivar, organitzar i enriquir records digitals de les creacions de dues filles petites (dibuixos, manualitats, fotografies). L'element diferencial és la combinació imatge + àudio emocional: cada obra pot tenir àudios gravats per les nenes explicant el que han creat.

Filosofia: KISS. Ús personal primer, open source en el futur.

---

## Stack tecnològic

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Estils | Vanilla CSS + Tailwind CSS |
| Base de dades | SQLite via Prisma 7 |
| Storage | Sistema de fitxers local (`/media`) |
| Processament PDF | `pdfjs-dist` (3.11) + `canvas` |
| Autenticació | NextAuth (configurat, no actiu al MVP) |
| Desplegament | Docker Compose (Fase 4) |

**Versió de Node i Next:** Next.js 14.2.35
**Configuració crítica:** `canvas` i `pdfjs-dist` a `experimental.serverComponentsExternalPackages`.

---

## Estructura de carpetes

```
memoralis/
├── app/
│   ├── page.tsx                      # Galeria principal
│   ├── layout.tsx                    # Layout global
│   ├── admin/tags/page.tsx           # Gestió d'etiquetes
│   ├── settings/page.tsx             # Pantalla de configuració (Autores, Dades, Galeria)
│   ├── artwork/[id]/page.tsx         # Detall d'una obra
│   ├── artwork/[id]/edit/page.tsx    # Edició d'obra
│   ├── upload/page.tsx               # Formulari d'upload
│   └── api/
│   ├── artworks/route.ts         # GET llista, POST crea
│       ├── artworks/on-this-day/route.ts # GET obres d'anys anteriors (avui fa X anys)
│       ├── artworks/[id]/route.ts    # GET, DELETE, PATCH per id
│       ├── images/[id]/route.ts      # DELETE imatge individual (BD + disc)
│       ├── audios/[id]/route.ts      # DELETE àudio individual (BD + disc)
│       ├── backup/route.ts           # GET genera ZIP de backup (DB + Media)
│       ├── upload/image/route.ts     # POST puja imatge
│       ├── upload/audio/route.ts     # POST puja àudio
│       ├── upload/pdf/route.ts       # POST puja PDF i el converteix a imatges
│       ├── authors/route.ts          # GET llista, POST crea autora
│       ├── authors/[name]/route.ts   # PATCH color o reanomenar autora (transaccional)
│       ├── authors/[name]/avatar/route.ts # POST puja/actualitza avatar
│       ├── media/[...path]/route.ts  # Serveix fitxers (amb suport HTTP Range)
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── ArtworkCard.tsx
│   ├── AudioPlayer.tsx
│   ├── BatchUploadGrid.tsx
│   ├── GalleryFilters.tsx
│   ├── ImageEditor.tsx               # Editor d'imatges (girar/retallar)
│   ├── TagInput.tsx
│   └── UploadForm.tsx
├── lib/
│   ├── prisma.ts                     # Singleton client Prisma
│   ├── storage.ts                    # Gestió fitxers locals
│   ├── pdf.ts                        # Utilitat per a convertir PDF a imatges
│   └── auth.ts                       # Configuració NextAuth
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── images/                       # Actius estàtics (favicon, empty-state, etc.)
│   ├── icons/                        # Icones PWA (192px, 512px)
│   ├── manifest.json                 # Manifest PWA
│   └── sw.js                         # Service Worker (Network-first)
├── scripts/                          # Scripts de manteniment (find/clean orphans)
├── dev.db                            # Base de dades SQLite
├── prisma.config.ts                  # Configuració Prisma 7
├── media/                            # Fitxers multimèdia (fora de git)
│   ├── images/
│   ├── audios/
│   └── pdfs/                         # PDFs originals conservats
├── .env                              # Variables d'entorn
└── .gitignore
```

---

## Model de dades

```prisma
model Artwork {
  id               String   @id @default(cuid())
  title            String?       # Opcional (si no hi ha títol, es mostra net)
  description      String?
  author           String        # Nom de la filla autora
  authorAvatarPath String?       # Avatar de l'autora en el moment de creació
  artDate          DateTime      # Quan es va crear l'obra (no quan s'arxiva)
  sourcePdf        String?       # Path al PDF original si l'obra en prové
  isFavorite       Boolean  @default(false)   # Marcat com a favorit
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  images           Image[]
  audios           Audio[]
  tags             Tag[]
}

model Image {
  id        String  @id @default(cuid())
  artworkId String
  artwork   Artwork @relation(fields: [artworkId], references: [id], onDelete: Cascade)
  filePath  String            # Path relatiu des de MEDIA_PATH (ex: "images/abc123.jpg")
  type      String @default("drawing")  # drawing | photo | craft
  order     Int    @default(0)
}

model Audio {
  id          String  @id @default(cuid())
  artworkId   String
  artwork   Artwork @relation(fields: [artworkId], references: [id], onDelete: Cascade)
  filePath    String
  durationSec Int?
  description String?
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  color    String    @default("#6366f1")
  artworks Artwork[]
}

model Author {
  id         String   @id @default(cuid())
  name       String   @unique
  color    String    @default("#6366f1")
  avatarPath String?
  createdAt  DateTime @default(now())
}
```

---

## Variables d'entorn (.env)

```
DATABASE_URL="file:./dev.db"
MEDIA_PATH="./media"
```

---

**Prisma 7 + Next.js 14 — configuració crítica (hard-won):**

- La URL de connexió va a `prisma.config.ts`, NO al `schema.prisma`.
- `DATABASE_URL` i `MEDIA_PATH` s'han d'exposar explícitament a l'objecte `env` 
  de `next.config.mjs` per estar disponibles en runtime.
- `better-sqlite3`, `canvas` i `pdfjs-dist` requereixen estar a `serverExternalPackages`.
  A Next.js 14 la clau correcta és `experimental.serverComponentsExternalPackages`.
- Per a `pdfjs-dist`, s'usa la versió `3.11.174` (legacy build) per evitar dependències de DOM a Node.js.
- L'adaptador s'inicialitza com a factoria amb URL, NO amb instància de DB.
- Usar rutes absolutes amb `path.join(process.cwd(), ...)` per al path del .db.
- Usar `require` per carregar els binaris natius de better-sqlite3.
- Per al build en Docker, s'ha configurat `next.config.mjs` per ignorar errors de linting i TypeScript, i s'han afegit variables d'entorn dummy al `Dockerfile` per permetre la compilació sense base de dades activa.
- **PWA Icons:** Si les icones (ex: `icon-192.png`) són realment JPEGs, cal declarar `type: "image/jpeg"` al manifest encara que l'extensió sigui `.png`, altrament els navegadors mòbils fallaran i mostraran una icona genèrica.
- **Prisma connectOrCreate i Tags:** No s'han d'enviar tags duplicats (ex: "Dibuix" i "dibuix") en una sola operació de creació, ja que Prisma fallarà amb un error de clau única. Cal de-duplicar i normalitzar en minúscules abans de fer la crida.
- **Sincronització d'Autores:** Per mantenir la taula `Author` al dia, el handler de `POST /api/artworks` ha de fer un `upsert` de l'autora. Això permet que les autores apareguin a la configuració automàticament sense trencar el flux de pujada.
- **Auto-upload UX:** Per a una experiència mòbil fluida, s'ha implementat pujada automàtica en seleccionar el fitxer (via `onChange`) tant a la pàgina d'upload com a la d'edició, eliminant botons innecessaris i mostrant estats clars ("Pujant...", "✓").
- **SQLite i Docker Volumes:** SQLite necessita permisos d'escriptura al directori on resideix la base de dades per crear fitxers de journal. Si es munta el fitxer `.db` directament en un volum sobre una carpeta de root (com `/app`), fallarà amb `attempt to write a readonly database`. La solució és muntar-lo en una subcarpeta dedicada (ex: `/app/data/memoralis.db`) que sigui propietat de l'usuari que corre l'app (`nextjs`).
- **Compatibilitat d'àudio a Android:** S'ha ampliat l'atribut `accept` dels inputs d'àudio i s'ha actualitzat la validació tant al client com al servidor per incloure formats típics de gravadores Android (com `audio/x-m4a` i `video/mp4` per a fitxers `.m4a`). La llista completa de tipus permesos ara inclou: `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/x-m4a`, `video/mp4`, `audio/wav`, `audio/wave`, `audio/x-wav`, `audio/ogg`, `audio/opus`, `audio/webm`, `audio/aac`, `audio/3gpp`, `audio/amr`.
- Si canvies alguna cosa al schema.prisma, executa `npx prisma generate`.

---

## API Routes

| Mètode | Ruta | Descripció |
|---|---|---|
| POST | `/api/artworks` | Crea una obra nova (amb tags) |
| GET | `/api/artworks/on-this-day` | Retorna les obres d'avui d'anys anteriors |
| GET | `/api/artworks/[id]` | Detall d'una obra |
| PATCH | `/api/artworks/[id]` | Actualitza una obra (tags, isFavorite, etc.) |
| DELETE | `/api/artworks/[id]` | Elimina una obra (cascade) |
| DELETE | `/api/images/[id]` | Elimina una imatge de la DB i del disc |
| DELETE | `/api/audios/[id]` | Elimina un àudio de la DB i del disc |
| POST | `/api/upload/image` | Puja una imatge i la vincula a una obra |
| POST | `/api/upload/audio` | Puja un àudio i el vincula a una obra |
| POST | `/api/upload/pdf` | Puja un PDF, el guarda i converteix pàgines a imatges |
| GET | `/api/media/[...path]` | Serveix fitxers (suporta HTTP Range per a seeking) |
| GET | `/api/tags` | Llista tots els tags amb recompte d'obres |
| POST | `/api/tags` | Crea un tag nou (upsert) |
| DELETE | `/api/tags/[id]` | Elimina un tag |
| GET | `/api/authors` | Llista totes les autores (id, name, color, avatarPath) |
| POST | `/api/authors` | Crea una autora nova |
| PATCH | `/api/authors/[name]` | Actualitza color o reanomena (afecta Artworks) |
| POST | `/api/authors/[name]/avatar` | Puja/actualitza la imatge d'avatar |
| GET | `/api/backup` | Genera i descarrega un ZIP amb la BD i la carpeta media |

---

## Manteniment i Utilitats

S'han creat scripts per a la gestió i neteja del sistema de fitxers, accessibles via `npx tsx`:

**Fase 5 — Tancament funcional** 🔄 En curs

### 5a — Visualitzador d'àudio ✅ Completada
Objectiu: tancament estètic de la pàgina de detall.
Estratègia: Web Audio API + canvas. Animació d'espectre de freqüències 
o ones sota el reproductor d'àudio. Color accent taronja al 40% d'opacitat.
Activable/desactivable amb botó discret al costat del reproductor.
Preferència persistida a localStorage amb clau `memoralis-audio-visualizer`.
Desactivat per defecte — l'usuari l'activa manualment.

### 5b — "Avui fa X anys" ✅ Completada
Objectiu: afegir una dimensió emocional i temporal a l'app.
Estratègia: Vista o widget que mostra obres creades exactament 1, 2, 3... 
anys enrere respecte al dia actual, basant-se en el camp `artDate`.
Accessible des de la galeria principal (pill amb color accent taronja).
Lògica: query filtrant per mes+dia de `artDate` ignorant l'any amb 
`strftime('%m-%d', artDate)`. Si no hi ha obres, la pill resta amagada.
Nova ruta: `app/on-this-day/page.tsx` i `app/api/artworks/on-this-day/route.ts`.

### 5c — Retallar i girar imatges ✅ Completada
Objectiu: poder editar imatges directament dins l'app sense eines externes.
Estratègia: component `ImageEditor.tsx` basat en canvas API natiu, 
sense dependències externes. Disponible a l'upload i a l'edició d'obres.
Funcionalitats: girar 90° esquerra/dreta i retallar amb handles arrossegables.
Funciona amb mouse (escriptori) i touch (Android/Chrome).
Ordre d'aplicació: primer gir, després retall. Output: JPEG qualitat 0.92.
*Millora mòbil*: S'ha convertit l'editor en un modal amb `max-h-[90vh]` i `overflow-y-auto` per evitar que els botons es tallin en pantalles petites.

### 5d — Revisió UX mòbil ✅ Completada
Objectiu: polir l'experiència en dispositius mòbils.
Canvis aplicats:
- "Afegir obra" → "Afegir" (mòbil i escriptori)
- Ordre capçalera: [Descoberta/Galeria] → [Afegir] → [⚙️]
- Botons "Seleccionar" i "Més filtres" sempre en fila horitzontal
- Botons "Editar" i "Paperera" a la barra superior, alineats amb 
  la targeta de contingut
- Ordre elements detall: Imatge → metadades → etiquetes → àudio → descripció
- Línia de metadades compacta: [★] [avatar] "Obra de X" [data]

### 5e — Avatar històric per obra ✅ Completada
Objectiu: preservar l'avatar de l'autora en el moment de creació de 
cada obra, de manera que els records mantinguin el seu context visual 
original quan l'avatar canviï en el futur.
Estratègia: camp `authorAvatarPath` (String?) afegit a la taula `Artwork`.
En crear una obra, es copia l'avatar actual de l'autora al camp.
Fallback: si `null`, es mostra l'avatar actual de l'autora (cobreix 
obres anteriors a la implementació).
Edició retroactiva d'avatars per obra: possible via la pàgina d'edició, 
pendent d'implementar si sorgeix la necessitat (v1.1).

### 5f — Refactor + Open Source ⏳ Pendent
Objectiu: que el codi sigui llegible i contribuïble per tercers.
Tasques:
- Extreure components pendents (ex: UploadForm en subcomponents)
- Netejar codi mort i comentaris de desenvolupament
- Afegir llicència MIT (`LICENSE`)
- Escriure `README.md` públic: què és, captures, instal·lació Docker, 
  configuració, contribució
- Revisar i consolidar `.gitignore`
- Versió 1.0.0 al `package.json`

**Fase 6 — Open Source Launch** ⏳ Pendent
Publicació del repositori a GitHub amb documentació completa.
Etiquetes: `self-hosted`, `family`, `memories`, `nextjs`, `sqlite`, `docker`.

**Fase 7 — Captura offline mòbil** ⏳ Pendent

Objectiu: poder registrar obres (foto, àudio, metadades) des del 
telèfon mòbil sense necessitat que el servidor estigui engegat. 
Quan l'usuari arriba a casa, obre Memoralis i prem "Sincronitzar" 
per pujar tot el que ha capturat.

Nota: dissenyat per a Android + Chrome. iOS no és un requisit.

### Opció A — PWA actual amb mode offline
Adaptar la PWA existent perquè funcioni sense servidor:
- Service Worker robust per fer l'app carregable offline.
- Formulari d'upload guarda a IndexedDB quan no hi ha servidor.
- Badge de "N obres pendents" visible a la galeria.
- Botó "Sincronitzar" que envia les obres en cua quan el 
  servidor és accessible.
- Possibilitat de Background Sync automàtic (Android/Chrome).
- Complexitat: mitjana. Risc: tocar el cor de l'app actual.

### Opció B — Pàgina de captura standalone (/capture)
Una pàgina estàtica servida des del mateix Docker de Memoralis, 
instal·lable com a PWA independent al telèfon:
- Funciona 100% offline sempre (fitxers estàtics, sense Next.js).
- Formulari simple: foto, àudio, títol, autora, tags.
- Dades guardades a IndexedDB del telèfon.
- Botó "Sincronitzar" que fa POST a Memoralis quan hi ha connexió.
- L'usuari té dues icones al mòbil: Memoralis i Memoralis Capture.
- Complexitat: baixa. Sense risc per a l'app actual.

### Decisió pendent
Ambdues opcions són viables. L'Opció B és més KISS i sense risc. 
L'Opció A és més integrada. Decidir quan s'arribi a aquesta fase.
ra standalone (/capture)
Una pàgina estàtica servida des del mateix Docker de Memoralis, 
instal·lable com a PWA independent al telèfon:
- Funciona 100% offline sempre (fitxers estàtics, sense Next.js).
- Formulari simple: foto, àudio, títol, autora, tags.
- Dades guardades a IndexedDB del telèfon.
- Botó "Sincronitzar" que fa POST a Memoralis quan hi ha connexió.
- L'usuari té dues icones al mòbil: Memoralis i Memoralis Capture.
- Complexitat: baixa. Sense risc per a l'app actual.

### Decisió pendent
Ambdues opcions són viables. L'Opció B és més KISS i sense risc. 
L'Opció A és més integrada. Decidir quan s'arribi a aquesta fase.

---

## Especificació UX — Galeria principal

Decisions de disseny preses i validades. Referència visual: disseny generat a Google Stitch (pantalla "Memoralis Gallery - Filters Desktop").

### Capçalera
- Nom de l'app i subtítol en una sola línia horitzontal, compacta
- Botó "+ Afegir obra" en píndola, color accent taronja (#D4752A), alineat a la dreta

### Filtres
- Les autores (Filtres clicables) són pills sempre visibles a la barra principal
- La cerca per text s'integra a la mateixa fila de filtres
- Els filtres secundaris (etiquetes, rang de dates, àudio) estan amagats per defecte darrere un botó "Més filtres" amb icona d'embut
- El panell de filtres secundaris s'obre/tanca en clicar el botó

### Grid de cards
- Masonry o auto-fill grid, mínim 200px per columna
- Les cards mostren: imatge (ratio 4:3), títol, autora (avatar amb inicial + color únic per filla), data en format **"Abril 2026"**.
- Indicador d'àudio: icona de micròfon blanca en un badge semi-transparent sobre la imatge (cantonada inferior dreta). Apareix si `hasAudio` és cert.
- Indicador de favorit: estrella a la card, clicable per marcar/desmarcar directament des de la galeria
- Tags com a pills de colors a la part inferior de la card

### Borrat d'obres

**Des de la pàgina de detall** (`artwork/[id]/page.tsx`):
- Icona de paperera (`Trash2` de lucide-react) a la part superior dreta de la info.
- Color vermell (`red-500`) amb hover destacat.
- Modal de confirmació abans d'executar.
- En confirmar: `DELETE /api/artworks/[id]`, redirecció a la galeria.

**Des de la galeria — mode selecció múltiple** (`app/page.tsx`):
- Botó "Seleccionar" a la barra de filtres (al costat de "Més filtres").
- En mode selecció: les cards mostren checkbox a la cantonada superior esquerra; el botó canvia a "Cancel·lar".
- Barra flotant inferior quan ≥1 card seleccionada: recompte ("N obra(es) seleccionada(es)") + botó "Esborrar selecció" (vermell).
- Modal de confirmació amb el nombre d'obres afectades.
- En confirmar: execució **seqüencial** de DELETE per cada id seleccionat, sortida del mode selecció, refresc de galeria.

### Dos modes de galeria (toggle a la capçalera o barra de filtres)

**Mode Descoberta** (per defecte en entrar):
- Selecció aleatòria d'obres, regenerada a cada visita
- Barreja favorits i no favorits (els favorits tenen lleuger avantatge de selecció)
- Sense ordenació cronològica visible

**Mode Galeria**:
- Totes les obres, ordenació cronològica descendent (més recent primer)
- Tots els filtres actius

### Estats buits i placeholders
- **Galeria buida:** Imatge `empty-state.png` a tota pantalla amb overlay `bg-white/60`. Missatge centralitzat i botó d'acció.
- **Card sense imatge:** Imatge `empty-state.png` com a fons subtil amb overlay `bg-white/70`. Sense text, comunicació visual pura.
- **Detall sense imatge:** Imatge `empty-state.png` amb overlay `bg-white/60` i botó "Afegir imatge" centrat.

### Decisions descartades
- **Mode fosc:** no s'implementa al MVP. Base en variables CSS preparada per si s'afegeix en el futur.
- **Carpetes / Col·leccions:** descartades. Les etiquetes + filtre per autora + filtre per data cobreixen completament la necessitat d'organització.

---

### Pàgina de detall (`artwork/[id]/page.tsx`)

**Disseny de la pàgina:**
- Centratge vertical de tot el contingut en el viewport (`min-h-screen`, `flex items-center`).
- Contingut dins d'una targeta central (`max-w-[900px]`) amb estètica coherent amb la galeria (vores `rounded-3xl`, ombrejat suau).
- Estructura interna de dues columnes: Imatge (esquerra) i Informació (dreta).
- Botó "Tornar" situat a la part superior esquerra de la pàgina, fora de la targeta, estil text minimalista.

**Interacció:**
- Títol de l'obra a 22px. L'estrella de favorit se situa just a la dreta del títol, alineada horitzontalment.
- La data segueix el format "Mes Any" (ex: Abril 2026).
- Àudios: Es mostra directament el reproductor customitzat amb suport per a desplaçament temporal (seeking).
- Imatges: Suport per a múltiples imatges en seqüència vertical. Les imatges es mostren sempre senceres (`object-contain`) i tenen una alçada màxima restringida al viewport (`max-h-[85vh]`).
- **Lightbox:** Clicar qualsevol imatge obre un overlay a pantalla completa amb navegació per fletxes i suport de teclat (`Esc`, fletxes).
- Gestió de fitxers: Possibilitat d'eliminar imatges i àudios individuals directament des de la pàgina d'edició.

**Flux de pujada (`upload/page.tsx`):**
- S'ha eliminat el camp de text per a la descripció de l'àudio. 
- El sistema assigna automàticament el títol de l'obra com a descripció de l'àudio internament per mantenir la traçabilitat a la base de dades sense carregar la UI.
- **Auto-upload:** La pujada de fitxers al Pas 2 és automàtica en seleccionar l'arxiu. S'amaguen els inputs natius i s'usen botons custom amb indicadors d'estat ("Pujant...", "✓").

---

## Pantalla de Configuració (/settings)

Accessible via icona de roda dentada (`Settings` de lucide-react) a la capçalera, a l'esquerra del botó "+ Afegir obra".

### Disseny (Layout)
- **Estructura de dues files** (Grid 1:1 en escriptori):
  - **Fila 1**: Autores (esquerra) i Etiquetes (dreta).
  - **Fila 2**: Dades (esquerra) i Galeria (dreta).
- **Mòbil**: Una sola columna, ordre Autores → Etiquetes → Dades → Galeria.

### Seccions
1. **Autores**: 
   - Llistat amb avatar circular (foto o inicial+color).
   - Edició de nom *inline* amb actualització transaccional de totes les seves obres.
   - Selector de color per a la identitat visual.
   - Pujada d'avatars amb previsualització immediata.
2. **Dades**: 
   - Estadístiques en temps real: total d'obres i data de l'obra més antiga.
   - **Exportar còpia**: Botó funcional que genera un ZIP descarregable amb tota la informació (DB i fitxers).
3. **Etiquetes**: 
   - Gestió *inline* completa: llistat amb recompte d'obres, eliminació i creació de tags nous.
4. **Galeria**: 
   - Selecció del mode per defecte en obrir l'app (**Descoberta** o **Galeria**).
   - Preferència guardada a `localStorage` amb la clau `memoralis-default-mode`.

### Gestió d'Avatars
- Ubicació: `/public/avatars/{nameSlug}.jpg`
- `nameSlug`: Nom de l'autora en minúscules, sense accents ni espais (ex: "martina", "pol").
- Formats: JPG, PNG, WEBP.
- Sistema de fallback automàtic a `AuthorAvatar.tsx`.

---

## Millores i idees futures

### Implementades
- **Favorits:** ✅ Implementat
- **Mode Descoberta / Aleatori:** ✅ Implementat
- **Cerca col·lapsable:** ✅ Implementat
- **Backup ZIP:** ✅ Implementat
- **Retallar imatges i girar-les:** ✅ Implementat (Fase 5c)
- **Visualitzador d'àudio:** ✅ Implementat (Fase 5a)
- **"Avui fa X anys":** ✅ Implementat (Fase 5b)
- **Revisió UX mòbil:** ✅ Implementat (Fase 5d)
- **Avatar històric per obra:** ✅ Implementat (Fase 5e)
- **Refactor + Open Source:** → Fase 5f

### Descartades (amb justificació)
- **Slideshow:** Descartada. Trenca la filosofia de contemplació pausada 
  de l'app. Memoralis és per viure una obra a la vegada.
- **Mode fosc:** No s'implementa al MVP. Base CSS preparada per si cal.
- **Carpetes/Col·leccions:** Descartada. Tags + filtre autora + dates 
  cobreixen la necessitat.

### Futures (v1.1 si sorgeix la necessitat)
- **Cerca per veu:** Web Speech API integrada al camp de cerca.
- **Export selectiu:** ZIP d'una obra concreta per compartir amb avis.
- **Notes privades de context:** Més protagonisme al camp `description`.
- **Avatar històric — edició retroactiva:** Canviar l'avatar associat 
  a obres concretes des de la pàgina d'edició.
- **Densitat de quadrícula configurable:** Slider per canviar columnes.

---

## Workflow de desenvolupament

- **Google AI Pro (Gemini):** Generació de codi, implementació de funcionalitats.
- **Claude:** Planificació, decisions d'arquitectura, resolució de problemes complexos. Quan es consulta Claude, es recomana adjuntar aquest fitxer com a context en lloc de repetir l'historial de conversa.
- **Google Stitch:** Disseny UX/UI. Connectat via MCP a Claude Code (Antigravity) per exportar dissenys directament al codi.

---

## Signatura / Crèdits

Afegit enllaç discret "belchi" just sota el títol "Memoralis" a la capçalera (layout.tsx o el component de capçalera corresponent).
Text: "belchi" · Mida: text-xs · Color: neutre/gris · Enllaç: https://ibelchi.github.io · Target: _blank

---

## Versions

| Versió | Estat | Contingut |
|---|---|---|
| 0.1 — 0.4 | ✅ Completada | Fases 1–4: Arquitectura, MVP, Millores, Infra |
| 1.0 | 🔄 En curs | Fase 5: Visualitzador, Avui fa X anys, Retallar/girar, UX mòbil, Avatar històric, Refactor |
| 1.0 launch | ⏳ Pendent | Fase 6: Publicació Open Source |
| 1.1 | ⏳ Pendent | Fase 7: Captura offline mòbil |
