# Anem a cole — normes del projecte

App web instal·lable (PWA) per ajudar un nen de 6 anys (1r de primària) a aprendre lletres i a llegir, en català. Es fa servir en una tablet Android, de vegades sol i de vegades amb un adult.

## Format
- Web estàtica publicada amb GitHub Pages des de `main` (arrel). Sense servidor ni eines de compilació.
- Ha de poder-se afegir a la pantalla d'inici, obrir-se a pantalla completa i funcionar sense internet (`sw.js`).
- **Quan es canvia qualsevol fitxer, cal pujar `VERSIO` a `sw.js`**, si no la tablet continua amb la versió vella.

## On és cada cosa
- `js/dades.js`: lletres, paraules, números, adhesius, frases de la veu i lletres inicials. És el fitxer per canviar continguts.
- `js/app.js`: pantalles i exercicis. `js/veu.js`: veu i sons. `js/estat.js`: progrés guardat.
- `css/estil.css`: disseny.

## Requisits per al nen
- Tot amb veu: s'ha de poder fer sense saber llegir les instruccions.
- Botons grans, colors alegres però nets, sense distraccions ni anuncis.
- Mai missatges negatius: si s'equivoca, l'anima a tornar-ho a provar.
- Ha de funcionar bé en horitzontal i en vertical.
- Només avança de nivell quan l'encerta (encerts al primer intent seguits).
- Lletra: majúscules per defecte, canviable al mode adult (`TIPUS_LLETRA_INICIAL`).

## Privadesa (el repositori és públic)
- El progrés es guarda només a la tablet. Cap enviament de dades enlloc, cap recurs extern (ni fonts ni scripts de fora).
- Res de noms, escola, fotos familiars, dades personals, contrasenyes ni claus dins el codi.
- Si mai cal guardar dades privades, preguntar-ho abans.

## Jocs
- Lletres, Síl·labes, Paraules.
- Números (escolta i toca), Compta (quants n'hi ha), Uneix (dibuixar amb el dit de l'1 al 10 sense creuar línies; si es creuen, "Tornem-hi!", mai "has perdut").
- Han de ser **ràpids**: frases curtes, poques esperes, passar sol a la pregunta següent.

## Fora d'abast
Escriptura, comptes d'usuari, connexió a internet obligatòria.

## Com treballem
- Respondre en català, clar i curt, sense tecnicismes (l'usuari no és programador).
- Preguntar abans d'inventar.
- Comprovar al simulador amb mida de tablet (horitzontal i vertical) abans de dir que està fet.
- En acabar cada tanda: commit i push a `main`, i donar l'enllaç: https://antonisalvaalvarez.github.io/anem-a-cole/
- Mantenir `PENDENTS.md` al dia.
