# projet-QUANTUM

Runtime central récupéré/reconstruit en mode sûr.

## Lancement Codespaces / Node
```bash
npm install
npm start
```
Puis ouvrir le port 3000.

## Structure
- `main.js` : serveur Node + WebSocket + API
- `public/` : UI HTML5 cockpit
- `.vscode/launch.json` : debug VS Code
- `scripts/` : scan et safe-check
- `config/` : configuration

## Règle sécurité
Mode calme : pas de boucle de reconnexion agressive, pas de minage caché, pas de proxy, pas de botnet.
