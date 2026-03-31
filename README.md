# Captchoum

Poisson d'avril 2026.

## Ce que ça fait

- Clique sur "Activer le micro" → demande la permission `getUserMedia`.
- Une barre de volume en temps réel (via Web Audio API + AnalyserNode RMS) s'anime à chaque son perçu.
- Une ligne seuil rouge avec le volume à franchir.
- L'emoji réagit selon l'intensité sonore (de 😐 à 🤧 en passant par 😤).
- Des particules volent quand le volume monte.
- Dépasse le seuil → overlay de succès animé avec confettis et le volume de pointe atteint.

## Détails techniques

- `AudioContext` + `AnalyserNode` → calcul du volume RMS frame par frame via `requestAnimationFrame`.
- Aucun son enregistré ni envoyé, tout est 100% local.
- Sont réglables : le seuil `THRESHOLD` et la durée `SUSTAINED_MS`.
