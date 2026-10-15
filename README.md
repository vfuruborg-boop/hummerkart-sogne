# Hummerkart Søgne

GitHub-klart React/Vite-prosjekt basert på Copilot-prototypen.

## Funksjoner
- Sett og velg teiner i prototypekartet
- Registrer dybde, fangst og kommentar
- Lokal lagring i nettleseren
- Eksport og import av data som JSON
- GPS-tillatelse og status
- Responsivt mobilgrensesnitt

> Kartflaten er foreløpig en visuell prototype og må ikke brukes til navigasjon.

## Kjør lokalt
```bash
npm install
npm run dev
```

## Publiser med GitHub Pages
1. Opprett et nytt GitHub-repository, for eksempel `hummerkart-sogne`.
2. Last opp alle filene i denne pakken til repositoryets rot.
3. Commit og push til `main`.
4. Gå til **Settings → Pages**.
5. Velg **Source: GitHub Actions**.
6. Åpne fanen **Actions** og vent til workflowen `Deploy to GitHub Pages` er ferdig.

Nettadressen vises i workflowen og under **Settings → Pages**.

## Neste tekniske steg
Erstatt prototypekartet i `src/App.jsx` med korrekt kartkomponent og godkjente kart-/dybdedata. Hold private teineplasser ute av repositoryet.
