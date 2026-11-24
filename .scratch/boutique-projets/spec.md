# Spec : la Boutique, Chapitre Projets

Status: ready-for-agent

## Problem Statement

Le site présente le parcours de Malo en deux Chapitres très aboutis, Éducation (le Monde des îles) et Expériences (un Programme par Expérience), mais rien ne montre ses Projets personnels et de cours. Le Visiteur, souvent un recruteur, ne voit donc ni ce que Malo construit de lui-même, ni les méthodes qu'il maîtrise en dehors d'un poste ou d'un diplôme. Seul un post-it « Projets, bientôt » dans la Chambre annonce ce manque.

## Solution

Un troisième Chapitre, **Projets**, présenté comme une **Boutique** : la boutique en ligne d'un jeu rétro, en pixel art 2D, ouverte dans un navigateur de malOS. Le Visiteur fait défiler des Rayons de Vignettes. Chaque Projet y est un Objet animé avec un prix en Tasses de café qui exprime l'effort qu'il a demandé, et une Rareté qui en découle. Un clic sur une Vignette ouvre la Fiche, un panneau par-dessus la grille qui explique le Projet, ses méthodes et ses résultats. Le bouton « Acheter » mène à la vraie ressource (dépôt, site, rapport), ou au Profil quand il n'y en a pas. Le Chapitre Projets atteint le même niveau de finition qu'Éducation et Expériences.

## User Stories

