# Memoralis

**Memoralis** és una aplicació personal dissenyada per arxivar, organitzar i enriquir els records digitals de les creacions dels més petits de la casa. 

> [!IMPORTANT]
> **Estat del projecte:** Actualment el software es troba en fase **MVP (Producte Mínim Viable)**. És funcional per a ús personal, però pot contenir errors o faltar-li característiques avançades.

A diferència d'una galeria de fotos convencional, Memoralis se centra en l'**emoció del moment**: permet associar cada dibuix o manualitat amb un **àudio** on el mateix infant explica què ha creat, convertint una simple imatge en un record viu per al futur.

## ✨ Característiques principals

- **Arxiu Multimèdia:** Combina fotografies d'obres amb notes de veu.
- **Timeline Organitzat:** Visualitza les creacions per data original de creació.
- **Privacitat per Disseny:** Storage local i base de dades SQLite per a un control total de les dades.
- **Disseny Minimalista:** Interfície neta centrada en el contingut visual.

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

## 🗺️ Roadmap

- [x] **Gestió de multimèdia avançada:** Suport per a múltiples imatges, eliminació individual de fitxers i millores en la reproducció d'àudio (seeking).
- [x] **Interfície de cerca i galeria:** Implementació de filtres avançats, indicadors d'àudio visuals i optimització de la visualització d'imatges sense retalls.
- [ ] **Exportació simplificada:** Implementar un sistema per exportar tot el contingut (imatges, àudios i metadades) de la manera més senzilla possible per garantir la portabilitat dels records.
- [ ] **Exploració aleatòria:** Botó per mostrar una o vàries obres d'art a l'atzar ("Inspira'm").
- [ ] **Personalització de la quadrícula:** Permetre configurar la quantitat de columnes i el tamany de l'espaiat a la galeria principal.
- [ ] Dockerització per a un desplegament més senzill.


## 📝 Llicència

Aquest projecte està sota la llicència **MIT**. Consulta el fitxer [LICENSE](LICENSE) per a més detalls.

