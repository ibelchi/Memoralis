# Memoralis

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Self-Hosted](https://img.shields.io/badge/self--hosted-ready-blue)](https://github.com/ibelchi/memoralis)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)](https://www.docker.com)

> *Because drawings deserve to be heard, not just seen.*

Memoralis is an app for archiving your children's creations: drawings, crafts, photographs. What makes it different is that each artwork can carry a voice recording of the child explaining what they made. A memory in two dimensions: visual and sound.

Built for personal use, now shared in case it's useful to someone else.

---

![Memoralis — Main gallery](./public/images/screenshot.png)
*The main gallery with two modes: Discovery (random) and Gallery (chronological)*

---

## ✨ Features

- 🖼️ Archive drawings, photos, crafts and PDFs (automatically converted to images)
- 🎙️ Attach audio recordings to each artwork — the creator's own voice, explaining what they made
- 👧 Author profiles with avatar and color identifier
- ⭐ Mark favourites and browse artworks randomly
- 📅 "On this day X years ago" — a daily reminder of artworks created on the same date in previous years
- ✂️ Built-in image editor: rotate and crop without leaving the app
- 🔍 Search by text, filter by author, tags and date range
- 💾 One-click backup: a ZIP with your entire database and all media files
- 📱 Installable as a PWA on mobile

---

## 🚀 Quick Start

You need **Docker** and **Docker Compose**.

### 1. Clone the repository

```bash
git clone https://github.com/ibelchi/memoralis.git
cd memoralis
```

### 2. Copy and configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if you want to change any value (the defaults work out of the box).

### 3. Start with Docker Compose

```bash
docker compose up -d
```

### 4. Open the app

```
http://localhost:3000
```

The database is created automatically on first run. Images and audio files are stored in the `./media/` directory on your machine.

---

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Path to the SQLite database |
| `MEDIA_PATH` | `./media` | Directory where uploaded files are stored |

**Port:** The app runs on port `3000`. You can change it in `docker-compose.yml` (`3000:3000` → `8080:3000`, for example).

**Persisted volumes** (don't remove these or you'll lose your data):
- `./dev.db` — the database
- `./media/` — all images and audio files

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Vanilla CSS + Tailwind CSS |
| Database | SQLite via Prisma 7 |
| Storage | Local filesystem (`/media`) |
| PDF processing | `pdfjs-dist` + `canvas` |
| Deployment | Docker Compose |

---

## 🗺 Roadmap

### v1.1 (if the need arises)
- Voice search (Web Speech API)
- Selective export of a single artwork for sharing
- Configurable grid density
- Private context notes per artwork

### Phase 7 — Offline mobile capture (decision pending)
Capture artworks from a mobile phone without needing the server to be running, then sync when back home. Two options on the table: PWA with offline mode, or a standalone capture page installable as a separate PWA.

---

## 🤝 Contributing

Memoralis is an open personal project. If you've self-hosted it and want to add something, you're welcome.

There aren't many rules: open an issue explaining what you want to do, and if it makes sense for the project, go ahead. Small, focused PRs please.

The project is not trying to grow in every direction — KISS is intentional.

---

## 📄 License

[MIT](./LICENSE) © 2026 ibelchi

---

*Made with ☕ and nostalgia by [belchi](https://ibelchi.github.io)*