1. En tant que Visiteur, je veux voir sur le Bureau une grande icône de caddie à côté des Dossiers Éducation et Expériences, pour comprendre qu'il existe un troisième Chapitre.
2. En tant que Visiteur, je veux que l'icône de la Boutique bénéficie du même guidage léger que les Dossiers (halo, note manuscrite) tant que je n'ai rien ouvert, pour savoir que je peux cliquer dessus.
3. En tant que Visiteur, je veux ouvrir la Boutique en cliquant sur l'icône de caddie, pour découvrir les Projets.
4. En tant que Visiteur, je veux une ligne « Projets » dans bienvenue.txt, pour y accéder depuis le message d'accueil.
5. En tant que Visiteur, je veux un onglet « Projets » dans le menu, pour y accéder depuis n'importe quel endroit du site.
6. En tant que Visiteur, je veux que l'onglet actif du menu indique « Projets » quand la Boutique est ouverte, pour savoir où je me trouve.
7. En tant que Visiteur, je veux que l'ouverture de la Boutique s'accompagne de la même plongée de caméra dans l'écran que les Programmes, pour que le passage reste cohérent avec le reste du site.
8. En tant que Visiteur, je veux voir la Boutique dans une fenêtre de navigateur malOS avec une barre d'adresse, pour comprendre qu'il s'agit d'un « site web » dans l'ordinateur.
9. En tant que Visiteur, je veux revenir au Bureau avec « Retour au bureau », la pastille de fermeture ou Échap, comme pour les Programmes.
10. En tant que Visiteur, je veux une page qu'on fait défiler, découpée par Rayon (Web & agents, Marchés, Machine learning), pour parcourir les Projets par domaine.
11. En tant que Visiteur, je veux des onglets de Rayon en haut de la Boutique qui me font sauter à la partie correspondante, pour aller droit au domaine qui m'intéresse.
12. En tant que Visiteur, je veux voir le Projet le plus récent en premier dans chaque Rayon, pour voir d'abord le travail actuel.
13. En tant que Visiteur, je veux que chaque Vignette montre l'Objet, le titre, la date, le prix en ☕ et la Rareté, pour juger un Projet d'un coup d'œil.
14. En tant que Visiteur, je veux que chaque Objet représente littéralement le sujet du Projet (un graphique, un globe, un réseau de neurones, un carnet d'ordres, un éclair dans une prise), pour deviner de quoi il parle avant de lire.
15. En tant que Visiteur, je veux que chaque Objet ait une petite boucle d'animation discrète, pour que la Boutique paraisse vivante.
16. En tant que Visiteur, je veux que la couleur du cadre d'une Vignette indique sa Rareté (commun, rare, épique), pour repérer les Projets les plus ambitieux.
17. En tant que Visiteur, je veux comprendre que le prix en Tasses de café mesure l'effort, pour lire la Boutique comme un clin d'œil honnête et pas comme une vraie vente.
18. En tant que Visiteur, je veux voir un porte-monnaie « ∞ ☕ », comme dans une boutique de jeu, pour le clin d'œil.
19. En tant que Visiteur, je veux qu'un clic sur une Vignette ouvre la Fiche par-dessus la grille, pour inspecter un Projet sans perdre ma place.
20. En tant que Visiteur, je veux que la Fiche affiche le titre, l'Objet en grand, le Rayon, la date, le prix et la Rareté, pour avoir tout le contexte du Projet.
21. En tant que Visiteur, je veux une explication simple de 2 ou 3 phrases dans la Fiche, pour comprendre le Projet sans connaître le domaine.
22. En tant que recruteur, je veux une liste « Méthodes » (algorithmes, outils) dans la Fiche, pour évaluer les compétences techniques de Malo.
23. En tant que recruteur, je veux une liste « Résultats » avec uniquement de vrais résultats, pour faire confiance aux chiffres affichés.
24. En tant que Visiteur, je ne veux pas voir de liste « Résultats » vide quand un Projet n'a rien de chiffrable, pour que la Fiche reste propre.
25. En tant que Visiteur, je veux fermer la Fiche (bouton, Échap, clic à côté) et retrouver la grille à l'endroit où je l'avais laissée.
26. En tant que Visiteur, je veux qu'un clic sur « Acheter » joue une courte animation « Objet obtenu ! » (moins d'une seconde), puis ouvre le lien du Projet dans un nouvel onglet, pour un moment amusant qui ne fait pas attendre.
27. En tant que Visiteur, je veux que le bouton devienne « Sur demande » et ouvre le Profil quand un Projet n'a pas de lien public, pour savoir comment en apprendre davantage.
28. En tant que recruteur, je veux ouvrir le dépôt GitHub de time-series-analysis et de introduction_to_GAN, pour lire le code.
29. En tant que recruteur, je veux voir un Aperçu en direct des maquettes PureOptics dans la Fiche, puis les ouvrir en grand, pour juger du résultat sans quitter la Boutique.
30. En tant que recruteur, je veux lire le rapport PDF de l'étude de market making sur Polymarket, pour juger de la démarche.
31. En tant que Visiteur anglophone, je veux tout le texte de la Boutique en anglais quand le site est en EN, pour la comprendre entièrement.
32. En tant que Visiteur, je veux que la Boutique se mette à jour quand je change de langue alors qu'elle est ouverte.
33. En tant que Visiteur sur mobile, je veux une grille de 2 colonnes, des onglets de Rayon en bandeau horizontal et une Fiche en plein écran, pour une Boutique confortable sur téléphone.
34. En tant que Visiteur sensible aux animations, je veux que `prefers-reduced-motion` coupe les boucles des Objets et l'animation « Objet obtenu ! », pour ne pas être gêné.
35. En tant que Visiteur au clavier, je veux parcourir les Vignettes avec Tab, ouvrir une Fiche avec Entrée et la fermer avec Échap, pour utiliser la Boutique sans souris.
36. En tant que Visiteur sur un portable moyen, je veux que les animations de la Boutique s'arrêtent quand elle est fermée, pour que le site reste fluide.
37. En tant que Malo, je veux que le prix soit calculé à partir de la durée de travail (environ 12 ☕ par semaine, ajustable de ±20 % selon la complexité), pour que tous les prix restent cohérents entre eux.
38. En tant que Malo, je veux que la Rareté se déduise du prix, pour ne jamais avoir deux informations à maintenir en accord.
39. En tant que Malo, je veux ajouter un Projet en complétant uniquement le catalogue (texte FR/EN, Rayon, durée, date, lien, Objet), pour faire grandir la Boutique sans retoucher la mise en page.
40. En tant que Malo, je veux que le post-it « Projets, bientôt » disparaisse de la Chambre quand la Boutique est en ligne, pour que le décor n'annonce pas quelque chose qui existe déjà.

## Implementation Decisions

