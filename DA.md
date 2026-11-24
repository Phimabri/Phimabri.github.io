# Direction artistique : « Malo's little world »

> Fichier vivant : il documente les choix visuels, l'ambiance et les règles à respecter
> pour que chaque nouvelle section reste cohérente. À mettre à jour à chaque évolution.

---

## 1. L'idée en une phrase

Un **petit monde en voxels (pixel art en 3D) qui flotte dans le ciel**. Chaque étape de ma
vie est une **île-diorama**. Le visiteur voyage d'île en île en scrollant, dans une
**montgolfière**, sous une lumière qui suit **l'heure réelle** (cycle jour/nuit).

**Mots-clés :** cocooning · relaxant · miniature · rétro (pixel) · moderne (motion, lumière, fluidité).

## 2. Inspirations

| Référence | Ce qu'on en garde |
|---|---|
| *Small plays – Basketball* (isométrique pixel) | le diorama isolé, les mini-personnages qui jouent → **terrain de foot ENSAE** avec joueurs animés |
| *Pond water effects* | l'eau pixel vivante : reflets, scintillements, ondes de pluie → **étang de Saclay, rivière d'Oxford** |
| *Hero section (Quietline)* | ciel bleu peint, serif blanc, petit véhicule qui relie la scène au message → **montgolfière** + titre serif |

## 3. Le rendu « pixel 3D »

- Le monde est fait de **voxels** (cubes de 1 unité), générés en code (pas de modèles importés).
- Le rendu 3D est fait **en basse résolution** (1 pixel écran = 2 à 4 pixels CSS) puis
  agrandi en `image-rendering: pixelated` → c'est le côté **pixel art**.
  Un bouton `PIXEL` permet de passer en rendu lisse (HD).
- **Occlusion ambiante par sommet** (style MagicaVoxel) : les coins sont légèrement assombris, ce qui donne du volume et un côté « maquette ».
- **Micro-variation de couleur** (±4 %) sur chaque voxel : pas d'aplats plats, une texture artisanale.
- Ombres douces d'une lumière directionnelle (soleil ou lune).
- Bloom léger, surtout la nuit (fenêtres, lampadaires, guirlandes).
- Grain très fin et vignettage en surcouche, plus un dithering (Bayer) qui évite le banding du ciel.

## 4. Cycle jour / nuit

L'heure du visiteur pilote toute la scène (`src/world/timeOfDay.js`). On peut la faire défiler
avec le curseur de l'horloge (en haut à droite) ; « Maintenant » revient à l'heure réelle.

| Moment | Heure | Ciel (haut → horizon) | Ambiance |
|---|---|---|---|
| Nuit | 22 h – 5 h | `#0b1430` → `#24335f` | étoiles pixel, lune, fenêtres chaudes, lucioles |
| Aube | ~6 h 30 | `#5a6aa0` → `#f4b195` | rose pêche, étoiles qui s'éteignent |
| Matin | ~8 h 30 | `#86bde9` → `#f6e6cf` | crème, frais |
| Midi | ~13 h | `#6cb0ec` → `#e2f1f6` | clair, ombres courtes |
| Golden hour | ~17 h 30 | `#7aa6d8` → `#fbdcb4` | doré, ombres longues |
| Coucher | ~19 h 15 | `#5a63a6` → `#f39d7c` | corail / lavande |
| Crépuscule | ~20 h 45 | `#26305f` → `#6d4f82` | violet, premières lumières |

L'interface suit aussi : cartes en « papier crème » le jour, en « verre nocturne » la nuit.

## 5. Palette

### Interface
| Rôle | Couleur |
|---|---|
| Papier (fond des cartes, jour) | `#FFF6E9` |
| Encre (texte) | `#2E2A3A` |
| Terracotta (accent principal) | `#E07A5F` |
| Sauge (accent secondaire) | `#81B29A` |
| Miel (distinction, badges) | `#F2CC8F` |
| Ardoise nuit | `#3D405B` |
| Verre nocturne | `rgba(20, 26, 52, .62)` |

### Monde (voxels)
| Matière | Couleurs |
|---|---|
| Herbe | `#86b86a` `#79ad5e` `#93c47a` |
| Terre | `#a8794f` `#916644` |
| Roche (strates) | `#8f857a` `#7a7166` `#665e56` |
| Pierre d'Oxford (miel) | `#e6c890` `#d6b277` |
| Plomb du dôme | `#7f8c96` |
| Eau | `#4fa3a8` → `#7cc8c2`, écume `#e8f6f2` |
| Bois | `#b07a4f` `#8a5a3b` |
| Fenêtre nuit | `#ffc979` (émissif) |
| Tuiles | `#c8664b` |

## 6. Typographie

| Usage | Police | Pourquoi |
|---|---|---|
| Titres | **Fraunces** (axe `SOFT` = 100, `opsz` max) | un serif doux et rond, chaleureux, un peu rétro |
| Étiquettes, horloge, chiffres | **Silkscreen** | la police pixel, petite dose de rétro |
| Texte courant | **Instrument Sans** | sobre et moderne, très lisible |

Règle : la police pixel n'est **jamais** utilisée pour un texte long, seulement en MAJUSCULES, en petit et avec un interlettrage large.

## 7. Mouvement

