# Notizen Planungstreffen
- **datenbasis für leute**: facebook nachrichten(API call möglich?), twitter: öffentliche personen, bewerbungsschreiben, gmail-auth/android-emailberechtigung, textarea-fallback, übersetzungsservice für deutsche user nutzen, kongress-reden von politikern
- **crawler für charakter-metainformation**: imsb-über tabellen einfach, themoviedb – 30 abfragen pro 10sekunden, omdb
parser der moviescripts
- **wie evaluation**: 1) einen bringen, user muss aus drei vorschlägen ähnlichsten auswählen
2) aus einer menge von charakteren ähnliche auswählen
- **Sonstige Features**: foto vom charakter, charakter unbekannt, ähnlichkeitsbewertung einfach mitteln
- **Technik**: tobias-azure-server nutzen, node.js server, zur not java-webservice für uima, Frontend: anguular.js version 2 ausprobieren, mongoDB, github von TobiasK, Datenbank-Entwickler-Version auf die von lokaler Entwicklungsumgebung zugegriffen wird, sobald User auf App kommen – extra Version deployen

## Next Steps:
-	TobiK: Server aufsetzen, Github einrichten
-	TobiR: Crawler für Textdateien von IMSDB
-	Frank: REGEX-Parser schreiben
-	Johannes: IBM API ansprechen und Ergebnisse abspeichern
-	Max: Metadaten zu Charakteren abrufen (Foto, Summary-Text)
-	TobiK:1. Frontend 
  - Kategorie-Ansicht der Datenbankinhalte
  - Charakter-Info-Seite: Suche über Film>Charakter, anzeigen der Personality-API

## 2. Meilenstein: bis Ende Juni
-	Werte vergleichen
-	2. Frontend
  - User wählt bekannte Filme aus + Charakter daraus, System generiert drei andere Charaktere mit verschiedenen Ähnlichkeitswerten, System versucht vorauszusagen welche Antworten der User gibt
  -Bestenliste? Dazu müssten Frage-Antwort-Paare überwacht werden dass sie nicht doppelt auftreten

## 3. Meilenstein, circa August
-	eigene Texte einlesen

## 4. Doku schreiben im September