- **Contenu au lancement** : cinq Projets.

  | Projet | Rayon | Objet | Lien | Durée | Année | Prix (coef. 1) | Rareté |
  |---|---|---|---|---|---|---|---|
  | courtier-mcp | Web & agents | éclair dans une prise | « Sur demande », qui ouvre le Profil | 2,5 semaines | 2026 | 30 ☕ | rare |
  | Étude de market making sur Polymarket | Marchés | carnet d'ordres (offres vertes et rouges, et l'écart) | rapport PDF servi par le site (`projects/rapport_latence_polymarket.pdf` dans le dossier public) | 2,5 semaines | 2026 | 30 ☕ | rare |
  | Site PureOptics | Web & agents | globe façon World Wide Web | maquettes sur GitHub Pages (phimabri.github.io/pureoptics-maquettes), avec Aperçu | 1 semaine | 2026 | 12 ☕ | commun |
  | time-series-analysis | Machine learning | graphique | dépôt GitHub public | 1 semaine | 2024 | 12 ☕ | commun |
  | introduction_to_GAN | Machine learning | réseau de neurones | dépôt GitHub public | 1 semaine | 2023 | 12 ☕ | commun |

  Les durées viennent de Malo (« 2 à 3 semaines » est compté 2,5). Les prix sont calculés avec un coefficient de complexité de 1, à ajuster éventuellement.

  Le RAG est exclu, parce qu'il ferait doublon avec SocGen.chat. Aucune case verrouillée ni case « à venir ».
- **Catalogue** : un module de données et de logique pure, sans DOM, qui est la seule source des Projets. Chaque entrée contient un identifiant, les textes FR/EN (titre, explication, méthodes, résultats éventuels), le Rayon, la durée en semaines, un coefficient de complexité optionnel borné entre 0,8 et 1,2, la date, le lien éventuel et l'identifiant de l'Objet. Le module expose :
  - le prix d'un Projet : environ 12 ☕ par semaine × le coefficient, arrondi ;
  - la Rareté déduite du prix : commun en dessous de 15 ☕, rare de 15 à 40 ☕, épique au-delà ;
  - les Projets groupés par Rayon (ordre fixe des Rayons), du plus récent au plus ancien dans chaque Rayon ;
  - l'action du bouton : ouvrir un lien, ou « Sur demande », qui ouvre le Profil.
