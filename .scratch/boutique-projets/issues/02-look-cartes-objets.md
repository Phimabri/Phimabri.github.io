# 02: Le look : cartes à collectionner et Objets animés

**What to build:** La Boutique prend sa DA de boutique de jeu rétro (`DA.md` §17, `docs/inspirations/boutique/`). Le fond est bleu cyan vif, l'interface en blocs (contours noirs épais, ombres dures décalées) en crème et noir. Chaque Vignette devient une carte à collectionner dont la couleur de fond indique la Rareté : bandeau avec le prix en ☕, l'Objet en pixel art au centre, puis le numéro (« #03 · 3/5 »), le titre en grotesque très grasse et une rangée d'icônes de méthodes. Les 5 Objets (graphique, globe, réseau de neurones, carnet d'ordres, éclair dans une prise) ont chacun une petite boucle animée. Des onglets de Rayon font sauter à la bonne partie, et un porte-monnaie « ∞ ☕ » s'affiche.

**Blocked by:** 01 (Squelette de la Boutique)

**Status:** ready-for-agent

- [ ] Palette, typographie (pixel pour les étiquettes et boutons, grotesque grasse pour les titres, monospace pour les métadonnées, jamais de pixel dans un paragraphe) et blocs conformes à DA §17, sans reprendre de marque ni de dessin existant
- [ ] Les 5 Objets sont en pixel art, lisibles au premier coup d'œil, et chacun a une boucle d'animation
- [ ] Les animations ne tournent qu'avec la Boutique ouverte et sont coupées avec prefers-reduced-motion
- [ ] Les onglets de Rayon font sauter à la bonne partie ; le compteur « ∞ ☕ » est visible
- [ ] Sur mobile : grille de 2 colonnes et onglets de Rayon en bandeau horizontal
- [ ] Les Vignettes sont atteignables au clavier (Tab)
- [ ] La palette se distingue de celle du Monde des îles et des quatre Programmes ; DA §17 est complétée (couleurs exactes et polices retenues)
