# Modelarska sekcija Aerokluba Ptuj – RC letala in jadralno letenje

Spletna predstavitev **Modelarske sekcije Aerokluba Ptuj**, namenjena ljubiteljem gradnje radijsko vodenih (RC) letalskih modelov in jadralnega letenja na športnem letališču **Moškanjci** pri Ptuju (prvotni avtor osnove: **Miha Plajnšek**).

Projekt združuje pregledno predstavitev društva, podatke o delavnicah in šoli letenja, praktične informacije z interaktivnim kalkulatorjem jadralnega doleta, kontaktni obrazec ter namenski 2D simulator jadralnega letenja v brskalniku.

---

## Kako je nastala spletna stran (od HTML do JavaScripta)

Razvoj spletne strani je potekal postopoma v treh jasno ločenih stopnjah:

### 1. stopnja – Semantična HTML5 osnova
- Zasnova štirih osnovnih podstrani: `index.html`, `dejavnost.html`, `informacije.html` in `kontakt.html`.
- Uvedba pripete zgornje navigacijske vrstice (`.pripeta-vrstica`), glave in noge strani za enotno povezovanje vseh podstrani.
- Vključitev fotografij domače vzletno-pristajalne steze (`Slike/aeroklub.jpg`) ter konstrukcije modela (`Slike/rc-plane.webp`) z opisnimi atributi `alt`.
- Izdelava preglednic tedenskega urnika in letne članarine (`informacije.html`), harmoničnega prikaza varnostnih pravil ter strukture kontaktnega obrazca (`kontakt.html`).

### 2. stopnja – Modularni CSS in temni/svetli način
- Vzpostavitev skupne slogovne datoteke `CSS/style.css` s CSS spremenljivkami po vzoru letalske instrumentne plošče (privzeti temni način in preklopni svetli način brez potrebe po strežniku).
- Odzivna zasnova po načelu **Mobile-First** (Flexbox in CSS Grid, prilagojeni mobilni spustni meni ter prelomne točke za tablice in namizja pri `768px`, `1024px` in `1200px`).
- Ločene podstranske CSS datoteke za preglednejše vzdrževanje (`CSS/index.css`, `CSS/dejavnost.css`, `CSS/informacije.css`, `CSS/kontakt.css`, pozneje še `CSS/simulator.css`).

### 3. stopnja – Čisti ES6+ JavaScript, interaktivnost in 2D simulator
- **Skupna logika in dostopnost (`JS/common.js`)**: Sinhrono branje in shranjevanje izbrane teme v `localStorage` pod ključem `ak_ptuj_tema` ter nastavitev atributa `data-theme` še pred prvim izrisom strani (brez utripanja), oddajanje dogodka `tema-spremenjena`, dopolnitev navigacijskih ikon, zapiranje mobilnega menija s tipko `Escape` ali klikom zunaj vrstice ter samodejno dodajanje povezave za preskok na glavno vsebino.
- **Vstopna stran (`JS/index.js`)**: Dinamični pozdrav glede na del dneva (*Dobro jutro*, *Dober dan*, *Dober večer*), slovenski datum in ura v živo (`HH:MM:SS`) z vektorsko ikono na podlagi trenutnega časa.
- **Dejavnosti in rezervacije (`JS/dejavnost.js`)**: Dinamično ustvarjanje kartic dogodkov in delavnic iz polja objektov `DEJAVNOSTI`, samodejno sestavljeni filtri po kategorijah in možnost *Samo prosta mesta*, sprotno odštevanje prostih mest ob rezervaciji (`Prosta mesta: X` / `Zasedeno`) ter ponastavitev začetnega stanja.
- **Kalkulator jadralnega doleta (`JS/informacije.js`)**: Izračun teoretičnega doleta, priporočenega varnega doleta s 30-odstotno pristajalno rezervo in ocenjenega časa leta v mirnem zraku; vključuje 4 prednastavitve zrakoplovov (RC jadralec F5J, šolsko, klubsko in tekmovalno jadralno letalo), odjemalsko validacijo ter animirani SVG profil drsenja.
- **Kontaktni obrazec (`JS/kontakt.js`)**: Dinamični vklop `novalidate`, sprotno štetje znakov sporočila, sproten nadzor veljavnosti vseh polj z dostopnim povzetkom napak in gumbi za skok na manjkajoča polja ter potrditvena kartica s povzetkom podatkov in predizpolnjeno povezavo `mailto:`.
- **2D simulator jadralnega letenja (`simulator.html`, `CSS/simulator.css`, `JS/simulator.js`)**:
  - Izris na platnu `<canvas>` v realnem času s prilagajanjem temnemu/svetlemu načinu in razmerjem pikslov zaslona (`devicePixelRatio`).
  - Trije profili zrakoplovov (*Šolsko jadralno letalo*, *Tekmovalno jadralno letalo*, *RC jadralni model*) in tri vremenske nastavitve (*Mirno*, *Termično*, *Zahtevno*).
  - **Vzlet z vitlom**: držanje `Preslednice` ali zaslonskega gumba pospeši letalo po stezi v Moškanjcih, spremlja napetost jeklene zajle z varnostnim odklopom pri preobremenitvi ter omogoča ročno (`R`) ali samodejno odpenjanje zajle z animiranim zavornim padalcem.
  - **Energijska fizika in trim**: drsna polara po tipu zrakoplova, izmenjava višine in hitrosti ob upravljanju nagiba (`W`/`S` ali `↑`/`↓`), izbira ciljne hitrosti z režimi *1 · Min. spuščanje*, *2 · Najboljši dolet* in *3 · Hitri prelet* ter finim trimom (`-` / `+` po `2 km/h`) in prikazom trenutne finese `L/D`.
  - **Vremenski pojavi in instrumenti (HUD)**: topli termični stebri (*Topli tok ↑*), hladni spustni tokovi (*Hladni tok ↓*), opozorilo ob prevlečenem letu s samodejnim reševanjem, zračne zavore (`B`), izbirni zvok variometra prek Web Audio API (privzeto izključen) ter povzetek pristanka z oceno dotika.

