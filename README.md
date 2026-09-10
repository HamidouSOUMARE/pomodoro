# 🍅 Pomodoro Tomate

Minuteur Pomodoro rétro : cycles automatiques (focus → pause → grande pause),
enveloppe de session réglable, sons au choix, réglages mémorisés, et une tomate
en pixel art.

App web installable (PWA) en **React + TypeScript**, construite avec **Vite**.
Elle s'adapte au téléphone comme au grand écran et fonctionne hors-ligne.

## Lancer le projet

Il faut **Node.js LTS** (https://nodejs.org). Ensuite, dans ce dossier :

```bash
npm install
npm run dev      # http://localhost:5173
```

Les autres commandes :

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement, rechargement à chaud |
| `npm run build` | vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | sert le build de production en local |
| `npm test` | tests unitaires et de rendu (Vitest) |
| `npm run lint` | ESLint |
| `npm run icons` | régénère les icônes PWA depuis le sprite |

## Installer l'app

Une fois le site ouvert dans le navigateur :

- **Android / Chrome** : menu ⋮ → « Installer l'application »
- **iOS / Safari** : Partager → « Sur l'écran d'accueil »
- **Ordinateur / Chrome, Edge** : icône d'installation dans la barre d'adresse

L'app s'ouvre alors dans sa propre fenêtre, sans barre d'URL, et démarre même
sans connexion : le service worker met en cache le code, les polices et les icônes.

> Le son de fin peut être coupé par le système quand l'app est en arrière-plan sur
> mobile — c'est une limite des navigateurs. Active « Notification système » dans les
> réglages pour un signal fiable. Sur iOS, les notifications ne fonctionnent que si
> l'app est installée sur l'écran d'accueil.

## Déployer

Le projet est un site statique, sans configuration particulière :

```bash
npm i -g vercel
vercel
```

Vercel détecte Vite tout seul (build `npm run build`, dossier `dist`).

## Durée totale de la session

Le réglage **Durée totale de la session** fixe l'enveloppe de travail (de 15 min à
12 h, ou *illimitée*). L'app calcule combien de focus tiennent dedans, pauses
comprises, et l'annonce sous le réglage :

> 5 focus de 25 min, avec 4 pauses — 2 h 35 au total.

Pendant la session, un compteur affiche le temps consommé, le focus en cours et le
temps restant. Une fois le dernier focus bouclé, le minuteur s'arrête tout seul et
propose de repartir sur une nouvelle session.

## Le jardin (branche `jardin`, en essai)

Le focus produit des **rayons** ☀, la monnaie du jardin :

| Source | Gain |
|---|---|
| Focus terminé | 1 ☀ par minute |
| 3 focus d'affilée | +15 ☀ |
| Session complète | +40 ☀ |

Les pauses ne rapportent rien, et un focus passé (⏭) non plus — il fait au passage
tomber la série et prive de la prime de session. Une session de 3 h rapporte ≈ 180 ☀.

Les rayons s'échangent contre des graines, puis servent à les arroser d'un stade
de croissance au suivant. Le prix suit la rareté, à l'achat comme à l'arrosage :

| Graine | Rareté | Graine | Arrosage | Total | Débloquée à |
|---|---|---|---|---|---|
| Pâquerette | Commune | 30 | 12 | 66 | — |
| Coquelicot | Commune | 45 | 18 | 99 | — |
| Tulipe | Peu commune | 90 | 35 | 195 | 3 h |
| Tournesol | Peu commune | 130 | 50 | 280 | 3 h |
| Lavande | Rare | 220 | 90 | 490 | 12 h |
| Cerisier | Légendaire | 400 | 160 | 880 | 35 h |

Les heures de focus cumulées ouvrent des parcelles (2 au départ, 6 à 50 h) et
débloquent les espèces. Une plante arrivée à maturité se cueille : elle rejoint la
collection et libère sa parcelle.

Les plantes poussent dans un **enclos** : une scène continue avec sa clôture, son
herbe, ses buissons et ses fleurs sauvages, où chaque parcelle est un emplacement
cliquable. Toucher une parcelle ouvre ses actions sous la scène.

Les sprites des plantes sont dessinés en pixels dans `src/garden/plants.ts`, sur une
grille de 16×16 validée par les tests. Le décor de l'enclos, lui, est construit par
`src/garden/scene.ts` : une grille de 80×68 écrite à la main serait illisible, alors
il est généré, avec une graine fixe pour rester identique d'un rendu à l'autre. Des
tests garantissent qu'aucun élément de décor ne vient recouvrir une parcelle.

## Raccourcis clavier

- **Barre espace** : démarrer / mettre en pause
- **Échap** : fermer les réglages
- **⏭** : passer à l'étape suivante
- **↺** : réinitialiser l'étape en cours

## Organisation du code

```
public/           icônes générées + fichiers servis tels quels
scripts/          générateur d'icônes (sans dépendance)
src/lib/          logique pure : plan de session, sons, persistance
src/hooks/        moteur du minuteur et réglages
src/components/   composants d'interface (CSS Modules)
src/styles/       design tokens — aucune valeur brute ailleurs
```

La mise en page bascule à 960 px : en dessous, une colonne et les réglages dans un
tiroir ; au-dessus, le minuteur et les réglages côte à côte.
