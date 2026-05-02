# Resum de canvis i millores — Memoralis (02/05/2026)

Aquest document detalla totes les modificacions realitzades al projecte avui, des del punt d'inflexió de les suggerències de millora d'UX i funcionalitat.

---

## 1. Millores de la Galeria i l'API

### Canvis realitzats:
- **Mode per defecte:** S'ha canviat el mode de càrrega inicial de la galeria de "Descoberta" a **"Galeria"** a `app/page.tsx`.
- **Ordenació d'obres:** L'API (`GET /api/artworks`) ara retorna les obres ordenades per `artDate` de forma **descendent** (les més recents primer).
- **Consistència visual:** S'ha fixat l'alçada de les targetes (`ArtworkCard.tsx`) per garantir que el grid sigui regular independentment del nombre d'etiquetes.

### Objectiu:
Millorar la predictibilitat de la interfície i assegurar que l'usuari vegi primer el contingut més nou.

### Com provar-ho:
1. Carrega la pàgina principal (`/`).
2. Verifica que el botó "Galeria" està seleccionat per defecte.
3. Comprova que les obres apareixen en ordre cronològic invers (més noves primer).

---

## 2. Formulari d'Edició i Validació

### Canvis realitzats:
- **Títol opcional:** S'ha eliminat la restricció `required` del camp de títol a `app/artwork/[id]/edit/page.tsx`.
- **Correcció de bug en cancel·lar:** S'ha corregit un error on la navegació o cancel·lació després d'un error de validació podia disparar una petició PATCH no desitjada.

### Objectiu:
Flexibilitzar l'entrada de dades (molts records de nens no tenen un títol clar) i evitar corrupció de dades en el flux d'edició.

### Com provar-ho:
1. Ves a editar una obra existent.
2. Esborra el títol i guarda. Hauria de permetre-ho sense problemes.
3. Entra a editar, provoca un error (si n'hi ha cap de validació) i després clica "Tornar" o cancel·la. Verifica que no s'ha guardat cap canvi parcial.

---

## 3. Sistema d'Etiquetes (Tag UX)

### Canvis realitzats:
- **Suggeriments intel·ligents:** Ara apareixen fins a 8 de les etiquetes més utilitzades com a píndoles clicables sota l'entrada de text (`TagInput.tsx`).
- **Interacció visual:** Les etiquetes seleccionades apareixen ressaltades. Es poden clicar per afegir o treure.

### Objectiu:
Accelerar l'etiquetatge d'obres noves i fomentar la consistència en l'ús de tags ja existents.

### Com provar-ho:
1. Ves a la pàgina de pujada o edició.
2. Verifica que apareixen etiquetes sota el camp "Etiquetes".
3. Clica'n una per afegir-la. Torna-la a clicar per treure-la.

---

## 4. Avatars d'Autora

### Canvis realitzats:
- **Model Author:** Creat el model a Prisma amb suport per a `avatarPath`.
- **Admin d'Autores:** Implementada la pujada d'avatars.
- **UI:** Substituïts els cercles amb inicials per la foto de la nena (si existeix) a les targetes i al detall.

### Objectiu:
Afegir una capa emocional i visualment rica al projecte, identificant clarament a qui pertany cada record.

### Com provar-ho:
1. Comprova que a la galeria i al detall apareixen els avatars (o inicials si no n'hi ha foto).

---

## 5. Lightbox de Detall

### Canvis realitzats:
- **Overlay a pantalla completa:** Clicar una imatge al detall obre un visualitzador gran.
- **Navegació:** Suport per a fletxes (UI i teclat) si l'obra té múltiples imatges.
- **Accessibilitat:** Tancament amb `Esc`, clic fora o botó ×.

### Objectiu:
Permetre l'apreciació dels detalls de les obres d'art sense distraccions.

### Com provar-ho:
1. Ves al detall d'una obra.
2. Clica sobre la imatge. Hauria d'obrir-se el Lightbox.
3. Prem `Esc` per tancar-lo.

---

## 6. Pujada Massiva (PDF i Àudio)

### Canvis realitzats:
- **Suport multi-format:** El `BatchUploadGrid` ara accepta fitxers PDF i d'àudio.
- **Processament:** Els PDFs es converteixen automàticament en imatges (una obra per cada fitxer PDF, que pot contenir múltiples pàgines).
- **UI:** Icones específiques per a PDF i Àudio en el grid de previsualització.

### Objectiu:
Simplificar el procés d'arxivar carpetes senceres de records que inclouen formats variats.

### Com provar-ho:
1. Ves a `/upload/batch`.
2. Selecciona un mix de fotos, un PDF i un fitxer MP3.
3. Verifica que es previsualitzen correctament amb les seves icones.

---

## 7. Neteja d'UI d'Esborrat i Mode Selecció

### Canvis realitzats:
- **Eliminació de la paperera a les cards:** Les targetes de la galeria ja no tenen icona d'esborrar individual per evitar soroll visual.
- **Nova icona al detall:** Botó "Esborrar" textual substituït per una icona `Trash2` (vermella) a la part superior dreta de la info.
- **Mode Selecció Múltiple:**
    - Botó "Seleccionar" a la barra de filtres.
    - Checkboxes a les cards (cantonada superior esquerra) en mode selecció.
    - Barra flotant inferior amb recompte i botó "Esborrar selecció".
    - Esborrat seqüencial segur.

### Objectiu:
Mantenir una estètica minimalista en la navegació diària però oferir eines potents per a la gestió massiva.

### Com provar-ho:
1. Ves a la galeria i verifica que no hi ha papereres a les fotos.
2. Clica "Seleccionar" als filtres. Selecciona 2 o 3 obres.
3. Hauria d'aparèixer la barra negra a sota. Clica "Esborrar selecció" i comprova el modal.
4. Ves al detall d'una obra i verifica la nova icona de paperera a dalt a la dreta.

---

## Resum d'Estat Final
Totes les funcionalitats de la Fase 3 s'han consolidat. El software és ara molt més robust en la gestió de formats (PDF/Àudio) i té una UX molt més fluida i estètica.
