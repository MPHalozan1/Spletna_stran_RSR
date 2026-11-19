//**********************************************************
// Skripta za podstran Dejavnost (JS/dejavnost.js)         *
// Dinamični prikaz dogodkov, delavnic, filtrov in         *
// rezervacije prostih mest za Aeroklub Ptuj               *
//**********************************************************

//**********************************************************
// Podatkovni seznam aktualnih dejavnosti in dogodkov      *
// Dodajanje novega objekta samodejno ustvari novo kartico *
// in po potrebi nov gumb za filtriranje kategorije        *
//**********************************************************
const DEJAVNOSTI = [
    {
        id: 'sola-jadralnega-letenja',
        naslov: 'Osnovni tečaj jadralnega letenja',
        kategorija: 'Šola letenja',
        opis: 'Teoretični in praktični uvod v jadralno letenje z mentorjem za nove člane, vključno z delom na simulatorju in pregledom pred vzletom.',
        termin: 'Sobota, 23. 5. 2026 ob 09:00',
        lokacija: 'Letališče Moškanjci',
        prostaMesta: 4
    },
    {
        id: 'rc-delavnica-balza',
        naslov: 'RC modelarska delavnica: gradnja krila iz balze',
        kategorija: 'Delavnice',
        opis: 'Praktična delavnica sestavljanja reber, natančnega brušenja aeroprofila ter nastavljanja servomotorjev in oddajnikov.',
        termin: 'Sreda, 27. 5. 2026 ob 17:30',
        lokacija: 'Klubska delavnica Moškanjci',
        prostaMesta: 5
    },
    {
        id: 'tandemski-polet-jadralno',
        naslov: 'Tandemski informativni polet z jadralnim letalom',
        kategorija: 'Informativni poleti',
        opis: 'Panoramski informativni polet nad Ptujskim poljem in Halozami v dvosedežnem jadralnem letalu v spremstvu klubskega inštruktorja.',
        termin: 'Nedelja, 31. 5. 2026 ob 10:00',
        lokacija: 'Letališče Moškanjci',
        prostaMesta: 0
    },
    {
        id: 'vikend-vzletov-z-vitlom',
        naslov: 'Vikend vzletov z vitlom na stezi Moškanjci',
        kategorija: 'Letalski dogodki',
        opis: 'Trening varnih vzletov z vitlom, izpeljave šolskih krogov in natančnega pristajanja z zračnimi zavorami pod vodstvom vodje letenja.',
        termin: 'Sobota, 6. 6. 2026 ob 08:30',
        lokacija: 'Letališče Moškanjci',
        prostaMesta: 6
    },
    {
        id: 'tekmovanje-f3j-f5j',
        naslov: 'Klubsko tekmovanje RC jadralcev F3J / F5J',
        kategorija: 'Tekmovanja',
        opis: 'Prijateljsko klubsko srečanje in merjenje natančnosti pristajanja ter izrabe termičnih dviganj z radijsko vodenimi jadralnimi modeli.',
        termin: 'Nedelja, 14. 6. 2026 ob 09:30',
        lokacija: 'Modelarska steza Moškanjci',
        prostaMesta: 3
    },
    {
        id: 'seminar-termicnega-jadranja',
        naslov: 'Seminar termičnega jadranja in branja vremena',
        kategorija: 'Šola letenja',
        opis: 'Poglobljena razlaga nastanka termičnih stebrov, prepoznavanja kumulusov, izogibanja hladnim spustnim tokom in načrtovanja varnega doleta.',
        termin: 'Četrtek, 18. 6. 2026 ob 18:00',
        lokacija: 'Klubska učilnica Moškanjci',
        prostaMesta: 2
    }
];

