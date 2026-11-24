# 01: Squelette de la Boutique, de bout en bout

**What to build:** Le Visiteur ouvre la Boutique depuis ses trois portes d'entrée : la grande icône de caddie au centre du Bureau, une 3ᵉ ligne dans bienvenue.txt et l'onglet « Projets » du menu. La caméra plonge dans l'écran comme pour les Programmes, puis un navigateur malOS s'affiche avec une barre d'adresse fictive. On y fait défiler les Rayons (Web & agents, Marchés, Machine learning), chacun avec des Vignettes simples (titre, date, prix en ☕, Rareté) tirées du catalogue, et on revient au Bureau par le bouton, la pastille ou Échap. Le décor ne contredit plus la Boutique. Voir `.scratch/boutique-projets/spec.md`.

Le ticket commence par un préalable : l'ouverture plein écran des Programmes est rendue extensible (un registre au lieu d'identifiants codés en dur), sans changer le comportement des quatre Programmes existants.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Préalable : QRT, Oxford, CREST et SocGen s'ouvrent et se ferment exactement comme avant
- [ ] Le catalogue (logique pure) calcule le prix (≈ 12 ☕ par semaine × un coefficient borné entre 0,8 et 1,2, arrondi), la Rareté (commun < 15, rare de 15 à 40, épique > 40), les groupes par Rayon triés du plus récent au plus ancien, et l'action du bouton (lien ou « Sur demande »)
- [ ] Le catalogue contient les 5 Projets de la spec (les textes peuvent être provisoires) ; un script de test lance les tests du catalogue avec le lanceur intégré de Node, sans nouvelle dépendance, et ils passent
- [ ] Le caddie est au centre du Bureau, au même rang que les Dossiers, avec le même guidage tant que rien n'a été ouvert
- [ ] bienvenue.txt a une ligne Projets ; l'onglet menu « Projets » n'affiche plus « bientôt » et devient actif quand la Boutique est ouverte
- [ ] La texture 3D de l'écran reprend la nouvelle disposition du Bureau, et le passage de la 3D au HTML reste invisible
- [ ] Le post-it « Projets, bientôt » est retiré de la Chambre et notes.txt est mis à jour
- [ ] La Boutique suit le contrat start/stop/refresh, se met à jour au changement de langue et n'anime rien une fois fermée
