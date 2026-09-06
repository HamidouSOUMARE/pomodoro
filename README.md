# 🍅 Pomodoro Tomate — app desktop

Minuteur Pomodoro rétro : cycles automatiques (focus → pause → grande pause),
enveloppe de session réglable, sons au choix, réglages mémorisés, et une
tomate en pixel art.

Interface en **React + TypeScript**, empaquetée avec **Vite** et **Electron**.

## Prérequis (une seule fois)

Installe **Node.js LTS** : https://nodejs.org (bouton vert, installation par défaut).
Vérifie dans un terminal : `node --version` doit afficher un numéro.

## Lancer l'app

Ouvre un terminal **dans ce dossier**, puis :

```bash
npm install       # télécharge les dépendances (~2-3 min la première fois)
npm run dev       # ouvre l'app dans le navigateur (rechargement à chaud)
npm run dev:desktop  # même chose, mais dans la fenêtre Electron
```

Pour lancer la version compilée dans sa fenêtre : `npm start`.

## Créer le vrai exécutable double-cliquable

```bash
npm run dist
```

Le résultat apparaît dans le dossier `release/` :

| Ton système | Fichier produit | Ensuite |
|---|---|---|
| **Windows** | `Pomodoro Tomate Setup 2.0.0.exe` | Double-clic → s'installe et crée un raccourci sur le bureau |
| **macOS** | `Pomodoro Tomate-2.0.0.dmg` | Double-clic → glisse l'app dans Applications |
| **Linux** | `Pomodoro Tomate-2.0.0.AppImage` | `chmod +x` puis double-clic |

⚠️ La commande construit l'installeur pour **le système sur lequel tu la lances**
(un .exe se fabrique sous Windows, un .dmg sous macOS).

💡 **Windows/macOS afficheront un avertissement de sécurité** au premier lancement
("éditeur inconnu") car l'app n'est pas signée avec un certificat payant. C'est normal
pour une app personnelle : clique "Informations complémentaires → Exécuter quand même"
(Windows) ou clic droit → Ouvrir (macOS).

## Durée totale de la session

Le réglage **Durée totale de la session** fixe l'enveloppe de travail (de 15 min à 12 h,
ou *illimitée*). L'app calcule combien de focus tiennent dedans, pauses comprises, et
l'annonce sous le réglage :

> 5 focus de 25 min, avec 4 pauses — 2 h 35 au total.

Pendant la session, un compteur affiche le temps consommé, le focus en cours et le temps
restant. Une fois le dernier focus bouclé, le minuteur s'arrête tout seul et propose de
repartir sur une nouvelle session.

## Raccourcis

- **Barre espace** : démarrer / mettre en pause
- **⏭** : passer directement à l'étape suivante
- **↺** : réinitialiser l'étape en cours

## Développement

```bash
npm test     # tests unitaires et de rendu (Vitest)
npm run lint # ESLint
npm run build # vérification TypeScript + build de production
```

Organisation du code :

```
electron/    fenêtre Electron (main + preload)
src/lib/     logique pure : plan de session, sons, persistance
src/hooks/   moteur du minuteur et réglages
src/components/  composants d'interface (CSS Modules)
src/styles/  design tokens — aucune valeur brute ailleurs
```