- **Tout est amorti** : la caméra suit le scroll avec un ressort (pas de mouvements secs).
- Scroll fluide (Lenis). La caméra **marque une pause** à chaque île (un plateau dans l'easing) pour laisser lire la carte.
- Les îles **flottent** (oscillation lente de 0,4 unité, déphasée). Au survol, une île se **soulève** et son nom s'affiche.
- Clic sur une île → on y voyage.
- Parallaxe légère à la souris.
- Apparition des cartes : les lettres du titre montent une à une avec un léger flou, l'étiquette pixel se tape comme à la machine.
- Chargement : compteur de voxels, puis **dissolution en pixels** de l'écran.
- `prefers-reduced-motion` : scroll natif, pas de flottement, transitions courtes.

## 8. Les îles (section Éducation)

| # | Île | Contenu du diorama | Détails à trouver |
|---|---|---|---|
| 0 | **Maison** (Clamart), hero | maison crème au toit de tuiles, volets sauge, cheminée qui fume | cage de foot et ballon, planche de surf contre le mur, pommier, lampadaire |
| 1 | **Université Paris-Saclay** (2019 – 2022) | bâtiment de fac moderne + tour vitrée, panneaux solaires | champs de blé du plateau, **étang avec canards qui nagent** |
| 2 | **ENSAE Paris** (2022 – 2026) | bâtiment à lames de bois | **terrain de foot avec mini-joueurs** (asso sportive), le Foyer et ses guirlandes (BDE) |
| 3 | **University of Oxford** (MSc 2025) | Radcliffe Camera, college gothique à flèches | rivière avec **punt**, pont de pierre, saule pleureur, **cascade qui tombe du bord de l'île** |

Entre les îles : une **montgolfière** rayée terracotta et crème (avec un petit moi dedans) fait le voyage.
Autour : nuages voxel qui dérivent, oiseaux le jour, lucioles la nuit.

## 9. Règles d'or

1. Chaque île doit avoir **au moins un élément animé** et **un détail caché**.
2. Pas plus de 3 couleurs dominantes par île, plus les neutres.
3. Les textes restent en HTML (accessibles, traduisibles) : la 3D est un décor, jamais le seul porteur d'information.
4. Bilingue FR / EN (`src/i18n.js`) : aucune chaîne en dur dans le HTML.
5. Le site doit rester fluide sur un portable moyen. Le rendu basse résolution aide, et rien n'est calculé hors écran.

## 10. Idées pour la suite

- [ ] Section **Expériences** : QRT (salle de marché voxel, écrans de courbes), CNRS/CREST, Société Générale.
- [ ] Chapitre **Projets** : un faux site de shopping en ligne où chaque Projet est en vitrine (à concevoir).
- [ ] Ambiance sonore générative (vent, oiseaux le jour, grillons la nuit), désactivée par défaut.
- [ ] Météo : pluie avec ondes sur l'eau (clin d'œil à *pond water effects*).
- [ ] Étoile filante cliquable la nuit (easter egg).
- [ ] **Profil** (remplace le Chapitre Contact) : avatar dans la barre de menus, carte avec e-mail, LinkedIn, GitHub, CV en PDF.

## 12. L'ordinateur, la « maison » du site (v2)

**Structure.** Le site est un **vieil ordinateur**. Depuis la v4 (§12.c), on arrive **sur le bureau** de l'ordinateur, qui sert de page d'accueil avec deux dossiers (le lien `#education` ouvre encore directement le monde des îles) :
- **Éducation** : on plonge dans l'écran et on retombe sur le monde des îles.
- **Expériences** : un sous-dossier qui liste les expériences. Chacune ouvrira son propre programme.

**Transitions** (déclenchées au clic, pas au scroll) :
- *Éducation → bureau* (menu « Expériences », rail, bouton de fin de dossier) : la caméra sort de l'écran et découvre la chambre. La fenêtre Éducation (les îles, toujours vivantes) **rapetisse jusqu'à son icône de dossier**, puis on s'approche du bureau et malOS apparaît, avec le dossier Expériences qui s'ouvre. Durée ≈ 3,7 s.
- *Bureau → Éducation* (icône Éducation, menu « Parcours ») : la fenêtre **regrandit depuis son dossier** et la caméra replonge dans l'écran jusqu'au plein écran. Le passage au rendu direct est invisible (projection *cover-fit* 4:3). Durée ≈ 2,3 s.

**Le monde réel n'est plus en pixels.** *(Depuis la v4, la chambre est une illustration sérigraphiée, voir §12.d ; les paragraphes ci-dessous décrivent la chambre 3D d'avant.)* Dehors, tout est en formes douces : plastique crème arrondi, bois, céramique, lumière chaude. Le voxel/pixel reste réservé au monde *dans* l'écran. L'ambiance de la chambre : **tard le soir, on code avec une tasse de thé et du lofi**.
- Écran CRT crème aux angles très arrondis, bombé, cerclé de sombre, avec grille de haut-parleur, nom « malo » gravé, LED verte et pied pivotant ; clavier aux touches arrondies.
- Mug de thé vert sauge avec son fil, son étiquette « thé » et sa vapeur ; casque audio, cassette « late night mix », livres, plante.
- Lampe articulée (lumière principale, ombres douces), guirlande lumineuse, étagère (trophée de foot, globe), tableau d'une vague.
- Fenêtre de nuit : lune, étoiles, îles lointaines aux fenêtres allumées, pluie qui coule. Rideau.
- Chat roux qui dort (il respire). Post-it « Projets, bientôt » écrit à la main (Caveat).
- Lumières : spot de la lampe, RectAreaLight pour la lueur de l'écran, clair de lune, appoint chaud côté spectateur.

**malOS, le bureau nostalgique.**
- Fond d'écran peint (nuit violette, lune, nuages roses, collines, petites îles et une maison éclairée). Il est peint une seule fois sur un canvas, puis sert à la fois de texture 3D et de fond HTML, donc les deux correspondent parfaitement.
- Barre de menus translucide sombre ; horloge et indicateur « ♪ lofi.fm » en IBM Plex Mono.
- Icônes douces façon années 2000 (sans pixels) : dossiers miel et terracotta avec pastille, cassette, post-it, `</>`.
- Fenêtres crème givrées, coins 12 px, grande ombre douce, bouton de fermeture rond terracotta, chemin `~/malo/experience` en mono.
- Widget **lofi.fm** : vraie petite radio générative en WebAudio (pluie, craquements de vinyle, accords jazzy Fmaj7–Em7–Dm9–Cmaj7 à 72 bpm, beat paresseux). Les bobines tournent et l'égaliseur danse. Coupée par défaut.
- **Terminal** qui tape lentement (`brew install earl-grey`, `python train.py`, `lofi --play pluie`).
- Polices : Fraunces pour les titres, Instrument Sans pour l'interface, IBM Plex Mono pour le technique, Caveat pour le manuscrit.

