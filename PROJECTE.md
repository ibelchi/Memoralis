# Memoralis — Documentació del projecte

## Què és

Aplicació personal per arxivar, organitzar i enriquir records digitals de les creacions de dues filles petites (dibuixos, manualitats, fotografies). L'element diferencial és la combinació imatge + àudio emocional: cada obra pot tenir àudios gravats per les nenes explicant el que han creat.

Filosofia: KISS. Ús personal primer, open source en el futur.

---

## Stack tecnològic

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Estils | Tailwind CSS |
| Base de dades | SQLite via Prisma 7 |
| Storage | Sistema de fitxers local (`/media`) |
| Autenticació | NextAuth (configurat, no actiu al MVP) |
| Desplegament | Docker Compose (Fase 4) |

**Versió de Node i Next:** Next.js 14.2.35

---

## Estructura de carpetes

```
memoralis/
├── app/
│   ├── page.tsx                      # Galeria principal
│   ├── layout.tsx                    # Layout global
│   ├── artwork/[id]/page.tsx         # Detall d'una obra
│   ├── upload/page.tsx               # Formulari d'upload
│   └── api/
│       ├── artworks/route.ts         # GET llista, POST crea
│       ├── artworks/[id]/route.ts    # GET, DELETE per id
│       ├── upload/image/route.ts     # POST puja imatge
│       ├── upload/audio/route.ts     # POST puja àudio
│       ├── media/[...path]/route.ts  # Serveix fitxers de /media
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── ArtworkCard.tsx
│   ├── AudioPlayer.tsx
│   └── UploadForm.tsx
├── lib/
│   ├── prisma.ts                     # Singleton client Prisma
│   ├── storage.ts                    # Gestió fitxers locals
│   └── auth.ts                       # Configuració NextAuth
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── dev.db                            # Base de dades SQLite
├── prisma.config.ts                  # Configuració Prisma 7
├── media/                            # Fitxers multimèdia (fora de git)
│   ├── images/
│   └── audios/
├── .env                              # Variables d'entorn
└── .gitignore
```

---

## Model de dades

```prisma
model Artwork {
  id          String   @id @default(cuid())
  title       String
  description String?
  author      String        # Nom de la filla autora
  artDate     DateTime      # Quan es va crear l'obra (no quan s'arxiva)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  images      Image[]
  audios      Audio[]
  tags        Tag[]
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
  artwork     Artwork @relation(fields: [artworkId], references: [id], onDelete: Cascade)
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
```

---

## Variables d'entorn (.env)

```
DATABASE_URL="file:./dev.db"
MEDIA_PATH="./media"
```

---

## Decisions d'arquitectura

**IDs:** `cuid()` — URL-friendly, sense col·lisions, portable.

**Noms de fitxers:** Es genera un nom únic amb `crypto.randomUUID()` + extensió original. El nom original no es guarda (no és rellevant).

**Storage:** Els fitxers multimèdia viuen a `/media` fora del repositori. La variable `MEDIA_PATH` apunta al directori. Els fitxers es serveixen via `/api/media/[...path]`. Això facilita migrar a S3 en el futur canviant només `lib/storage.ts`.

**Autenticació:** NextAuth instal·lat i estructurat però no actiu. S'activarà a la Fase 4 quan l'app s'exposi a internet.

**Prisma 7:** La URL de connexió va a `prisma.config.ts` (a l'arrel), NO a `schema.prisma`. Si s'afegeix `url` al schema, Prisma dona error en la migració.

---

## API Routes

| Mètode | Ruta | Descripció |
|---|---|---|
| GET | `/api/artworks` | Llista totes les obres (amb imatges, àudios, tags) |
| POST | `/api/artworks` | Crea una obra nova |
| GET | `/api/artworks/[id]` | Detall d'una obra |
| DELETE | `/api/artworks/[id]` | Elimina una obra (cascade) |
| POST | `/api/upload/image` | Puja una imatge i la vincula a una obra |
| POST | `/api/upload/audio` | Puja un àudio i el vincula a una obra |
| GET | `/api/media/[...path]` | Serveix fitxers de la carpeta `/media` |

---

## Fases del projecte

**Fase 1 — Arquitectura** ✅ Completada
Stack, model de dades, estructura de carpetes, configuració de Prisma i SQLite.

**Fase 2 — MVP** (en curs)
Upload d'imatges i àudios, galeria bàsica, pàgina de detall, organització per data.

**Fase 3 — Millores funcionals**
Sistema d'etiquetes, filtres, cerca, edició d'obres, UX millorada.

**Fase 4 — Infraestructura**
Docker Compose, self-hosting, activació de NextAuth, gestió eficient del storage.

**Fase 5 — Open Source**
Documentació pública, guia d'instal·lació, neteja de codi.

---

## Workflow de desenvolupament

- **Google AI Pro (Gemini):** Generació de codi, implementació de funcionalitats.
- **Claude:** Planificació, decisions d'arquitectura, resolució de problemes complexos. Quan es consulta Claude, es recomana adjuntar aquest fitxer com a context en lloc de repetir l'historial de conversa.
- **Google Stitch:** Pendent d'integrar (previst Fase 3 per a UX/UI).

