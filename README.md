# 🍅 Pomodoro Tomate — app desktop

Minuteur Pomodoro avec cycles automatiques (focus → pause → grande pause), sons au choix, réglages mémorisés, et une tomate qui se dandine.

## Prérequis (une seule fois)

Installe **Node.js LTS** : https://nodejs.org (bouton vert, installation par défaut).
Vérifie dans un terminal : `node --version` doit afficher un numéro.

## Lancer l'app (mode développement)

Ouvre un terminal **dans ce dossier**, puis :

```bash
npm install     # télécharge Electron (~2-3 min la première fois)
npm start       # lance l'app dans sa fenêtre
```

## Créer le vrai exécutable double-cliquable

Toujours dans ce dossier :

```bash
npm run dist
```

Le résultat apparaît dans le dossier `dist/` :

| Ton système | Fichier produit | Ensuite |
|---|---|---|
| **Windows** | `Pomodoro Tomate Setup 1.0.0.exe` | Double-clic → s'installe et crée un raccourci sur le bureau |
| **macOS** | `Pomodoro Tomate-1.0.0.dmg` | Double-clic → glisse l'app dans Applications |
| **Linux** | `Pomodoro Tomate-1.0.0.AppImage` | `chmod +x` puis double-clic |

⚠️ La commande construit l'installeur pour **le système sur lequel tu la lances** (un .exe se fabrique sous Windows, un .dmg sous macOS).

💡 **Windows/macOS afficheront un avertissement de sécurité** au premier lancement ("éditeur inconnu") car l'app n'est pas signée avec un certificat payant. C'est normal pour une app personnelle : clique "Informations complémentaires → Exécuter quand même" (Windows) ou clic droit → Ouvrir (macOS).

## Raccourcis

- **Barre espace** : démarrer / mettre en pause
- **⏭** : passer directement à l'étape suivante
- **↺** : réinitialiser le minuteur en cours

## Personnaliser

Tout se passe dans `index.html` (interface + logique) et `main.js` (fenêtre).
Les durées, sons et options sont modifiables directement dans l'app via ⚙ Réglages.