**Règle de DA dans les programmes** (étapes suivantes) : chaque programme d'expérience a **sa propre DA**.

| Programme | DA |
|---|---|
| QRT.app | phosphore ambre, lignes vectorielles lumineuses |
| Oxford.dna | risographie 2 couleurs, grain |
| CREST.nb | carnet quadrillé, tracés à l'encre |
| SocGen.chat | doux, « clay », moderne |

### 12.b La chambre v3 : qualité « photo produit » (2026-11-21)

*Remplacée le 2026-11-23 par la chambre illustrée (§12.d) ; l'ancien `src/world/room.js` a été supprimé.*

*Retour : « la chambre et l'ordi font 3D de basse qualité ». Le concept est gardé (la chambre, le bureau, l'ordi) ; c'est le rendu qui a été refait.*

- **Diagnostic de la v2** : éclairage plat et uniforme, pas d'occlusion ambiante donc des objets « posés » sans ombre de contact, matières toutes mates sans reflets, et des accessoires illisibles (le chat orange ressemblait à une boule, le casque à un haltère, le rideau à un tuyau).
- **Rendu** : la chambre a sa propre chaîne de post-traitement.
  - Occlusion ambiante GTAO (au tiers de la résolution), puis bloom sur les sources de lumière (ampoules, guirlande, bougie, LED).
  - Passe finale : tone mapping Neutral + sRGB, étalonnage cosy (hautes lumières chaudes, ombres prune relevées), vignette et grain fin.
  - **L'écran est exclu de la passe finale** : il écrit alpha = 0 (mémorisé avant l'AO et le bloom) et garde ses couleurs brutes, donc l'image des îles reste identique au passage dans le moniteur. L'intensité du post tend vers 0 quand l'écran remplit la vue.
- **Reflets** : environnement PMREM (`RoomEnvironment`) à très faible intensité (0,16), juste assez pour des reflets doux sur le plastique, la céramique et l'émail.
- **Lumière de nuit** : ambiance basse (hémisphère 0,38), une flaque chaude de la lampe (spot avec ombres douces), la lueur froide de l'écran (RectAreaLight), la lune par la fenêtre (avec l'ombre des croisillons) et une bougie qui vacille sur le rebord. Les ombres de la chambre ne sont calculées qu'une fois, car rien ne bouge.
- **Modèles refaits** :
  - *L'ordinateur* :
    - cadre d'écran extrudé avec un vrai chanfrein vers la dalle, qui est en retrait ;
    - plastique physique (vernis léger et rugosité mouchetée pour éviter le « plastique CG ») ;
    - fentes d'aération, grille de haut-parleur, plaque « malo », fente de disquette, LED ;
    - pied tourné ;
    - clavier aux touches décalées comme un vrai clavier (modificateurs plus foncés, Échap corail, Entrée sable), câble spiralé ;
    - souris en forme d'œuf.
  - *Bureau* : plateau épais en noyer procédural (planches, veinage, carte de rugosité) et tapis de bureau en feutre.
  - *Lampe d'architecte* en émail vert : bras doubles, articulations en acier, ressort, abat-jour tourné avec un intérieur éclairé.
  - *Plantes* : de vraies feuilles (forme pliée sur la nervure, extrémité arquée) au lieu de sphères. Un pothos retombe de l'étagère, une succulente est posée sur la pile de livres.
  - *Fenêtre* : embrasure en profondeur, cadre peint arrondi, rebord profond, **rideaux en lin avec de vrais plis** sur une tringle, et à travers la vitre une nuit avec la lune, les îles au loin et les lumières de la ville floues. Les gouttes de pluie réfractent la vue.
  - *Le reste* : mug tourné émaillé sur un dessous de verre en liège, carnet ouvert (notes manuscrites) avec un crayon, cassette « late night mix », affiche encadrée avec passe-partout, globe sur son pied, guirlande lumineuse. Tout est instancié : 2 appels de dessin au lieu de 76.
  - *Le chat* dort roulé en boule **sur le rebord de la fenêtre**, avec les oreilles et la queue enroulée.

### 12.c Arrivée sur le bureau et dossiers guidés (2026-11-23)

*Retour : « en arrivant directement dans les îles, on ne comprend pas dans quelle partie on se trouve ».*

- **Arrivée** : après le chargement, un **plan large de la chambre** (0,9 s), puis la caméra s'approche de l'écran (2,7 s) et malOS apparaît. Un clic ou une touche pendant ce plan saute directement au bureau. Avec `prefers-reduced-motion`, on arrive tout de suite sur le bureau.
- **bienvenue.txt** : une fenêtre crème ouverte à gauche qui dit qui je suis (« Bonjour, moi c'est », *Malo Evain* en Fraunces 46 px, une phrase), puis « Pour commencer, ouvrez un dossier : » et deux grandes lignes cliquables, Éducation et Expériences, avec leur icône et une courte description. Ses éléments apparaissent un à un à la fin de l'intro.
- **Les deux dossiers de chapitre** sont grands (124 × 104) et placés au centre du bureau. Les utilitaires (lofi.fm, notes.txt, GitHub) restent en petit dans la colonne de droite.
  - Dessin : panneau arrière avec son onglet, deux feuilles qui dépassent avec un **aperçu du contenu** (une mini île flottante et la montgolfière pour Éducation, un graphique ambre sur fond sombre pour Expériences), rabat avant bombé avec un reflet et une pastille crème (toque, mallette). Miel pour Éducation, terracotta pour Expériences.
  - Au survol, le dossier **s'entrouvre** : les feuilles montent et le rabat bascule vers l'avant.
  - Les identifiants de dégradé SVG sont préfixés par icône : avant, les deux dossiers partageaient le même et Expériences s'affichait en miel.
- **Guidage léger**, tant qu'aucun dossier n'a été ouvert : un halo chaud qui respire derrière chaque dossier, les feuilles qui sortent un peu de temps en temps, et une note manuscrite (Caveat, miel) avec une flèche : « commencez par là ! ». Tout s'arrête dès le premier clic sur un dossier.
- **Navigation** : un lien **Bureau** s'ajoute en tête du menu (le logo y mène aussi) et rouvre bienvenue.txt. L'onglet actif suit l'endroit où l'on est : Bureau, Éducation, ou Expériences (fenêtre ou programme ouvert).
- **Mobile** : pas de grands dossiers ni de note. C'est la fenêtre bienvenue.txt, en haut de l'écran, qui sert de point d'entrée.
- La texture 3D de l'écran reprend la même disposition (carte d'accueil, grands dossiers), donc le passage de la 3D au HTML reste invisible.

