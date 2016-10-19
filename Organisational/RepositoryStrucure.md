## Vorschlag für die Verzeichnisstructur

Das Repository könnte wie folgt aufgebaut sein.

### Ordner Organizational

Enthält interne Dokumente für Ideen / Konzepte, Protokolle von Treffen etc.

| Verzeichnis        | Verwendung                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| docs               | Abgestimmte Spezifikationen (Schnittstellen, UML, ...)                    |
| drafts             | Ideensammlungen, Skizzen, die noch zu diskutieren sind                    |
| protocols          | Protokolle von Meetings (intern oder die regulären Freitagstreffen)       |


### Ordner Documentation

Für die Dokumentation, die am Ende abzugeben ist.

| Verzeichnis        | Verwendung                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| images             | Grafiken, die für Text-Doku oder Präsentation benötigt werden.            |
| latex              | Text-Dokumentation                                                        |
| slides             | Präsentationsunterlagen                                                   |


### Ordner Server

Enthält den gesamten Server-Code. Vorsicht: Keine Credentials einchecken!

| Verzeichnis        | Verwendung                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| tbd                | tbd                                                                       |


### Ordner Client

Enthält alles, was die GUI betrifft

| Verzeichnis        | Verwendung                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| tbd                | tbd                                                                       |


### Ordner API

Alle Schnittstellen, die sowohl von Client und Server benötigt werden, landen hier (Single Code-Base).

| Verzeichnis        | Verwendung                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| tbd                | tbd                                                                       |


### Ordner Data

Enthält Datenbankdumps, Installationsscripts oder ähnliches, das von allen benötigt wird.

| Verzeichnis        | Verwendung                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| dumps              | Datenbankdumps                                                            |
| setup              | Installationsscripts, Initiale Datenbankscripts                           |