- **La Boutique suit le contrat des Programmes** : une fabrique qui reçoit sa racine DOM et la fonction de traduction, et qui renvoie `start()`, `stop()` et `refresh()`. Elle s'ouvre et se ferme par le même mécanisme plein écran (agrandissement depuis l'élément cliqué, plongée de caméra, retour au Bureau). Au sens du glossaire, ce n'est pas un Programme, puisqu'elle ne présente pas d'Expérience. Elle réutilise seulement le même contrat.
- **Boucles d'animation** : elles ne tournent qu'entre `start()` et `stop()`. Elles sont coupées avec `prefers-reduced-motion`.
- **Points d'entrée** : une grande icône de caddie au centre du Bureau, au même rang que les deux Dossiers et avec le même guidage tant que rien n'a été ouvert. Une troisième ligne dans bienvenue.txt. Un onglet « Projets » dans le menu, dans l'ordre Éducation → Expériences → Projets. L'onglet actif suit l'état « Boutique ouverte ».
- **Texture 3D de l'écran** : elle doit reprendre la nouvelle disposition du Bureau (icône de caddie, troisième ligne de bienvenue.txt), pour que le passage de la 3D au HTML reste invisible.
- **Navigateur malOS** : un cadre de fenêtre avec une barre d'adresse fictive (du genre `projets.malo.shop`), qui contient la Boutique.
- **Fiche** : un panneau modal par-dessus la grille qui conserve la position de défilement. Il se ferme avec un bouton, Échap ou un clic à l'extérieur. La liste « Résultats » est omise si elle est vide.
- **Bouton Acheter** : une animation « Objet obtenu ! » de moins d'une seconde, puis l'ouverture du lien dans un nouvel onglet. Sans lien, « Sur demande » ouvre le Profil (voir la spec du Profil).
- **Textes** : tous les textes de la Boutique passent par le système FR/EN existant (règle d'or n° 4). Les textes propres à chaque Projet vivent dans le catalogue, en FR et en EN.
- **Chambre** : le post-it « Projets, bientôt » est retiré.
- **DA** (d'après `docs/inspirations/boutique/`) : rétro gaming en 2D, sans thème médiéval ni personnage.
  - **Objets** en pixel art.
  - **Interface en blocs** : contours noirs épais, ombres dures décalées, coins nets.
  - **Palette** : crème et noir sur fond bleu cyan vif. La couleur de fond d'une carte n'indique que la Rareté.
  - **Typographie** : police pixel pour les étiquettes courtes, les boutons et le prix ; grotesque très grasse pour les titres de Projet ; monospace pour les métadonnées. Jamais de pixel dans les paragraphes.
  - **Vignette en carte à collectionner** : bandeau avec le prix en ☕, l'Objet sur fond de Rareté, puis le numéro (« #03 · 3/5 »), le titre et une rangée d'icônes de méthodes.
  - **Pas de fenêtres dans la fenêtre** : le style « boîte de dialogue rétro » est réservé à la Fiche et au message « Objet obtenu ! », présenté comme un téléchargement à 100 %.
  - La section DA de la Boutique est ajoutée dans `DA.md` (§17).
- **Aperçu** : toute Fiche dont le Projet a un site en ligne affiche ce site en direct dans un cadre intégré, chargé seulement à l'ouverture de la Fiche et vidé à sa fermeture. Sur mobile, une capture statique remplace le direct. Au lancement, seul PureOptics a un Aperçu.
- **Honnêteté** (comme pour les Programmes) : aucun chiffre inventé. Pour Polymarket, la Fiche présente une étude, sans aucun résultat de performance absent du rapport.

## Testing Decisions

- **Ce qu'est un bon test** : il vérifie le comportement observable (prix, Rareté, ordre, action du bouton pour un catalogue donné), jamais la structure interne. Les tests du catalogue lui passent des entrées fabriquées pour l'occasion, pas le vrai contenu, pour que modifier un texte ne casse aucun test.
- **Point de test 1, le catalogue (automatique)** : tests avec le lanceur intégré de Node, sans nouvelle dépendance, et un script `test` dans le package. Cas couverts :
  - prix par semaine et arrondi ;
  - coefficient borné entre 0,8 et 1,2 ;
  - Rareté exactement aux seuils 15 et 40 ;
  - ordre fixe des Rayons et tri par date décroissante ;
  - Rayon vide absent ;
  - lien présent → « Acheter », lien absent → « Sur demande » ;
  - textes FR et EN tous présents pour chaque Projet (garde-fou sur le vrai catalogue).
- **Point de test 2, la Boutique dans le vrai site (manuel)** : lancer le site, puis :
  - ouvrir la Boutique par les trois points d'entrée ;
  - faire défiler et utiliser les onglets de Rayon ;
  - ouvrir et fermer une Fiche (souris, clavier, Échap) ;
  - cliquer sur Acheter et sur Sur demande ;
  - changer de langue Boutique ouverte ;
  - vérifier le mobile et `prefers-reduced-motion` ;
  - revenir au Bureau et vérifier que les animations sont arrêtées.
- **Précédent** : le dépôt n'a aucun test aujourd'hui. Le contrat `start/stop/refresh` des quatre Programmes existants sert de modèle pour le point 2.

## Out of Scope

- Le Profil : spec séparée, `.scratch/profil/spec.md`, dont la Boutique dépend seulement pour « Sur demande ».
- Un porte-monnaie alimenté par les Détails cachés et Easter eggs trouvés. Seul le « ∞ ☕ » fixe est prévu.
- Des Projets ML plus anciens (MNIST, Perceptron, etc.) et toute case « à venir ».
- Une vraie transaction, un vrai panier ou un état persistant.
- La météo, l'ambiance sonore et les autres idées de `DA.md` §10.

## Further Notes

Points encore ouverts, à régler avant ou pendant l'implémentation :
- **Coefficients de complexité** : tous à 1 pour l'instant. Avec ces durées, aucun Projet n'est épique.
- **Couleurs exactes de Rareté** et **choix des polices**, à arrêter pendant l'implémentation. On s'inspire des images, sans reprendre de marque ni de dessin existant.
- **Rapport PDF Polymarket** : Malo le dépose dans le dossier public des Projets. Il sera téléchargeable publiquement.

Vocabulaire : voir `GLOSSARY.md` (Boutique, Vignette, Fiche, Objet, Rayon, Rareté, Tasse de café).
