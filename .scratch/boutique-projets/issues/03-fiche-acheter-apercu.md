# 03: La Fiche, Acheter et l'Aperçu

**What to build:** Un clic (ou Entrée) sur une Vignette ouvre la Fiche par-dessus la grille, dans le style boîte de dialogue rétro. Elle montre le titre, l'Objet en grand, le Rayon, la date, le prix et la Rareté, une explication simple, la liste « Méthodes » et la liste « Résultats » (absente si elle est vide). « Acheter » affiche une boîte « Objet obtenu ! » façon téléchargement à 100 % (moins d'une seconde), puis ouvre le lien dans un nouvel onglet. Sans lien, le bouton devient « Sur demande » et ouvre le Profil. La Fiche de PureOptics affiche un Aperçu en direct des maquettes.

**Blocked by:** 01 (Squelette de la Boutique) ; Profil 01 (`.scratch/profil/issues/01-profil.md`) pour « Sur demande ». Malo dépose le rapport Polymarket dans le dossier public des Projets.

**Status:** ready-for-agent

- [ ] La Fiche se ferme par le bouton, avec Échap ou par un clic à l'extérieur, et la grille garde sa position de défilement
- [ ] Sur mobile, la Fiche est en plein écran ; elle se navigue au clavier
- [ ] « Acheter » joue l'animation, puis ouvre le lien ; l'animation est coupée avec prefers-reduced-motion
- [ ] Liens : dépôts GitHub publics pour time-series-analysis et introduction_to_GAN ; maquettes GitHub Pages pour PureOptics ; rapport PDF servi par le site pour Polymarket ; « Sur demande » pour courtier-mcp, qui ouvre le Profil
- [ ] L'Aperçu PureOptics est chargé seulement à l'ouverture de la Fiche et vidé à sa fermeture ; sur mobile, une capture statique le remplace
- [ ] Tous les libellés sont en FR et en EN
