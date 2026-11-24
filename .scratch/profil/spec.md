# Spec : le Profil

Status: ready-for-agent

## Problem Statement

Le Visiteur qui veut joindre Malo ou récupérer son CV n'a pas d'endroit évident pour le faire. L'idée d'un Chapitre Contact, une boîte aux lettres sur l'Île Maison, est abandonnée : un Dossier de plus serait redondant, et le contact doit rester accessible depuis n'importe où sur le site. Malo veut aussi que ce moment ait un vrai design, moderne et marquant, et pas juste une liste de liens.

## Solution

Un **Profil** : la session de Malo dans malOS, ouverte depuis un avatar rond tout à droite de la barre de menus, depuis « Malo Evain » dans bienvenue.txt, ou depuis le bouton « Sur demande » de la Boutique. Il s'ouvre en grand par-dessus le site, en moins d'une demi-seconde, sans plongée de caméra.

La scène est inspirée de *black hole.mp4* (buildwithsid, sur Inspora) : une page papier claire, couverte du texte de Rimbaud, « Le Bateau ivre », en petits caractères monochromes très contrastés. Une **Silhouette** de Malo, dessinée par la densité des caractères, traverse lentement la page en marchant, vue de profil. Les lettres s'écartent et se courbent autour d'elle, et s'assombrissent à l'intérieur de sa forme. Le curseur déforme aussi un peu le texte. Les coordonnées (nom, e-mail, LinkedIn, GitHub, CV) sont du vrai texte HTML, fixe, en rouge vif, dans un bloc en bas à gauche, toujours au premier plan.

## User Stories

1. En tant que Visiteur, je veux voir un avatar à droite de la barre de menus, pour savoir à qui appartient cet ordinateur et où trouver ses coordonnées.
2. En tant que Visiteur, je veux ouvrir le Profil en cliquant sur l'avatar, depuis le Bureau, le Monde des îles, un Programme ou la Boutique.
3. En tant que Visiteur, je veux ouvrir le Profil en cliquant sur « Malo Evain » dans bienvenue.txt, pour en savoir plus juste après la présentation.
3b. En tant que Visiteur sur le Bureau, je veux une icône Profil bien visible (en tête de la colonne des Utilitaires), pour trouver le Profil sans chercher l'avatar en haut à droite.
4. En tant que Visiteur dans la Boutique, je veux qu'un clic sur « Sur demande » ouvre le Profil, pour demander l'accès à un Projet privé.
5. En tant que Visiteur, je veux que le Profil s'ouvre en grand presque instantanément, pour ne pas attendre une transition.
6. En tant que Visiteur, je veux voir une page de texte dense en petits caractères, sur fond papier clair, pour être surpris par une ambiance très différente du reste du site.
7. En tant que Visiteur, je veux voir une silhouette qui ressemble à Malo (jeune adulte, corpulence moyenne, lunettes, cheveux courts juste au-dessus des oreilles) traverser la page en marchant, pour avoir l'impression de rencontrer la personne.
8. En tant que Visiteur, je veux que les lettres s'écartent et se courbent sur le passage de la Silhouette, pour que le texte paraisse vivant.
9. En tant que Visiteur, je veux que mon curseur écarte lui aussi un peu les lettres, pour avoir envie de jouer avec la page.
10. En tant que Visiteur curieux, je veux reconnaître un vrai poème, avec une petite mention de l'auteur et de l'œuvre, pour comprendre d'où vient le texte.
11. En tant que Visiteur, je veux voir le nom et une courte phrase de présentation dans le bloc des coordonnées, pour savoir à qui j'écris.
12. En tant que recruteur, je veux voir l'adresse e-mail de Malo avec un bouton pour la copier, pour lui écrire depuis mon propre outil.
13. En tant que recruteur, je veux un lien mailto cliquable, pour écrire directement.
14. En tant que recruteur, je veux un lien LinkedIn cliquable qui s'ouvre dans un nouvel onglet.
15. En tant que recruteur, je veux un lien GitHub cliquable qui s'ouvre dans un nouvel onglet, même s'il existe aussi un Utilitaire GitHub sur le Bureau.
16. En tant que recruteur, je veux qu'un clic sur « CV » ouvre le CV en PDF (en anglais) dans un nouvel onglet, pour le lire ou le télécharger.
17. En tant que Visiteur, je veux que les coordonnées ne bougent jamais et restent au premier plan, pour pouvoir les viser et cliquer facilement.
18. En tant que Visiteur, je veux que les éléments cliquables soient d'une seule couleur vive, soulignés au survol, pour les repérer immédiatement.
19. En tant que Visiteur, je veux une confirmation visible quand l'e-mail est copié, pour savoir que la copie a fonctionné.
20. En tant que Visiteur, je veux fermer le Profil avec Échap, avec un bouton de fermeture ou par un nouveau clic sur l'avatar.
21. En tant que Visiteur anglophone, je veux tous les libellés du Profil en anglais quand le site est en EN, le poème restant en français.
22. En tant que Visiteur sur mobile, je veux un Profil fluide (animation moins dense) avec des coordonnées faciles à toucher.
23. En tant que Visiteur sensible aux animations, je veux qu'avec `prefers-reduced-motion` la Silhouette reste immobile et le texte stable.
24. En tant que Visiteur au clavier, je veux atteindre l'avatar avec Tab, ouvrir le Profil avec Entrée, et parcourir les liens.
25. En tant que Visiteur utilisant un lecteur d'écran, je veux que l'animation soit ignorée et que seules les coordonnées soient lues.
26. En tant que Visiteur sur un portable moyen, je veux que l'animation s'arrête dès que le Profil est fermé, pour que le site reste fluide.