### 12.d La chambre v4 : une illustration sérigraphiée (2026-11-23)

*Retour : « l'effet 3D rend tous les objets ronds et de mauvaise qualité ». On garde la chambre chill de nuit, mais en illustration plate, d'après deux références : un vieux PC beige dans une chambre couverte d'affiches, et une illustration rétro (aplats, encre, trame, papier).*

**Style.**
- Aplats de couleur, **contours à l'encre** `#17131b` (3 px pour les silhouettes, 1,6 px pour les détails), **ombres en trame de points** à 45° et reflets en traits blancs.
- Un **grain de papier** constant par-dessus, à taille fixe quel que soit le zoom, comme une impression. *(Retiré en v5, voir §12.e.)*
- Polices : **Anton** pour les titres d'affiches, Fraunces, IBM Plex Mono et Caveat pour le reste.

**Palette de nuit.**

| Rôle | Couleurs |
|---|---|
| Mur sarcelle | `#24443f`, plus sombre en haut `#1a322f`, rayures très légères |
| Ordinateur | beige `#e2d2b1`, crème `#efe5cc`, ombre `#c3ae87` |
| Bureau | noyer `#764b31` |
| Accents | rouge `#c8432b`, moutarde `#e7b04a`, sarcelle `#2c6662` |

**Lumière.** Une couche « multiply » assombrit les bords en violet nuit. Une couche « screen » ajoute :
- le cône et la flaque chaude de la lampe ;
- la lueur lavande de l'écran ;
- le clair de lune de la fenêtre ;
- la bougie ;
- les halos de la guirlande.

L'écran est découpé dans ces deux couches pour que ses couleurs restent brutes.

**Les passions, cachées dans la pièce.**
- *Musique* : trois pochettes sur une étagère au-dessus de l'ordi (*Grace*, Jeff Buckley ; *In Rainbows*, Radiohead ; *Is This It*, The Strokes), un vinyle qui dépasse, un billet de concert des Strokes, une **platine qui joue lofi.fm** (un clic dessus lance ou coupe la radio : le disque tourne et le bras se pose), un walkman rouge et un casque.
  - Les visuels sont des **compositions originales** qui évoquent les œuvres (micro, arcs de couleur, typo), pas des copies des vraies pochettes.