(() => {
    //**********************************************************
    // Notranje stanje modula za filtriranje in rezervacije   *
    //**********************************************************
    const stanje = {
        aktivnaKategorija: 'Vse',
        samoProstaMesta: false,
        prostaMestaPoId: new Map(),
        potrdiloPoId: new Map(),
        zadnjiUtripPoId: new Map(),
        cakajociOdstraniTimerji: new Map(),
        glavnoObvestilo: '',
        vrstaObvestila: ''
    };

    //**********************************************************
    // Reference na osrednje elemente uporabniškega vmesnika   *
    //**********************************************************
    const elementi = {
        vsebnik: null,
        kategorijeSkupina: null,
        gumbSamoProsta: null,
        gumbPonastavi: null,
        stevecPrikaza: null,
        obvestiloTrak: null,
        mrezaKartic: null
    };

    //**********************************************************
    // Inicializira začetna prosta mesta iz seznama DEJAVNOSTI*
    //**********************************************************
    function ponastaviZacetnoStanjeMest() {
        stanje.prostaMestaPoId.clear();
        stanje.potrdiloPoId.clear();
        stanje.zadnjiUtripPoId.clear();
        DEJAVNOSTI.forEach((dejavnost) => {
            const zacetno = Math.max(0, Number(dejavnost.prostaMesta) || 0);
            stanje.prostaMestaPoId.set(dejavnost.id, zacetno);
        });
    }

    //**********************************************************
    // Počisti aktivne časovnike za samodejno skrivanje kartic*
    //**********************************************************
    function pocistiCakajoceTimerje() {
        stanje.cakajociOdstraniTimerji.forEach((timerId) => {
            window.clearTimeout(timerId);
        });
        stanje.cakajociOdstraniTimerji.clear();
    }

    //**********************************************************
    // Pridobi trenutno število prostih mest za izbran dogodek*
    //**********************************************************
    function pridobiProstaMesta(id) {
        if (!stanje.prostaMestaPoId.has(id)) {
            return 0;
        }
        return stanje.prostaMestaPoId.get(id);
    }

    //**********************************************************
    // Sestavi seznam edinstvenih kategorij iz DEJAVNOSTI      *
    //**********************************************************
    function pridobiKategorije() {
        const unikatne = new Set();
        DEJAVNOSTI.forEach((dejavnost) => {
            if (dejavnost.kategorija) {
                unikatne.add(String(dejavnost.kategorija).trim());
            }
        });
        return ['Vse', ...unikatne];
    }

    //**********************************************************
    // Vrne besedilo potrditve rezervacije v pravilni slovenščini*
    //**********************************************************
    function oblikujPotrditevRezervacije(preostalaMesta) {
        if (preostalaMesta === 0) {
            return 'Mesto uspešno rezervirano! Zadnje prosto mesto je zdaj zasedeno.';
        }
        if (preostalaMesta === 1) {
            return 'Mesto uspešno rezervirano! Na voljo je še 1 prosto mesto.';
        }
        if (preostalaMesta === 2) {
            return 'Mesto uspešno rezervirano! Na voljo sta še 2 prosti mesti.';
        }
        if (preostalaMesta === 3 || preostalaMesta === 4) {
            return 'Mesto uspešno rezervirano! Na voljo so še ' + preostalaMesta + ' prosta mesta.';
        }
        return 'Mesto uspešno rezervirano! Na voljo je še ' + preostalaMesta + ' prostih mest.';
    }

    //**********************************************************
    // Ustvari varen SVG element brez uporabe innerHTML        *
    //**********************************************************
    function ustvariIkonoSvg(vrsta) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.classList.add('kartica-ikona');

        if (vrsta === 'termin') {
            const okvir = document.createElementNS(ns, 'rect');
            okvir.setAttribute('x', '3');
            okvir.setAttribute('y', '4');
            okvir.setAttribute('width', '18');
            okvir.setAttribute('height', '18');
            okvir.setAttribute('rx', '2');

            const crta1 = document.createElementNS(ns, 'line');
            crta1.setAttribute('x1', '16');
            crta1.setAttribute('y1', '2');
            crta1.setAttribute('x2', '16');
            crta1.setAttribute('y2', '6');

            const crta2 = document.createElementNS(ns, 'line');
            crta2.setAttribute('x1', '8');
            crta2.setAttribute('y1', '2');
            crta2.setAttribute('x2', '8');
            crta2.setAttribute('y2', '6');

            const crta3 = document.createElementNS(ns, 'line');
            crta3.setAttribute('x1', '3');
            crta3.setAttribute('y1', '10');
            crta3.setAttribute('x2', '21');
            crta3.setAttribute('y2', '10');

            svg.append(okvir, crta1, crta2, crta3);
            return svg;
        }

        const pin = document.createElementNS(ns, 'path');
        pin.setAttribute('d', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z');

        const krog = document.createElementNS(ns, 'circle');
        krog.setAttribute('cx', '12');
        krog.setAttribute('cy', '10');
        krog.setAttribute('r', '3');

        svg.append(pin, krog);
        return svg;
    }

    //**********************************************************
    // Izračuna filtriran seznam dejavnosti glede na nastavitve*
    //**********************************************************
    function pridobiFiltriraneDejavnosti() {
        return DEJAVNOSTI.filter((dejavnost) => {
            const ujemaKategorijo =
                stanje.aktivnaKategorija === 'Vse' ||
                dejavnost.kategorija === stanje.aktivnaKategorija;

            if (!ujemaKategorijo) {
                return false;
            }

            if (stanje.samoProstaMesta) {
                return pridobiProstaMesta(dejavnost.id) > 0;
            }

            return true;
        });
    }

    //**********************************************************
    // Posodobi napis z natančnim številom prikazanih dogodkov*
    //**********************************************************
    function posodobiStevecPrikaza(steviloVidnih) {
        if (!elementi.stevecPrikaza) {
            return;
        }
        const skupno = DEJAVNOSTI.length;
        elementi.stevecPrikaza.textContent =
            'Prikazanih: ' + steviloVidnih + ' od ' + skupno + ' dogodkov';
    }

    //**********************************************************
    // Posodobi glavno statusno vrstico z obvestilom           *
    //**********************************************************
    function posodobiGlavnoObvestilo(sporocilo, vrsta) {
        stanje.glavnoObvestilo = sporocilo;
        stanje.vrstaObvestila = vrsta || '';

        if (!elementi.obvestiloTrak) {
            return;
        }

        elementi.obvestiloTrak.textContent = sporocilo;
        elementi.obvestiloTrak.classList.remove('obvestilo-uspeh', 'obvestilo-ponastavitev');

        if (!sporocilo) {
            elementi.obvestiloTrak.hidden = true;
            return;
        }

        elementi.obvestiloTrak.hidden = false;
        if (vrsta === 'ponastavitev') {
            elementi.obvestiloTrak.classList.add('obvestilo-ponastavitev');
        } else {
            elementi.obvestiloTrak.classList.add('obvestilo-uspeh');
        }
    }

    //**********************************************************
    // Posodobi aktivno stanje gumbov za filtriranje           *
    //**********************************************************
    function posodobiAktivnostFiltrov() {
        if (elementi.kategorijeSkupina) {
            const gumbiKategorij = elementi.kategorijeSkupina.querySelectorAll('.gumb-kategorija');
            gumbiKategorij.forEach((gumb) => {
                const jeAktiven = gumb.dataset.kategorija === stanje.aktivnaKategorija;
                gumb.classList.toggle('aktiven', jeAktiven);
                gumb.setAttribute('aria-pressed', jeAktiven ? 'true' : 'false');
            });
        }

        if (elementi.gumbSamoProsta) {
            elementi.gumbSamoProsta.classList.toggle('aktiven', stanje.samoProstaMesta);
            elementi.gumbSamoProsta.setAttribute(
                'aria-pressed',
                stanje.samoProstaMesta ? 'true' : 'false'
            );
        }
    }

    //**********************************************************
    // Posodobi prikaz razpoložljivosti na obstoječi kartici  *
    //**********************************************************
    function osveziStanjeKartice(kartica, dejavnost, sproziAnimacijo) {
        const prostaMesta = pridobiProstaMesta(dejavnost.id);
        const jeZasedeno = prostaMesta === 0;

        kartica.classList.toggle('je-zasedeno', jeZasedeno);

        const znacka = kartica.querySelector('.kartica-zasedenost');
        if (znacka) {
            znacka.textContent = jeZasedeno ? 'Zasedeno' : 'Prosta mesta: ' + prostaMesta;
            znacka.classList.toggle('zasedeno', jeZasedeno);
        }

        const gumbRezerviraj = kartica.querySelector('.gumb-rezerviraj');
        if (gumbRezerviraj) {
            gumbRezerviraj.disabled = jeZasedeno;
            gumbRezerviraj.textContent = jeZasedeno ? 'Zasedeno' : 'Rezerviraj mesto';
        }

        const potrdiloEl = kartica.querySelector('.kartica-potrditev');
        const besediloPotrdila = stanje.potrdiloPoId.get(dejavnost.id) || '';
        if (potrdiloEl) {
            potrdiloEl.textContent = besediloPotrdila;
            potrdiloEl.hidden = !besediloPotrdila;
        }

        if (sproziAnimacijo) {
            const zadnji = stanje.zadnjiUtripPoId.get(dejavnost.id) === 'a' ? 'b' : 'a';
            stanje.zadnjiUtripPoId.set(dejavnost.id, zadnji);
            kartica.classList.remove('kartica-rezervirana-a', 'kartica-rezervirana-b');
            kartica.classList.add(zadnji === 'a' ? 'kartica-rezervirana-a' : 'kartica-rezervirana-b');
        }
    }

    //**********************************************************
    // Obdela klik na gumb "Rezerviraj mesto" na kartici       *
    //**********************************************************
    function obdelajRezervacijo(dejavnost, kartica) {
        const trenutnaMesta = pridobiProstaMesta(dejavnost.id);
        if (trenutnaMesta <= 0) {
            return;
        }

        const novaMesta = trenutnaMesta - 1;
        stanje.prostaMestaPoId.set(dejavnost.id, novaMesta);

        const besediloPotrdila = oblikujPotrditevRezervacije(novaMesta);
        stanje.potrdiloPoId.set(dejavnost.id, besediloPotrdila);

        osveziStanjeKartice(kartica, dejavnost, true);

        const dodatnoObvestilo =
            novaMesta === 0
                ? ' Vsa razpoložljiva mesta so zdaj zasedena.'
                : ' Preostala prosta mesta: ' + novaMesta + '.';
        posodobiGlavnoObvestilo(
            'Rezervacija potrjena za dogodek »' + dejavnost.naslov + '«.' + dodatnoObvestilo,
            'uspeh'
        );

        //**********************************************************
        // Če je vklopljen filter "Samo prosta mesta" in je        *
        // število padlo na 0, kartico po prikazu nežno skrijemo.  *
        //**********************************************************
        if (stanje.samoProstaMesta && novaMesta === 0) {
            if (stanje.cakajociOdstraniTimerji.has(dejavnost.id)) {
                window.clearTimeout(stanje.cakajociOdstraniTimerji.get(dejavnost.id));
            }
            const timerId = window.setTimeout(() => {
                stanje.cakajociOdstraniTimerji.delete(dejavnost.id);
                if (!stanje.samoProstaMesta || pridobiProstaMesta(dejavnost.id) > 0) {
                    return;
                }
                kartica.classList.add('kartica-odhaja');
                const odhodTimerId = window.setTimeout(() => {
                    stanje.cakajociOdstraniTimerji.delete(dejavnost.id);
                    izrisiMrezoKartic();
                }, 260);
                stanje.cakajociOdstraniTimerji.set(dejavnost.id, odhodTimerId);
            }, 1600);
            stanje.cakajociOdstraniTimerji.set(dejavnost.id, timerId);
        }
    }

    //**********************************************************
    // Ustvari DOM element posamezne kartice dejavnosti        *
    //**********************************************************
    function ustvariKartico(dejavnost, indeks) {
        const kartica = document.createElement('article');
        kartica.className = 'dejavnost-kartica';
        kartica.dataset.id = dejavnost.id;
        kartica.style.setProperty('--kartica-zaporedje', String(indeks));

        const zgornjiDel = document.createElement('div');
        zgornjiDel.className = 'kartica-telo';

        // Glava kartice s kategorijo in značko prostih mest
        const glava = document.createElement('div');
        glava.className = 'kartica-glava';

        const kategorijaZnacka = document.createElement('span');
        kategorijaZnacka.className = 'kartica-kategorija';
        kategorijaZnacka.textContent = dejavnost.kategorija;

        const zasedenostZnacka = document.createElement('span');
        zasedenostZnacka.className = 'kartica-zasedenost';

        glava.append(kategorijaZnacka, zasedenostZnacka);

        const naslov = document.createElement('h3');
        naslov.className = 'kartica-naslov';
        naslov.textContent = dejavnost.naslov;

        const opis = document.createElement('p');
        opis.className = 'kartica-opis';
        opis.textContent = dejavnost.opis;

        // Podrobnosti termina in lokacije
        const podrobnosti = document.createElement('dl');
        podrobnosti.className = 'kartica-podrobnosti';

        const vrsticaTermin = document.createElement('div');
        vrsticaTermin.className = 'kartica-meta-vrstica';
        const oznakaTermin = document.createElement('dt');
        oznakaTermin.className = 'kartica-meta-oznaka';
        oznakaTermin.append(ustvariIkonoSvg('termin'));
        const tekstOznakeTermin = document.createElement('span');
        tekstOznakeTermin.textContent = 'Termin:';
        oznakaTermin.append(tekstOznakeTermin);
        const vrednostTermin = document.createElement('dd');
        vrednostTermin.className = 'kartica-meta-vrednost';
        vrednostTermin.textContent = dejavnost.termin;
        vrsticaTermin.append(oznakaTermin, vrednostTermin);

        const vrsticaLokacija = document.createElement('div');
        vrsticaLokacija.className = 'kartica-meta-vrstica';
        const oznakaLokacija = document.createElement('dt');
        oznakaLokacija.className = 'kartica-meta-oznaka';
        oznakaLokacija.append(ustvariIkonoSvg('lokacija'));
        const tekstOznakeLokacija = document.createElement('span');
        tekstOznakeLokacija.textContent = 'Lokacija:';
        oznakaLokacija.append(tekstOznakeLokacija);
        const vrednostLokacija = document.createElement('dd');
        vrednostLokacija.className = 'kartica-meta-vrednost';
        vrednostLokacija.textContent = dejavnost.lokacija;
        vrsticaLokacija.append(oznakaLokacija, vrednostLokacija);

        podrobnosti.append(vrsticaTermin, vrsticaLokacija);
        zgornjiDel.append(glava, naslov, opis, podrobnosti);

        // Noga kartice z gumbom za rezervacijo in potrditvenim sporočilom
        const noga = document.createElement('div');
        noga.className = 'kartica-noga';

        const gumbRezerviraj = document.createElement('button');
        gumbRezerviraj.type = 'button';
        gumbRezerviraj.className = 'gumb-rezerviraj';
        gumbRezerviraj.addEventListener('click', () => {
            obdelajRezervacijo(dejavnost, kartica);
        });

        const potrdilo = document.createElement('p');
        potrdilo.className = 'kartica-potrditev';
        potrdilo.setAttribute('aria-live', 'polite');
        potrdilo.hidden = true;

        noga.append(gumbRezerviraj, potrdilo);
        kartica.append(zgornjiDel, noga);

        osveziStanjeKartice(kartica, dejavnost, false);
        return kartica;
    }

    //**********************************************************
    // Izriše prazno stanje, kadar nobena dejavnost ne ustreza *
    //**********************************************************
    function ustvariPraznoStanje() {
        const prazenOkvir = document.createElement('div');
        prazenOkvir.className = 'dejavnosti-prazno';

        const sporocilo = document.createElement('p');
        sporocilo.className = 'dejavnosti-prazno-tekst';
        sporocilo.textContent =
            'Za izbrano kombinacijo kategorije in filtrov trenutno ni razpoložljivih dogodkov.';

        const gumbPrikaziVse = document.createElement('button');
        gumbPrikaziVse.type = 'button';
        gumbPrikaziVse.className = 'gumb-sekundarni';
        gumbPrikaziVse.textContent = 'Prikaži vse dogodke';
        gumbPrikaziVse.addEventListener('click', () => {
            pocistiCakajoceTimerje();
            stanje.aktivnaKategorija = 'Vse';
            stanje.samoProstaMesta = false;
            posodobiAktivnostFiltrov();
            izrisiMrezoKartic();
        });

        prazenOkvir.append(sporocilo, gumbPrikaziVse);
        return prazenOkvir;
    }

    //**********************************************************
    // Izriše kartice v mrežo in osveži števec prikazov       *
    //**********************************************************
    function izrisiMrezoKartic() {
        if (!elementi.mrezaKartic) {
            return;
        }

        const vidne = pridobiFiltriraneDejavnosti();
        elementi.mrezaKartic.replaceChildren();

        if (vidne.length === 0) {
            elementi.mrezaKartic.classList.add('je-prazno');
            elementi.mrezaKartic.append(ustvariPraznoStanje());
        } else {
            elementi.mrezaKartic.classList.remove('je-prazno');
            vidne.forEach((dejavnost, indeks) => {
                elementi.mrezaKartic.append(ustvariKartico(dejavnost, indeks));
            });
        }

        posodobiStevecPrikaza(vidne.length);
    }

    //**********************************************************
    // Ustvari orodno vrstico z gumbi kategorij in kontrolami  *
    //**********************************************************
    function ustvariOrodnoVrstico() {
        const orodnaVrstica = document.createElement('div');
        orodnaVrstica.className = 'dejavnosti-orodna-vrstica';

        const kategorijeSkupina = document.createElement('div');
        kategorijeSkupina.className = 'filtri-kategorije';
        kategorijeSkupina.setAttribute('role', 'group');
        kategorijeSkupina.setAttribute('aria-label', 'Filtriranje po kategoriji');

        pridobiKategorije().forEach((kategorija) => {
            const gumb = document.createElement('button');
            gumb.type = 'button';
            gumb.className = 'gumb-kategorija';
            gumb.dataset.kategorija = kategorija;
            gumb.textContent = kategorija;
            gumb.addEventListener('click', () => {
                if (stanje.aktivnaKategorija === kategorija) {
                    return;
                }
                pocistiCakajoceTimerje();
                stanje.aktivnaKategorija = kategorija;
                posodobiAktivnostFiltrov();
                izrisiMrezoKartic();
            });
            kategorijeSkupina.append(gumb);
        });

        const akcijeSkupina = document.createElement('div');
        akcijeSkupina.className = 'filtri-akcije';
        akcijeSkupina.setAttribute('role', 'group');
        akcijeSkupina.setAttribute('aria-label', 'Dodatni filtri in ponastavitev');

        const gumbSamoProsta = document.createElement('button');
        gumbSamoProsta.type = 'button';
        gumbSamoProsta.className = 'gumb-prosta-mesta';
        gumbSamoProsta.textContent = 'Samo prosta mesta';
        gumbSamoProsta.addEventListener('click', () => {
            pocistiCakajoceTimerje();
            stanje.samoProstaMesta = !stanje.samoProstaMesta;
            posodobiAktivnostFiltrov();
            izrisiMrezoKartic();
        });

        const gumbPonastavi = document.createElement('button');
        gumbPonastavi.type = 'button';
        gumbPonastavi.className = 'gumb-ponastavi';
        gumbPonastavi.textContent = 'Ponastavi prosta mesta';
        gumbPonastavi.addEventListener('click', () => {
            pocistiCakajoceTimerje();
            ponastaviZacetnoStanjeMest();
            izrisiMrezoKartic();
            posodobiGlavnoObvestilo(
                'Prosta mesta so bila ponastavljena na začetno stanje.',
                'ponastavitev'
            );
        });

        akcijeSkupina.append(gumbSamoProsta, gumbPonastavi);
        orodnaVrstica.append(kategorijeSkupina, akcijeSkupina);

        elementi.kategorijeSkupina = kategorijeSkupina;
        elementi.gumbSamoProsta = gumbSamoProsta;
        elementi.gumbPonastavi = gumbPonastavi;

        return orodnaVrstica;
    }

    //**********************************************************
    // Ustvari celotno zgradbo razdelka #dejavnosti-vsebnik   *
    //**********************************************************
    function zgradiVmesnik() {
        const vsebnik = document.getElementById('dejavnosti-vsebnik');
        if (!vsebnik) {
            return;
        }

        elementi.vsebnik = vsebnik;
        vsebnik.replaceChildren();

        const orodnaVrstica = ustvariOrodnoVrstico();

        const povzetekVrstica = document.createElement('div');
        povzetekVrstica.className = 'dejavnosti-povzetek-vrstica';

        const stevec = document.createElement('p');
        stevec.className = 'dejavnosti-stevec';
        stevec.setAttribute('aria-live', 'polite');

        const obvestilo = document.createElement('div');
        obvestilo.className = 'dejavnosti-obvestilo';
        obvestilo.setAttribute('role', 'status');
        obvestilo.setAttribute('aria-live', 'polite');
        obvestilo.hidden = true;

        povzetekVrstica.append(stevec, obvestilo);

        const mreza = document.createElement('div');
        mreza.className = 'dejavnosti-mreza';

        elementi.stevecPrikaza = stevec;
        elementi.obvestiloTrak = obvestilo;
        elementi.mrezaKartic = mreza;

        vsebnik.append(orodnaVrstica, povzetekVrstica, mreza);

        ponastaviZacetnoStanjeMest();
        posodobiAktivnostFiltrov();
        izrisiMrezoKartic();
    }

    //**********************************************************
    // Zagon skripte ob pripravljenem dokumentu DOM            *
    //**********************************************************
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', zgradiVmesnik);
    } else {
        zgradiVmesnik();
    }
})();