---

## Struktura projekta

```text
Spletna_stran_RSR/
├── index.html               # Vstopna stran s pozdravom, uro v živo in predstavitvijo
├── dejavnost.html           # Delavnice, kategorije modelov, šola letenja in rezervacije
├── informacije.html         # Tedenski urnik, članarina, lokacija in kalkulator doleta
├── kontakt.html             # Javni kontaktni podatki in interaktivni kontaktni obrazec
├── simulator.html           # Namenska podstran z 2D simulatorjem jadralnega letenja
├── README.md                # Dokumentacija projekta
├── CSS/
│   ├── style.css            # Skupne CSS spremenljivke, navigacija, tema in odzivnost
│   ├── index.css            # Slogi vstopne strani in pozdravnega gradnika
│   ├── dejavnost.css        # Slogi podstrani Dejavnost, filtrov in kartic dogodkov
│   ├── informacije.css      # Slogi tabel, lokacije, kalkulatorja in SVG grafa
│   ├── kontakt.css          # Slogi kontaktnega obrazca, validacije in potrditve
│   └── simulator.css        # Slogi instrumentne plošče (HUD), platna in kontrol
├── JS/
│   ├── common.js            # Sinhrona tema (localStorage), dostopnost in skupna navigacija
│   ├── index.js             # Pozdrav glede na uro in prikaz trenutnega časa
│   ├── dejavnost.js         # Podatki DEJAVNOSTI, filtri in rezervacija prostih mest
│   ├── informacije.js       # Kalkulator jadralnega doleta in animirani SVG profil
│   ├── kontakt.js           # Odjemalska validacija, števec znakov in potrditev obrazca
│   └── simulator.js         # Fizikalna zanka 2D simulatorja, trim, termika in zvok varia
└── Slike/
    ├── aeroklub.jpg         # Fotografija oz. prikaz steze letališča Moškanjci
    └── rc-plane.webp        # Tehnični prikaz konstrukcije RC modela
```

---

## Lokalni zagon in uporaba

Projekt deluje popolnoma na strani odjemalca in **ne potrebuje** zunanjih odvisnosti, paketnega upravitelja ali gradbenih orodij.

1. **Neposredno v brskalniku**: odprite datoteko `index.html` v sodobnem spletnem brskalniku.
2. **Prek preprostega lokalnega strežnika** (priporočeno za enotno delovanje vseh podstrani):

```bash
python3 -m http.server 8000
```

Nato v brskalniku odprite naslov `http://localhost:8000`.

---

## Tehnične smernice

- **Brez zunanjih ogrodij**: uporabljeni so izključno čisti semantični HTML5, modularni CSS3 in vanilijev ES6+ JavaScript.
- **Enotno komentiranje kode**: v datotekah JavaScript se uporabljajo enovrstični komentarji `//` in uokvirjeni večvrstični bloki `//**********************************************************` (brez blokovnih komentarjev `/* ... */`).
- **100 % slovenski vmesnik in dostopnost**: vsi vidni napisi, oznake instrumentov, opozorila in opisi so v slovenščini, ob podpori tipkovnice (`:focus-visible`, povezava za preskok na glavno vsebino, bližnjice v simulatorju) ter upoštevanju nastavitve `prefers-reduced-motion`.