## Implementation Decisions

- Le Profil n'est pas un Chapitre : il n'a ni Dossier ni onglet de Chapitre dans le menu.
- Un composant Profil unique expose « ouvrir » et « fermer », appelés par l'avatar, par le nom dans bienvenue.txt et par la Boutique. Il suit le contrat start/stop/refresh : l'animation ne tourne qu'entre l'ouverture et la fermeture.
- **Ouverture** : une couche plein écran par-dessus le site, en moins de 0,5 s (fondu), sans plongée de caméra. Elle est accessible dans tous les modes. La barre du haut et l'avatar restent visibles et utilisables : un lien du menu ferme d'abord le Profil, puis fait son action. Le monde 3D est en pause tant que le Profil est ouvert.
- **Scène ASCII** (décor, ignoré par les technologies d'assistance), dessinée sur un canvas :
  - fond papier clair, caractères sombres monospace fins, monochrome très contrasté ;
  - le texte de fond est « Le Bateau ivre » d'Arthur Rimbaud (1871, domaine public), répété autant que nécessaire pour remplir la page. Il reste en français dans les deux langues. Une mention (« Arthur Rimbaud, *Le Bateau ivre*, 1871 ») passe par le système FR/EN ;
  - la **Silhouette** : un jeune adulte de corpulence moyenne (environ 1,75 m), avec des lunettes et des cheveux courts juste au-dessus des oreilles, vu de profil, dessiné par la densité des caractères. Elle est générée par le code (pas de photo ni de vidéo), avec un cycle de marche ;
  - elle traverse la page de gauche à droite en 15 à 20 s, sort par un bord et revient par l'autre ;
  - à l'intérieur de la Silhouette, les lettres sont remplacées par des caractères de densité (` .:-=+*#%@`) ; autour, elles s'écartent et forment un anneau plus sombre ; le curseur produit une petite déformation du même type ;
  - le texte garde une marge vide autour du bloc des coordonnées, de la croix, de la mention et de la barre du haut ;
  - sur mobile, la Silhouette marche au-dessus du bloc des coordonnées, qui occupe le bas de l'écran.
- **Bloc des coordonnées** (HTML, fixe, toujours au premier plan, en bas à gauche) : nom, une phrase, e-mail (copier et mailto), LinkedIn, GitHub, CV. Tous les éléments cliquables sont en rouge vif (vermillon), soulignés au survol, avec un contraste suffisant sur le papier.
- **Données** : le CV est le PDF anglais fourni par Malo, servi comme fichier statique et ouvert dans un nouvel onglet quelle que soit la langue. LinkedIn : https://www.linkedin.com/in/malo-evain-b1310420a/. E-mail affiché : malo.evain.eu@gmail.com.
- L'Utilitaire GitHub du Bureau est conservé. Le doublon est voulu.
- **Mobile** : densité de caractères réduite. Le bloc des coordonnées reste lisible et facile à toucher.
- **`prefers-reduced-motion`** : une seule image fixe, sans marche ni déformation au curseur.
- La DA du Profil est ajoutée à `DA.md`, dans une section dédiée.

## Testing Decisions

- Aucune logique pure à isoler en priorité. Vérification manuelle dans le vrai site :
  - ouvrir le Profil depuis les trois points d'entrée et depuis chaque mode (Bureau, Monde des îles, Programme, Boutique) ;
  - vérifier la marche de la Silhouette et la déformation au curseur ;
  - copier l'e-mail, ouvrir chaque lien et le CV ;
  - vérifier FR/EN, le mobile, le clavier et `prefers-reduced-motion` ;
  - fermer le Profil et vérifier que l'animation est arrêtée.
- Un bon test vérifie ce que voit et fait le Visiteur, pas la structure du composant. Si la déformation du texte est écrite comme une fonction pure (position d'un caractère selon la Silhouette et le curseur), elle peut recevoir un test avec le lanceur intégré de Node, comme le catalogue de la Boutique.

## Out of Scope

- Un formulaire de contact ou un envoi de message depuis le site.
- Un CV en français ou généré dynamiquement.
- Une Silhouette tirée d'une photo ou d'une vidéo de Malo.
- Les œuvres protégées par le droit d'auteur (*L'Étranger*, *Le Seigneur des anneaux*).
- Tout Chapitre Contact.

## Further Notes

- Référence : *black hole.mp4*, de buildwithsid (https://www.inspora.design/posts/black-hole-mp4). On reprend l'idée (texte ASCII déformé par une forme), pas le contenu.
- L'e-mail sera public : on peut l'assembler au moment du clic pour gêner les robots de spam, sans rien changer pour le Visiteur.
- Le CV fourni date du 18 septembre 2026 : à remplacer s'il a changé.
- Vocabulaire : voir `GLOSSARY.md` (Profil, Silhouette, Visiteur, Utilitaire).
