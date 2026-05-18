# Sicherheits- & Datenschutzrichtlinie

## Datenschutz

Minispiele speichert **nichts auf Servern**. Sämtliche Daten — Favoriten, Spielstände, Settings, zuletzt gespielte Spiele — liegen ausschließlich im `localStorage` deines Browsers. Es gibt:

- keine Accounts, keine Logins,
- keine Tracker, keine Analytics,
- keine Cookies,
- keine Drittanbieter-Requests zur Laufzeit (außer den statischen Assets vom Cloudflare-Worker-CDN).

Möchtest du alle Daten löschen: Browser-Settings → Site-Daten für `minispiele.daniel-rck.workers.dev` entfernen.

## Sicherheitslücken melden

Bitte **nicht** als öffentliches Issue. Stattdessen:

1. **Bevorzugt:** [Privates Security Advisory anlegen](https://github.com/daniel-rck/Minispiele/security/advisories/new) — GitHub leitet das direkt an den Maintainer und ermöglicht koordinierte Offenlegung.
2. Alternativ per E-Mail an den Maintainer (siehe GitHub-Profil [@daniel-rck](https://github.com/daniel-rck)).

Bitte beschreibe:

- die betroffene Komponente / Route,
- Schritte zur Reproduktion,
- mögliche Auswirkung (XSS, LocalStorage-Manipulation, Service-Worker-Cache-Vergiftung, …).

Du bekommst i. d. R. innerhalb von **7 Tagen** eine erste Rückmeldung.

## Supported Versions

Es wird ausschließlich `main` gepflegt. Es gibt kein LTS und keine Backports — die PWA aktualisiert sich beim nächsten Besuch automatisch über Workbox.

## Out of Scope

- Browser-Bugs, die nicht reproduzierbar in einem aktuellen Chromium/Firefox/Safari auftreten.
- Schwächen, die ausschließlich physischen Zugriff auf das Gerät voraussetzen (LocalStorage ist per Design lokal).
- Vermeintliche „Cheats" innerhalb eines Spiels (die Spiele tracken lokal — Manipulation des eigenen LocalStorage ist kein Sicherheitsproblem).
