# 01: Le Profil

**What to build:** Le Visiteur ouvre le Profil depuis l'avatar de la barre de menus, depuis « Malo Evain » dans bienvenue.txt ou depuis « Sur demande » dans la Boutique. Une scène plein écran s'ouvre en moins de 0,5 s : sur un fond papier, le texte de Rimbaud, « Le Bateau ivre », en petits caractères ASCII. La Silhouette de Malo le traverse en marchant et écarte les lettres sur son passage, et le curseur les déforme aussi. Un bloc fixe en bas à gauche donne les coordonnées en rouge vif : nom, une phrase, e-mail (copier et mailto), LinkedIn, GitHub, CV. Le composant expose « ouvrir » et « fermer », pour que la Boutique puisse l'appeler. Voir `.scratch/profil/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** done

Données fournies par Malo :
- CV (PDF anglais) : le fichier `CV.pdf` du dossier « CV etc », parent du portfolio, à copier dans le dossier public du site
- LinkedIn : https://www.linkedin.com/in/malo-evain-b1310420a/
- E-mail affiché : malo.evain.eu@gmail.com

- [x] L'avatar est visible et cliquable dans la barre de menus, dans tous les modes, y compris sur mobile ; « Malo Evain » dans bienvenue.txt ouvre aussi le Profil
- [x] Le Profil s'ouvre en moins de 0,5 s, sans plongée de caméra, et se ferme avec Échap, avec le bouton ou par un nouveau clic sur l'avatar
- [x] Scène ASCII monochrome sur papier clair, avec « Le Bateau ivre » (répété si nécessaire) et sa mention FR/EN ; le poème reste en français
- [x] La Silhouette (jeune adulte, corpulence moyenne, lunettes, cheveux courts juste au-dessus des oreilles, vue de profil) traverse la page en 15 à 20 s avec un cycle de marche ; les lettres s'écartent autour d'elle et s'assombrissent à l'intérieur
- [x] Le curseur déforme légèrement le texte ; une marge vide entoure le bloc des coordonnées
- [x] Le bloc des coordonnées est en HTML, fixe, au premier plan ; les éléments cliquables sont en rouge vif et soulignés au survol
- [x] L'e-mail se copie avec une confirmation ; mailto, LinkedIn, GitHub et le CV (PDF anglais, nouvel onglet) fonctionnent
- [x] Le canvas est ignoré par les lecteurs d'écran ; le Profil se navigue au clavier
- [x] Mobile : densité réduite et animation fluide ; avec prefers-reduced-motion, une image fixe
- [x] L'animation est arrêtée une fois le Profil fermé ; l'Utilitaire GitHub du Bureau est conservé ; une section DA du Profil est ajoutée à `DA.md`