- *Cinéma* : affiches de *Apocalypse Now* (soleil orange, hélicoptères, palmiers) et de *Paris, Texas* (ciel vert-rouge, route vide, l'homme à la casquette rouge). Là aussi, ce sont des compositions originales.
- *Surf* : planche crème à bande rouge contre le mur, fenêtre qui donne **sur la mer la nuit** (reflet de lune, vagues qui défilent, un petit surfeur), polaroïd « la vague », magazine *SWELL*, post-it « surf 7h ».
- *Foot* : ballon et trophée sur une petite étagère, écharpe « ALLEZ » sur la tringle, polaroïd « le match », magazine *MATCH*, post-it « foot 21h ».
- *Cosy* : tasse de thé (avec son étiquette « thé ») et sa vapeur, lampe d'architecte rouge, guirlande, rideau en lin, plante, ordinateur « MALO SYSTEMS ME-1994 ».

**Animations** (CSS, coupées avec `prefers-reduced-motion`) : vapeur, étoiles qui scintillent, vagues, reflet de lune, guirlande, flamme, LED de l'ordinateur, vinyle et bras de la platine.

**Technique.**
- Trois calques SVG (`src/room/art.js`) dans `#room`, au-dessus du canvas :
  - le **mur**, qui bouge le plus avec la souris (parallaxe) ;
  - le **bureau** ;
  - la **lumière**.
- La « caméra » est une **vue 2D** (centre + échelle, échelle interpolée en log) entre trois cadrages : plan large, bureau, écran plein. `src/room/room2d.js` place les calques.
- La vitre du moniteur est un **trou** dans le dessin. Le WebGL y dessine un quad avec le shader d'écran (fond malOS, fenêtre Éducation qui rapetisse dans son dossier, effet CRT). Les transitions restent identiques.
- Le mur a un trou plus large (+30) que le cadre de l'écran cache, pour absorber la parallaxe.
- La chambre est masquée dès que l'écran couvre toute la fenêtre (monde des îles, programmes).
- **Fluidité des zooms** : redessiner le SVG à chaque image (trames, masques, lumières en mode de fusion) faisait ramer. Chaque calque est donc aussi **pré-rendu en bitmap** pendant le chargement :
  - polices incluses en data-URI, puisqu'un SVG dessiné comme image ne charge rien ;
  - 2 px par unité, ou 0,5 pour les lumières, qui ne sont que des dégradés.

  Pendant les mouvements, la carte graphique ne fait que mettre ces images à l'échelle. Une fois posé sur le bureau, on revient au SVG vivant, net et animé, promu en calque pour que la parallaxe ne déplace que des pixels. Les calques cachés le sont par opacité, jamais par `display: none` : leurs textures restent sur la carte graphique.
- **Pas de `backdrop-filter` dans malOS** : par-dessus les calques de la chambre, ce flou bloquait la carte graphique jusqu'à 1 s à chaque apparition du bureau. Des fonds presque opaques donnent le même rendu.
  - Mesuré sur M1 : intro à 8 ms par image (contre 17 ms en SVG vivant) ; retour au bureau à 10 ms de médiane (contre 33 ms, avec une pause d'1 s).
- **Sur l'ordinateur, la barre du haut n'est plus en verre flouté** : fond nuit presque opaque `rgba(22,19,34,.84)` et encres de nuit, même en journée, puisque la chambre est toujours de nuit. Les cartes et le rail des îles sont en `visibility: hidden` une fois leur fondu fini. Le verre flouté revient dans le monde des îles.
- Debug : `__roomView = { cx, cy, s }` fige la vue sur les bitmaps (`null` pour relâcher).

### 12.e La chambre v5 : trait fin et volumes (2026-11-23)

*Retour : « des traits beaucoup plus fins », en s'inspirant des deux photos de référence. Le filtre granuleux n'est plus obligatoire.*

- **Trait** : contours à **1,2** (au lieu de 3) et détails à **0,6** (au lieu de 1,6), encre `#1e1922`.
  - La vue du bureau est zoomée d'environ 2,7, donc à l'écran on passe d'environ 8 px à environ 3 px.
  - Les gros aplats tramés disparaissent. La trame fine (4,5 px, points de 0,85) ne sert plus qu'à donner une texture d'impression aux affiches.
- **Volumes**, avec une petite bibliothèque de dégradés générée en code :
  - éclairage vertical ou latéral (la lampe est à gauche) ;
  - **cylindres** (tasse, pot, bougie, gobelet, contrepoids) ;
  - **sphères** (ballon, boutons, pied de lampe, punaises) ;
  - **métal brossé** (plateau de la platine).
- **Ombres de contact douces** : des ellipses qui s'estompent sous chaque objet, et des ombres portées en deux couches (pénombre) derrière les papiers et l'ordinateur.
- **Détails ajoutés** :
  - *Clavier* : touches en deux tons (dessus et flanc) avec leurs **lettres**, Échap rouge, Entrée moutarde, voyants verts, câble spiralé.
  - *Ordinateur* : bezel en gradins, fentes d'aération sur le dessus et le côté, pieds du moniteur, plaque « MALO SYSTEMS » avec son logo, « ME-1994 · 640K », lecteurs avec fente, bouton d'éjection et voyant, interrupteur, câbles qui partent derrière.
  - *Bureau* : pile de disquettes (« SURF.EXE »), pot à crayons, nœuds du bois.
  - *Platine* : sillons plus marqués entre les morceaux, points stroboscopiques, contrepoids, boutons 33/45, curseur de pitch.
  - *Lampe* : bras doubles, ressorts accrochés le long des bras, articulations vissées, aérations de l'abat-jour.
  - *Affiches* : bord blanc d'impression, bandes de couchant, palmiers à vraies palmes, hélicoptères détaillés ; route en perspective et poteaux avec leurs fils pour *Paris, Texas* ; générique en petites lettres.
  - *Pochettes* : micro à grille, coulures de couleur, usure en anneau.
  - *Fenêtre* : nuages fins, lune à cratères, **phare dont le faisceau balaie la mer**, scintillement de lune en perspective, rangées de vagues dont l'épaisseur grandit vers le bas, **coquillage** sur le rebord.
  - *Le reste* : rideau en lin aux plis dégradés, anneaux de tringle, maille de l'écharpe, planche de surf en volume avec son logo.
- **Plus de grain** au-dessus de la chambre : ni la texture papier, ni le grain global de la page sur l'ordinateur. Les traits fins restent nets.
- **Technique** :
  - `dedupe()` garde un seul attribut de chaque nom par balise : un SVG rasterisé en image doit être du XML strict.
  - Mur entier rasterisé : 48 ms à 1×, 234 ms à l'échelle d'un Retina. Au repos, seule la zone visible est redessinée, une fois.
  - Debug : `__roomView = { cx, cy, s, live: true }` inspecte le SVG net.

**Performance (règles à garder).**
- Jamais de `mask` sur un grand calque de la chambre. Avec un masque, la moindre animation fait redessiner tout le calque, et la page tombait à 1 image/s en plein écran Retina. Le trou de l'écran est découpé par un `clipPath` (`clip-rule="evenodd"`).
- Les calques de lumière (multiply et screen) ne sont **que des bitmaps**, jamais du SVG vivant. Ce sont des dégradés doux, donc la basse résolution ne se voit pas. Contrepartie : la lueur de la bougie ne vacille plus, mais la flamme bouge toujours.
- Les cadres de l'écran sont **concentriques** autour de la vitre (r 18) : creux r 28 à 10 unités, biseau r 38 à 20 unités.

## 13. QRT.app : phosphore ambre (programme n°1)

- **Ouverture en plein écran (v2)** : clic sur la ligne QRT.app → le programme **grandit depuis sa ligne** (animation FLIP) pendant que **la caméra plonge dans l'écran**, comme pour Éducation. Le programme occupe toute la fenêtre du navigateur (sous la barre du haut), on voit le fond d'écran malOS sur les bords. « ← Retour au bureau », la pastille rouge ou Échap font ressortir la caméra. Contenu en **terminal de recherche à phosphore ambre** (`#ffb347` sur `#120b05`, lueur par `text-shadow`, lignes de balayage très légères et vignettage).
- **Le résumé du CV mis en avant** : la phrase de chaque module passe en titre au-dessus du graphique, en Fraunces 19–27 px crème doré, avec les **mots-clés surlignés en ambre** (balises `[[…]]` dans les textes FR/EN).
- **Structure** : barre d'état (● QRT·RESEARCH, session 2025-10 → 2026-04, **compteur qui monte jusqu'à 1 500 000 000+ points de données**), colonne gauche (boot tapé, rôle en Fraunces, entreprise, dates, **4 modules**, mention « données synthétiques »), écran principal (commande tapée façon terminal, graphique, phrase du CV), ruban défilant en bas.
- **4 modules = les 4 lignes du CV**, chacun avec un graphique vivant (canvas, lignes vectorielles en 3 passes de lueur, pas de flou coûteux) :
  1. *Options × sous-jacents* : nuage de ticks qui s'accumule, sous-jacent et vue implicite des options en pointillés (légèrement en avance), curseur de balayage avec rémanence.
  2. *Backtests* : courbe de stratégie qui se trace, référence en pointillés, bandeau de drawdown, point de tête qui pulse.
  3. *Robustesse* : histogramme bootstrap qui se remplit, ligne zéro, plis walk-forward qui s'allument un par un.
  4. *Signaux ML* : projection 2D de points, frontière apprise qui se stabilise, barres d'importance des variables.
- **Éthique** : graphiques uniquement illustratifs, sur données synthétiques déterministes. Aucun chiffre de performance inventé ; le seul nombre affiché (1,5 Md de points) vient du CV.
- Architecture : chaque programme vit dans `src/os/apps/<nom>.js` et expose `start()`, `stop()` et `refresh()` (changement de langue). Il ne s'anime que si sa fenêtre est ouverte.

## 14. Oxford.dna : console de labo rétro-futuriste (programme n°2)

*v1 en risographie abandonnée : jolie mais peu lisible. v2 : mêmes idées d'animation, design rétro-futuriste lisible.*

- **Matière** : verre bleu nuit `#070b1a`, halos cyan et magenta dans les coins, **grille en perspective au sol** (science-fiction des années 80), panneaux holographiques à **coins HUD**.
- **Couleurs** : cyan `#5ef2e0` (principal), magenta `#ff6fb5` (contraste), texte `#e8f2ff`. Lignes néon nettes avec un **bloom** (copie floutée ajoutée en `lighter` sous le dessin net).
- **Typo, lisibilité d'abord** : **Space Grotesk** pour les titres, le résumé et les boutons ; IBM Plex Mono pour les étiquettes et les dates. Étiquettes du canvas en 12–13 px, claires sur fond sombre.
- **Mise en page** : bandeau HUD (● OXFORD.DNA · mémoire de recherche · MSc Statistical Science · console de labo génomique), titre **« De l'ADN au temps »** en dégradé blanc → cyan → magenta, rôle, université, encadrant, dates en cyan, 4 modules en boutons néon (filet cyan à gauche quand ils sont actifs).
- **Le résumé du CV en titre**, Space Grotesk 19–26 px, mots-clés en **cyan lumineux soulignés de magenta**.
- **4 vues animées** (idées inchangées) :
  1. *Séquence → profil* : brin de bases qui défile avec fenêtre de lecture, couches du Transformer en panneaux HUD traversés par une impulsion magenta, courbe de réponse cyan avec dégradé et observations magenta.
  2. *Transformer & attention* : arcs cyan (tête locale, au-dessus) et magenta (tête longue portée, en dessous). **La base sous la souris devient la requête.**
  3. *Saliency maps* : logo de séquence (hauteur = importance), lettres importantes en magenta, motifs encadrés en pointillés, faisceau de lecture.
  4. *Importance par permutation* : barres en dégradé, groupe brouillé en magenta, courbe d'origine en pointillés cyan contre la prédiction dégradée.
- **Honnêteté** : séquences et courbes synthétiques, qui illustrent les méthodes du CV sans montrer les résultats du mémoire.

## 15. CREST.nb : page de magazine de data-journalisme (programme n°3)

*v1 en carnet quadrillé abandonnée (graphiques et textes appréciés, pas le style). Parmi 4 pistes (plan d'architecte, style suisse, magazine, verre pastel), c'est le **magazine** qui a été retenu.*

- **Matière** : papier crème `#f6f1e7`, filet bordeaux en haut, filets fins `#d8d0c0`. Deux couleurs de graphique seulement : **bordeaux** `#8c1c13` (accent, β, barres, prévision) et **bleu ardoise** `#3b5b7a` (séries de données). Le texte est `#2a2722`.
- **Typographie éditoriale** : surtitre en capitales bordeaux (« Recherche · Économétrie »), grand titre en Fraunces droit (SOFT 0), **chapeau en italique**, signature entre deux filets (rôle · CNRS · CREST, encadrante, dates en bordeaux). Sommaire numéroté avec de grands chiffres serif, séparé par des filets.
- **Le résumé du CV** en Fraunces 20–27 px, mots-clés sur **fond rosé** `#f0d6d0`.
- **Les figures**, comme dans un article : filet noir épais au-dessus, légende « **Graphique n** · titre », grille horizontale légère sans axe vertical, ligne de base foncée, annotations en italique serif, et une ligne « Source : données synthétiques… » en pied de figure.
- **Contenu inchangé** : régression fonctionnelle (Y = ∫ β X dt en grand chiffre bordeaux), dimension infinie avec le **curseur λ** (trop de bruit / juste bien / trop lisse), haute → basse fréquence (barres trimestrielles bordeaux), prévision dont la bande se resserre (barre « jours observés »).

## 16. SocGen.chat : appli de chat en pâte à modeler (programme n°4)

*Le dernier programme est une **vraie appli de chat**, douce et moderne, pour se démarquer des trois autres (terminal ambre, console néon, magazine papier).*

- **Matière « clay »** : fond mastic `#f1e8de` avec deux halos (sable en haut à droite, corail en bas à gauche). Cartes `#fbf6ef` très arrondies (18 à 28 px), ombre portée douce, liseré clair en haut et léger creux en bas, comme de la pâte pressée. Sur le canvas, mêmes formes : rectangles « clay », billes à reflet radial, plateau creusé pour l'espace des embeddings.
- **Palette** reprise de l'icône du fichier : **corail** `#e07a5f` (l'utilisateur, l'accent), **marine** `#3d405b` (le texte, la réponse), **sauge** `#6fa58a`, **sable** `#f2cc8f` (le LLM, les citations). Une couleur par document : Habitation corail, Auto marine, FAQ sauge.
- **Typographie** : Nunito (ronde, 600–800) partout, sans serif ni mono.
- **Le résumé du CV** en Nunito 19–26 px, mots-clés surlignés en alternance sable et corail.
- **4 modules** :
  1. **Le chatbot** (HTML) : une fenêtre de chat avec un avatar sable qui cligne des yeux, des bulles corail pour l'utilisateur, des points « en train d'écrire », la réponse qui s'écrit en flux, puis des pastilles **Sources** numérotées.
  2. **Découper & vectoriser** : 3 documents dont les passages s'envolent un à un vers l'espace des embeddings, où ils se regroupent par thème.
  3. **Retrouver** : la question tombe comme une étoile sable, des ondes de recherche partent d'elle, et ses 3 plus proches voisins s'allument, avec un classement et des scores de similarité.
  4. **Générer** : un pipeline en deux rangées (question → recherche → contexte → prompt → LLM → réponse). Une bille sable circule le long des liens et la réponse s'écrit avec ses citations [1] [2]. La boucle dure 13 s.
- **Questions communes** : les 3 pastilles « Posez une question » pilotent le chat, la recherche et la génération. Les sources citées sont toujours les 2 premiers passages retrouvés, donc les modules restent cohérents.
- **Honnêteté** : les documents, questions et réponses sont fictifs, avec la mention « ce n'est pas l'outil interne ». Aucune donnée ni capture de Société Générale.

## 17. La Boutique : boutique de jeu rétro (Chapitre Projets)

*Spec : `.scratch/boutique-projets/spec.md`. Inspirations : `docs/inspirations/boutique/`.*

- **Idée** : la boutique en ligne d'un jeu rétro, ouverte dans un navigateur malOS. Chaque Projet est un Objet à « acheter » en tasses de café. Le prix mesure l'effort, environ 12 ☕ par semaine.
- **Objets** en pixel art, qui représentent littéralement le sujet : graphique, globe, réseau de neurones, carnet d'ordres, éclair dans une prise. Chacun a une petite boucle animée.
- **Interface en blocs** : contours noirs épais, ombres dures décalées, coins nets. Crème et noir sur fond **bleu cyan vif**. La couleur d'une carte n'indique que la **Rareté**, qui se déduit du prix.
- **Vignettes en cartes à collectionner** : bandeau avec le prix, l'Objet sur fond de Rareté, puis numéro, titre en grotesque très grasse et icônes des méthodes.
- **Typographie** : pixel pour les étiquettes et les boutons, grotesque grasse pour les titres, monospace pour les métadonnées. Jamais de pixel dans un paragraphe.
- **Boîte de dialogue rétro** réservée à la Fiche et à « Objet obtenu ! ». Pas de fenêtres dans la fenêtre.
- **Honnêteté** : uniquement de vrais résultats, rien d'inventé.
- **Valeurs retenues (v1, 2026-11-24)** :
  - fond `#1fb5e8`, encre `#111014`, papier `#fff7e8` ;
  - Rareté : commun `#d9f1fb`, rare `#ffd84d`, épique `#ff6b9a` ;
  - ombres dures de 3 à 10 px ;
  - Silkscreen (pixel) pour le prix, les onglets, les boutons et les étiquettes de méthodes ; Instrument Sans 700 (la graisse la plus forte de cette police) pour les titres ; IBM Plex Mono pour les métadonnées.
- **Objets** : grille de 48 × 36 pixels (v1.1 : 1,5 fois plus fine qu'au départ, sur retour « un peu trop pixelisé »), agrandie sans lissage. Les contours sont des disques ou des polygones à bord d'encre d'un pixel, pas des cercles échantillonnés, animée à 8 images par seconde (le pas rétro), à l'arrêt avec `prefers-reduced-motion`. Les Objets ont un contour à l'encre pour rester lisibles sur toutes les couleurs de Rareté.
- **Tasse de café** : un petit sprite pixel en SVG (10 × 8, `crispEdges`, couleur du texte), jamais l'emoji ☕ (trop « iPhone »). Il apparaît sur les prix, le porte-monnaie, le bouton Acheter et le pied de page.
- **Fiche** : une boîte de dialogue avec une barre de titre rayée « OBJET #NN » et une croix. En dessous, l'Objet en grand, le texte, les Méthodes en étiquettes et les Résultats en texte courant (jamais en police pixel), puis l'Aperçu, avec un lien « Ouvrir en grand ». En bas, le bouton jaune « Acheter · N ☕ » ou « Sur demande », qui ouvre le Profil.
- **Achat** : une boîte « TÉLÉCHARGEMENT… », une barre qui se remplit en 10 pas, puis « Objet obtenu ! ». Le lien s'ouvre au bout de 0,8 s, ce qui reste dans la fenêtre où le navigateur autorise encore l'ouverture d'un onglet après le clic.
- **Onglets de Rayon** : collés en haut de la page pendant le défilement. L'onglet actif est noir.

## 18. Le Profil : une page de Rimbaud traversée par la Silhouette

*Spec : `.scratch/profil/spec.md`. Référence : *black hole.mp4*, de buildwithsid (Inspora).*

- **Ouverture** : depuis l'avatar de la barre du haut, depuis l'icône **Profil** du Bureau (un badge cerclé de rouge, en tête de la colonne de droite), depuis « Malo Evain » dans bienvenue.txt, ou depuis « Sur demande » dans la Boutique. Le Profil s'ouvre en plein écran par un fondu de 0,3 s, sans plongée de caméra.
- **Page** : papier `#f3efe6`, encre `#15131a`, IBM Plex Mono 11 px (12 px sur mobile, donc moins de caractères). Le texte est « Le Bateau ivre » (1871, domaine public), en flux continu (` / ` entre les vers, ` · ` entre les strophes), à 50 % d'opacité.
- **Silhouette** : vue de profil, elle marche vers la droite et traverse la page en 18 s. Elle est dessinée par la densité des caractères (` .:-=+*#%@`) : cheveux, monture des lunettes et chaussures en `@`, peau claire, verre des lunettes presque vide. Les lettres s'écartent autour d'elle et forment un anneau plus sombre, et le curseur les pousse aussi. Sur mobile, elle marche au-dessus de la carte.
- **Coordonnées** : un bloc HTML fixe en bas à gauche, sur fond papier. Nom en Instrument Sans 700, liens en **rouge vif `#e5372c`**, soulignés au survol. Le texte laisse une marge vide autour du bloc, de la croix de fermeture, de la mention et de la barre du haut.
- **Accessibilité** : le canvas est ignoré par les lecteurs d'écran, la touche Tab reste dans la fenêtre et Échap la ferme. Avec `prefers-reduced-motion`, une seule image fixe.

## 11. Journal

- **2026-11-20** : création. Hero (île Maison) + Éducation (3 îles), cycle jour/nuit, FR/EN, rendu pixel.
  - Réglages après le premier rendu : ciel en dégradé *écran* (il reste visible quand la caméra regarde vers le bas), lumières ×1,7 / ×1,8 (sinon tout paraît terne), bloom de nuit limité à 0,5.
  - Lampadaires vert-de-gris avec un petit toit : en bleu marine, ils ressemblaient à des silhouettes humaines.
  - Les nuages ont leur propre matériau légèrement émissif, teinté par le ciel (sinon ils paraissent gris). Ils évitent le couloir de la caméra et se dissolvent s'ils y dérivent.
  - ENSAE est filmée depuis +x pour que le terrain de foot soit visible à côté de la carte.
  - Mobile : île en haut de l'écran, carte en bas, caméra reculée (×1,45).
- **2026-11-20 (v2)** : retours « pas smooth, pixels flous, transitions à améliorer ».
  - **Rendu net par défaut** : pleine résolution + antialiasing MSAA ×4 (cible HalfFloat). Ce sont les voxels qui font le « pixel art », plus besoin de basse résolution. Le mode `PIXEL` reste en option, avec un agrandissement **entier** exact (pixels parfaitement carrés).
  - Résolution dynamique : si la moyenne passe sous ~45 fps, l'échelle de rendu baisse par paliers de 0,25.
  - **Caméra en orbite** : chaque escale = une cible + (distance, azimut, élévation). On interpole ces valeurs (distance en log) au lieu des positions, et la caméra recule et monte légèrement en plein vol : de grands arcs fluides, plus de virages secs. La montgolfière est au centre pendant le trajet.
  - Couche UI allégée : grain statique, flou des vitres réduit (8 à 10 px), révélations sans `filter: blur`, survol des îles testé sur des boîtes englobantes (plus de raycast sur ~300k triangles), CSS du ciel mise à jour seulement quand elle change.
  - Chapitre « Parcours » : plus de carte ni de chiffres (3 écoles, 7 ans…). Juste un titre qui flotte dans le ciel.
- **2026-11-20 (v3)** :
  - Chapitre « Parcours » supprimé : on passe directement du hero à Saclay. Il reste 5 escales (Maison, Saclay, ENSAE, Oxford, À suivre).
  - **Rail de parcours** (à droite, cliquable) : pour chaque escale, le nom de l'école en Fraunces et les années en pixel. L'escale active a un losange terracotta, celles déjà passées sont pleines. Sur mobile, c'est une pastille horizontale sous la barre du haut.
  - Îles rapprochées d'environ 15 %.
  - **Easter eggs dans le ciel** (`src/world/skyEggs.js`), placés à 330 unités dans le repère de la caméra (donc toujours derrière les îles) : avion avec traînée, fusée avec fumée, petit gars en kimono orange sur un nuage doré, nuée d'oiseaux le jour, OVNI la nuit. Chacun passe à son propre rythme (27 à 53 s).
  - **Bâtiments d'après photos** :
    - *Paris-Saclay* : long bloc blanc, rez-de-chaussée vitré en retrait sur poteaux, trois étages posés sur des dalles en porte-à-faux avec garde-corps à lames ajourées, fenêtres entre des volets blancs, toit fin débordant.
    - *ENSAE* : cube à résille d'aluminium argentée (montants tous les 3 voxels, bandeaux d'étage), lames horizontales vert-de-gris en retrait d'un voxel, quelques baies ouvertes (éclairées la nuit), pilotis et RDC vitré, loggia évidée sur l'angle haut, bouleaux.
  - Les nuages évitent toutes les lignes de vue caméra → cible.
  - Le petit gars sur son nuage est modélisé environ 3× plus finement (~36 voxels de haut, échelle 0,36) : bottes et poignets bleus, pantalon de kimono large, ceinture nouée, maillot bleu en V, cheveux en pics vers l'arrière, bâton rouge dans le dos, nuage doré plus gonflé avec une traîne. Règle : un easter egg doit avoir une silhouette lisible au premier coup d'œil.
  - Debug : `__world.eggs.freeze = { i: 2, u: 0.4 }` fige un easter egg à l'écran (`null` pour relâcher).
- **2026-11-20 (v4)** :
  - **Le petit gars au nuage vole pour de vrai, en 3D, dans le monde** : boucles paresseuses autour de l'île regardée (derrière, devant, montées et piqués), inclinaison dans les virages proportionnelle à la vitesse de rotation, petite ombre portée sur les îles, et de temps en temps un long détour hors champ. En voyage, il suit le visiteur jusqu'à l'île suivante (centre de boucle amorti). Plus petit : environ 7 unités de haut, moins qu'une maison. Debug : `__world.eggs.freeze = { kid: 7 }` (un temps t).
  - L'avion et les oiseaux bougent aussi en profondeur (distance variable) et s'orientent selon leur vraie direction 3D.
  - **Plus de lumière blanche de pleine journée (v5)** : entre 6 h 36 et 18 h 30, le monde garde le look de **18 h 30**, avec sa propre clé de palette (ciel `#7b9ac6` → `#f4c59a`, soleil `#ffc590`, premières fenêtres allumées). À partir de 18 h 30, il suit l'heure réelle : couchant, crépuscule, nuit, puis aube. Le soleil se couche désormais côté caméra (+x), donc la lumière rasante éclaire les façades au lieu de les mettre à contre-jour. Le dégradé du curseur horaire reflète ce comportement. Pendant la journée, la phase affichée est « Heure dorée ».
  - **Survol des îles** : chaque île a une forme de détection invisible (cylindre effilé) qui reste à sa position de repos. Le soulèvement au survol ne fait plus clignoter l'état, et le survol est recalculé quand la caméra bouge sous un curseur immobile.
  - **Journée adoucie, plus cosy** : lumière directe de midi passée de 2,5 à 1,55 (moins de contraste), ciel bleu poudré, horizon crème plus chaud, bloom de jour réduit à 0,06–0,1 et seuil à 1,05 (seules les lumières brillent, plus le béton blanc). Étalonnage final : léger réchauffement, ombres un peu relevées, épaule douce sur les blancs (plus rien d'éblouissant).
