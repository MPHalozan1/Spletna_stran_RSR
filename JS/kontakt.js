//**********************************************************
// Interaktivna validacija in povratni odziv kontaktnega   *
// obrazca za podstran Kontakt (JS/kontakt.js)             *
// Projekt: Modelarska sekcija Aerokluba Ptuj - RC Letala  *
//**********************************************************

(() => {
    'use strict';

    const MIN_DOLZINA_SPOROCILA = 15;
    const MAX_DOLZINA_SPOROCILA = 1000;
    const MAKS_PREDOGLED_ZNAKOV = 180;
    const CILJNI_EPOSTNI_NASLOV = 'modelarji@letalisce-ptuj.si';
    const VZOREC_EPOSTE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const VZOREC_TELEFONA = /^[0-9+\s\-]{8,15}$/;

    //**********************************************************
    // Zazna uporabnikovo nastavitev za zmanjšano gibanje      *
    //**********************************************************
    function aliZmanjsanoGibanje() {
        return Boolean(
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
    }

    //**********************************************************
    // Varnostno pomakne pogled do izbranega elementa          *
    //**********************************************************
    function pomakniNaElement(element, polozaj) {
        if (!element || typeof element.scrollIntoView !== 'function') {
            return;
        }
        element.scrollIntoView({
            behavior: aliZmanjsanoGibanje() ? 'auto' : 'smooth',
            block: polozaj || 'center'
        });
    }

    //**********************************************************
    // Pravilna slovenska sklanjatev števila manjkajočih znakov*
    //**********************************************************
    function oblikujManjkajoceZnake(stevilo) {
        const ostanekSto = stevilo % 100;
        if (ostanekSto === 1) {
            return 'manjka še 1 znak';
        }
        if (ostanekSto === 2) {
            return 'manjkata še 2 znaka';
        }
        if (ostanekSto === 3 || ostanekSto === 4) {
            return `manjkajo še ${stevilo} znake`;
        }
        return `manjka še ${stevilo} znakov`;
    }

    //**********************************************************
    // Pravilna slovenska sklanjatev za število spornih polj   *
    //**********************************************************
    function oblikujSteviloNapacnihPolj(stevilo) {
        const ostanekSto = stevilo % 100;
        if (ostanekSto === 1) {
            return '1 polje potrebuje popravek';
        }
        if (ostanekSto === 2) {
            return '2 polji potrebujeta popravek';
        }
        if (ostanekSto === 3 || ostanekSto === 4) {
            return `${stevilo} polja potrebujejo popravek`;
        }
        return `${stevilo} polj potrebuje popravek`;
    }

    //**********************************************************
    // Preveri obvezno polje za ime in priimek (3-60 znakov)   *
    //**********************************************************
    function validirajImePriimek(vrednost) {
        const obrezano = vrednost.trim();
        if (obrezano.length === 0) {
            return 'Prosimo, vpišite svoje ime in priimek.';
        }
        if (obrezano.length < 3) {
            return 'Ime in priimek morata vsebovati vsaj 3 znake.';
        }
        if (obrezano.length > 60) {
            return 'Ime in priimek lahko vsebujeta največ 60 znakov.';
        }
        return '';
    }

    //**********************************************************
    // Preveri obvezno polje za veljaven e-poštni naslov       *
    //**********************************************************
    function validirajEposto(vrednost) {
        const obrezano = vrednost.trim();
        if (obrezano.length === 0) {
            return 'Prosimo, vpišite svoj e-poštni naslov.';
        }
        const deli = obrezano.split('@');
        const jeVeljaven = VZOREC_EPOSTE.test(obrezano) &&
            deli.length === 2 &&
            deli[0].length <= 64 &&
            !deli[0].startsWith('.') &&
            !deli[0].endsWith('.') &&
            !deli[1].startsWith('.') &&
            !deli[1].startsWith('-') &&
            !deli[1].endsWith('-') &&
            !obrezano.includes('..');

        if (!jeVeljaven) {
            return 'Vnesite veljaven e-poštni naslov (npr. ime@domena.si).';
        }
        return '';
    }

    //**********************************************************
    // Preveri neobvezno telefonsko številko (zapis in števke) *
    //**********************************************************
    function validirajTelefon(vrednost) {
        const obrezano = vrednost.trim();
        if (obrezano.length === 0) {
            return '';
        }
        if (/[^0-9+\s\-]/.test(obrezano)) {
            return 'Telefonska številka sme vsebovati le števke, presledke, znak + ali vezaj (-).';
        }
        if (!VZOREC_TELEFONA.test(obrezano)) {
            return 'Telefonska številka mora imeti med 8 in 15 znaki (npr. 041 123 456).';
        }
        const najdeneStevke = obrezano.match(/\d/g);
        if (!najdeneStevke || najdeneStevke.length < 8) {
            return 'Telefonska številka mora vsebovati vsaj 8 števk (npr. 041 123 456).';
        }
        return '';
    }

    //**********************************************************
    // Preveri obvezno izbiro razloga za stik                  *
    //**********************************************************
    function validirajRazlog(vrednost) {
        if (!vrednost || vrednost.trim() === '') {
            return 'Prosimo, izberite razlog za stik.';
        }
        return '';
    }

    //**********************************************************
    // Preveri obvezno sporočilo (15-1000 znakov po obrezu)    *
    //**********************************************************
    function validirajSporocilo(vrednost) {
        const obrezano = vrednost.trim();
        if (obrezano.length === 0) {
            return 'Prosimo, vpišite svoje sporočilo ali vprašanje.';
        }
        if (obrezano.length < MIN_DOLZINA_SPOROCILA) {
            return `Sporočilo mora po odstranitvi odvečnih presledkov vsebovati vsaj ${MIN_DOLZINA_SPOROCILA} znakov.`;
        }
        if (obrezano.length > MAX_DOLZINA_SPOROCILA) {
            return `Sporočilo lahko vsebuje največ ${MAX_DOLZINA_SPOROCILA} znakov.`;
        }
        return '';
    }

    //**********************************************************
    // Preveri obvezno potrditev soglasja za obdelavo podatkov *
    //**********************************************************
    function validirajSoglasje(polje) {
        if (!polje.checked) {
            return 'Za oddajo obrazca morate potrditi soglasje za obdelavo podatkov.';
        }
        return '';
    }

    //**********************************************************
    // Pripravi kratek predogled sporočila brez sekanja besed  *
    //**********************************************************
    function ustvariPredogledSporocila(besedilo) {
        const cisto = besedilo.trim().replace(/\s+/g, ' ');
        if (cisto.length <= MAKS_PREDOGLED_ZNAKOV) {
            return cisto;
        }
        const rezano = cisto.slice(0, MAKS_PREDOGLED_ZNAKOV);
        const zadnjiPresledek = rezano.lastIndexOf(' ');
        const koncniRez = zadnjiPresledek > 100 ? rezano.slice(0, zadnjiPresledek) : rezano;
        return `${koncniRez} …`;
    }

    //**********************************************************
    // Sestavi povezavo mailto s predizpolnjeno zadevo in      *
    // vsebino sporočila za e-poštni odjemalec uporabnika      *
    //**********************************************************
    function sestaviMailtoPovezavo(podatki) {
        const zadeva = `[RC Modelarstvo Ptuj] ${podatki.razlogTekst} – ${podatki.imePriimek}`;
        const vrstice = [
            'Pozdravljeni,',
            '',
            'prek spletnega kontaktnega obrazca vam pošiljam naslednje povpraševanje:',
            '',
            `Ime in priimek: ${podatki.imePriimek}`,
            `E-poštni naslov: ${podatki.eposta}`
        ];

        if (podatki.telefon) {
            vrstice.push(`Telefonska številka: ${podatki.telefon}`);
        }

        vrstice.push(
            `Razlog za stik: ${podatki.razlogTekst}`,
            `Dosedanje izkušnje: ${podatki.izkusnjeTekst}`,
            '',
            'Sporočilo:',
            podatki.sporocilo
        );

        const parametri = `subject=${encodeURIComponent(zadeva)}&body=${encodeURIComponent(vrstice.join('\n'))}`;
        return `mailto:${CILJNI_EPOSTNI_NASLOV}?${parametri}`;
    }

    //**********************************************************
    // Glavna inicializacija interaktivnega kontaktnega obrazca*
    //**********************************************************
    function inicializirajKontaktniObrazec() {
        const obrazec = document.getElementById('glavni-kontaktni-obrazec');
        const povratna = document.getElementById('obrazec-povratna');
        const sporociloPolje = document.getElementById('sporocilo');

        if (!obrazec || !povratna || !sporociloPolje) {
            return;
        }

        // Dinamično vklopi novalidate, da brez JS deluje privzeto preverjanje brskalnika
        obrazec.setAttribute('novalidate', '');

        // Ustvari in vstavi števec znakov neposredno pod polje za sporočilo
        const stevecSporocila = document.createElement('span');
        stevecSporocila.id = 'stevec-sporocila';
        stevecSporocila.className = 'stevec-znakov';
        stevecSporocila.setAttribute('aria-live', 'polite');
        sporociloPolje.insertAdjacentElement('afterend', stevecSporocila);
        sporociloPolje.setAttribute('aria-describedby', stevecSporocila.id);

        // Enotna definicija vseh preverjanih polj v vrstnem redu obrazca
        const poljaSpec = [
            {
                id: 'ime-priimek',
                naziv: 'Ime in priimek',
                element: document.getElementById('ime-priimek'),
                dogodek: 'input',
                validiraj: (el) => validirajImePriimek(el.value),
                neobvezno: false,
                stevecId: ''
            },
            {
                id: 'eposta',
                naziv: 'E-poštni naslov',
                element: document.getElementById('eposta'),
                dogodek: 'input',
                validiraj: (el) => validirajEposto(el.value),
                neobvezno: false,
                stevecId: ''
            },
            {
                id: 'telefon',
                naziv: 'Telefonska številka',
                element: document.getElementById('telefon'),
                dogodek: 'input',
                validiraj: (el) => validirajTelefon(el.value),
                neobvezno: true,
                stevecId: ''
            },
            {
                id: 'razlog-stika',
                naziv: 'Razlog za stik',
                element: document.getElementById('razlog-stika'),
                dogodek: 'change',
                validiraj: (el) => validirajRazlog(el.value),
                neobvezno: false,
                stevecId: ''
            },
            {
                id: 'sporocilo',
                naziv: 'Sporočilo ali vprašanje',
                element: sporociloPolje,
                dogodek: 'input',
                validiraj: (el) => validirajSporocilo(el.value),
                neobvezno: false,
                stevecId: stevecSporocila.id,
                vstavnoSidro: stevecSporocila
            },
            {
                id: 'soglasje',
                naziv: 'Soglasje za obdelavo podatkov',
                element: document.getElementById('soglasje'),
                dogodek: 'change',
                validiraj: (el) => validirajSoglasje(el),
                neobvezno: false,
                stevecId: '',
                ovojSelektor: '.izbira-vrstica'
            }
        ].filter((spec) => Boolean(spec.element));

        const dotaknjenaPolja = new Set();
        let poskusOddaje = false;

        //**********************************************************
        // Posodobi prikaz števca znakov in vizualni namig >= 15  *
        //**********************************************************
        function posodobiStevecSporocila() {
            const vrednost = sporociloPolje.value || '';
            const surovaDolzina = vrednost.length;
            const obrezanaDolzina = vrednost.trim().length;

            stevecSporocila.classList.remove('stevec-veljaven', 'stevec-presezen');

            if (obrezanaDolzina > MAX_DOLZINA_SPOROCILA) {
                stevecSporocila.classList.add('stevec-presezen');
                stevecSporocila.textContent = `${obrezanaDolzina} / ${MAX_DOLZINA_SPOROCILA} znakov (presežena omejitev)`;
                return;
            }

            if (obrezanaDolzina >= MIN_DOLZINA_SPOROCILA) {
                stevecSporocila.classList.add('stevec-veljaven');
                stevecSporocila.textContent = `\u2713 ${surovaDolzina} / ${MAX_DOLZINA_SPOROCILA} znakov (zadostna dolžina)`;
                return;
            }

            if (surovaDolzina === 0) {
                stevecSporocila.textContent = `0 / ${MAX_DOLZINA_SPOROCILA} znakov (najmanj ${MIN_DOLZINA_SPOROCILA})`;
                return;
            }

            if (obrezanaDolzina === 0) {
                stevecSporocila.textContent = `0 / ${MAX_DOLZINA_SPOROCILA} znakov (najmanj ${MIN_DOLZINA_SPOROCILA} – samo presledki ne zadoščajo)`;
                return;
            }

            const manjka = MIN_DOLZINA_SPOROCILA - obrezanaDolzina;
            const prikazanaDolzina = surovaDolzina >= MIN_DOLZINA_SPOROCILA ? obrezanaDolzina : surovaDolzina;
            stevecSporocila.textContent = `${prikazanaDolzina} / ${MAX_DOLZINA_SPOROCILA} znakov (${oblikujManjkajoceZnake(manjka)})`;
        }

        //**********************************************************
        // Vrne vizualni element za rob in stanje polja           *
        //**********************************************************
        function pridobiVizualniOvoj(spec) {
            if (spec.ovojSelektor) {
                return spec.element.closest(spec.ovojSelektor) || spec.element;
            }
            return spec.element;
        }

        //**********************************************************
        // Vrne referenčni element, pod katerega sodi opis napake  *
        //**********************************************************
        function pridobiSidroNapake(spec) {
            if (spec.vstavnoSidro) {
                return spec.vstavnoSidro;
            }
            if (spec.ovojSelektor) {
                return spec.element.closest(spec.ovojSelektor) || spec.element;
            }
            return spec.element;
        }

        //**********************************************************
        // Uporabi ali počisti napako ter ARIA atribute polja      *
        //**********************************************************
        function nastaviStanjePolja(spec, sporociloNapake, pokaziVeljavno) {
            const napakaId = `napaka-${spec.id}`;
            const vizualniOvoj = pridobiVizualniOvoj(spec);
            const obstojecaNapaka = document.getElementById(napakaId);

            if (sporociloNapake) {
                spec.element.setAttribute('aria-invalid', 'true');
                vizualniOvoj.classList.add('polje-napaka');
                vizualniOvoj.classList.remove('polje-veljavno');

                const napakaElement = obstojecaNapaka || document.createElement('span');
                napakaElement.id = napakaId;
                napakaElement.className = 'sporocilo-napake';
                napakaElement.setAttribute('role', 'alert');
                napakaElement.textContent = sporociloNapake;

                if (!obstojecaNapaka) {
                    const sidro = pridobiSidroNapake(spec);
                    sidro.insertAdjacentElement('afterend', napakaElement);
                }

                const opisniki = [napakaId];
                if (spec.stevecId) {
                    opisniki.push(spec.stevecId);
                }
                spec.element.setAttribute('aria-describedby', opisniki.join(' '));
                return;
            }

            spec.element.removeAttribute('aria-invalid');
            vizualniOvoj.classList.remove('polje-napaka');

            if (obstojecaNapaka) {
                obstojecaNapaka.remove();
            }

            if (spec.stevecId) {
                spec.element.setAttribute('aria-describedby', spec.stevecId);
            } else {
                spec.element.removeAttribute('aria-describedby');
            }

            const imaVrednost = spec.element.type === 'checkbox'
                ? spec.element.checked
                : spec.element.value.trim().length > 0;

            if (pokaziVeljavno && (!spec.neobvezno || imaVrednost)) {
                vizualniOvoj.classList.add('polje-veljavno');
            } else {
                vizualniOvoj.classList.remove('polje-veljavno');
            }
        }

        //**********************************************************
        // Preveri posamezno polje in vrne opis napake ali prazen   *
        //**********************************************************
        function preveriPolje(spec, pokaziVeljavno) {
            const napaka = spec.validiraj(spec.element);
            nastaviStanjePolja(spec, napaka, pokaziVeljavno);
            return napaka;
        }

        //**********************************************************
        // Zbere vsa trenutno neveljavna polja brez spreminjanja     *
        //**********************************************************
        function zberiTrenutneNapake() {
            const napake = [];
            poljaSpec.forEach((spec) => {
                const sporocilo = spec.validiraj(spec.element);
                if (sporocilo) {
                    napake.push({ spec, sporocilo });
                }
            });
            return napake;
        }

        //**********************************************************
        // Počisti in skrije zgornji pas za povratne informacije    *
        //**********************************************************
        function pocistiPovratnoPolje() {
            povratna.hidden = true;
            povratna.textContent = '';
            povratna.removeAttribute('tabindex');
        }

        //**********************************************************
        // Ustvari gumb za hiter skok na sporno polje v povzetku   *
        //**********************************************************
        function ustvariElementNapakePovzetka(zapis) {
            const elementSeznama = document.createElement('li');
            elementSeznama.dataset.poljeId = zapis.spec.id;

            const gumbSkok = document.createElement('button');
            gumbSkok.type = 'button';
            gumbSkok.className = 'povratna-skok-gumb';
            gumbSkok.textContent = `${zapis.spec.naziv}: ${zapis.sporocilo}`;
            gumbSkok.addEventListener('click', () => {
                pomakniNaElement(zapis.spec.element, 'center');
                zapis.spec.element.focus({ preventScroll: true });
            });

            elementSeznama.appendChild(gumbSkok);
            return elementSeznama;
        }

        //**********************************************************
        // Prikaže ali posodobi zgornji povzetek napak brez        *
        // nepotrebnega uničevanja obstoječih gumbov v DOM         *
        //**********************************************************
        function prikaziPovzetekNapak(napake) {
            const naslovTekst = `Obrazca ni bilo mogoče oddati: ${oblikujSteviloNapacnihPolj(napake.length)}.`;
            let kartica = povratna.querySelector('.povratna-napake');

            if (!kartica) {
                povratna.textContent = '';
                povratna.hidden = false;
                povratna.removeAttribute('tabindex');

                kartica = document.createElement('div');
                kartica.className = 'povratna-kartica povratna-napake';

                const naslov = document.createElement('h3');
                naslov.className = 'povratna-naslov';
                naslov.textContent = naslovTekst;
                kartica.appendChild(naslov);

                const opis = document.createElement('p');
                opis.className = 'povratna-opis';
                opis.textContent = 'Prosimo, preverite in popravite označena polja spodaj:';
                kartica.appendChild(opis);

                const seznam = document.createElement('ul');
                seznam.className = 'povratna-seznam-napak';
                napake.forEach((zapis) => {
                    seznam.appendChild(ustvariElementNapakePovzetka(zapis));
                });

                kartica.appendChild(seznam);
                povratna.appendChild(kartica);
                return;
            }

            const naslovEl = kartica.querySelector('.povratna-naslov');
            if (naslovEl && naslovEl.textContent !== naslovTekst) {
                naslovEl.textContent = naslovTekst;
            }

            const seznam = kartica.querySelector('.povratna-seznam-napak');
            if (!seznam) {
                return;
            }

            const aktivniIdji = new Set(napake.map((zapis) => zapis.spec.id));
            Array.from(seznam.children).forEach((vrstica) => {
                if (!aktivniIdji.has(vrstica.dataset.poljeId)) {
                    vrstica.remove();
                }
            });

            napake.forEach((zapis, indeks) => {
                let vrstica = seznam.querySelector(`li[data-polje-id="${zapis.spec.id}"]`);
                const novTekst = `${zapis.spec.naziv}: ${zapis.sporocilo}`;
                if (!vrstica) {
                    vrstica = ustvariElementNapakePovzetka(zapis);
                    const referenca = seznam.children[indeks] || null;
                    seznam.insertBefore(vrstica, referenca);
                    return;
                }
                const gumb = vrstica.querySelector('.povratna-skok-gumb');
                if (gumb && gumb.textContent !== novTekst) {
                    gumb.textContent = novTekst;
                }
            });
        }

        //**********************************************************
        // Doda vrstico podatka v strukturiran povzetek oddaje     *
        //**********************************************************
        function dodajVrsticoPovzetka(seznamDl, oznaka, vrednost) {
            const termin = document.createElement('dt');
            termin.className = 'povzetek-oznaka';
            termin.textContent = oznaka;

            const opis = document.createElement('dd');
            opis.className = 'povzetek-vrednost';
            opis.textContent = vrednost;

            seznamDl.appendChild(termin);
            seznamDl.appendChild(opis);
        }

        //**********************************************************
        // Zbere veljavne podatke iz obrazca za prikaz povzetka     *
        //**********************************************************
        function preberiPodatkeObrazca() {
            const razlogSelect = document.getElementById('razlog-stika');
            const izbranaOpcija = razlogSelect && razlogSelect.selectedIndex >= 0
                ? razlogSelect.options[razlogSelect.selectedIndex]
                : null;
            const izkusnjeRadio = obrazec.querySelector('input[name="izkusnje"]:checked');
            const izkusnjeOvoj = izkusnjeRadio ? izkusnjeRadio.closest('label') : null;
            const izkusnjeSpan = izkusnjeOvoj ? izkusnjeOvoj.querySelector('span') : null;
            const izkusnjeOznaka = izkusnjeSpan ? izkusnjeSpan.textContent.trim() : '';

            return {
                imePriimek: document.getElementById('ime-priimek').value.trim(),
                eposta: document.getElementById('eposta').value.trim(),
                telefon: document.getElementById('telefon').value.trim(),
                razlogTekst: izbranaOpcija ? izbranaOpcija.textContent.trim() : '',
                izkusnjeTekst: izkusnjeOznaka || 'Popoln začetnik (brez izkušenj)',
                sporocilo: sporociloPolje.value.trim()
            };
        }

        //**********************************************************
        // Prikaže potrditveno kartico z oddanimi podatki in        *
        // povezavo za odprtje v e-poštnem odjemalcu                *
        //**********************************************************
        function prikaziPotrditvenoKartico(podatki) {
            povratna.textContent = '';
            povratna.hidden = false;
            povratna.setAttribute('tabindex', '-1');

            const kartica = document.createElement('div');
            kartica.className = 'povratna-kartica povratna-uspeh';
            kartica.setAttribute('role', 'status');

            const glava = document.createElement('div');
            glava.className = 'povratna-glava';

            const znacka = document.createElement('span');
            znacka.className = 'povratna-znacka-uspeh';
            znacka.textContent = '\u2713 Vnos je preverjen';

            const naslov = document.createElement('h3');
            naslov.className = 'povratna-naslov';
            naslov.textContent = 'Vaše sporočilo je pripravljeno za pošiljanje';

            glava.appendChild(znacka);
            glava.appendChild(naslov);
            kartica.appendChild(glava);

            const opomba = document.createElement('p');
            opomba.className = 'povratna-opomba';
            opomba.textContent = 'Obrazec deluje neposredno v brskalniku brez pošiljanja na strežnik. Spodnji povzetek lahko z enim klikom prenesete v svoj e-poštni odjemalec.';
            kartica.appendChild(opomba);

            const povzetek = document.createElement('dl');
            povzetek.className = 'povzetek-podatkov';

            dodajVrsticoPovzetka(povzetek, 'Ime in priimek', podatki.imePriimek);
            dodajVrsticoPovzetka(povzetek, 'E-pošta', podatki.eposta);
            if (podatki.telefon) {
                dodajVrsticoPovzetka(povzetek, 'Telefon', podatki.telefon);
            }
            dodajVrsticoPovzetka(povzetek, 'Razlog za stik', podatki.razlogTekst);
            dodajVrsticoPovzetka(povzetek, 'Raven izkušenj', podatki.izkusnjeTekst);
            dodajVrsticoPovzetka(povzetek, 'Predogled sporočila', ustvariPredogledSporocila(podatki.sporocilo));

            kartica.appendChild(povzetek);

            const akcije = document.createElement('div');
            akcije.className = 'povratna-akcije';

            const povezavaMailto = document.createElement('a');
            povezavaMailto.className = 'gumb-primarni gumb-mailto';
            povezavaMailto.href = sestaviMailtoPovezavo(podatki);
            povezavaMailto.textContent = 'Odpri sporočilo v e-poštnem odjemalcu';

            const gumbNovo = document.createElement('button');
            gumbNovo.type = 'button';
            gumbNovo.className = 'gumb-sekundarni gumb-novo-sporocilo';
            gumbNovo.textContent = 'Pošlji novo sporočilo';
            gumbNovo.addEventListener('click', () => {
                obrazec.reset();
                const imePolje = document.getElementById('ime-priimek');
                if (imePolje) {
                    pomakniNaElement(imePolje, 'center');
                    imePolje.focus({ preventScroll: true });
                }
            });

            akcije.appendChild(povezavaMailto);
            akcije.appendChild(gumbNovo);
            kartica.appendChild(akcije);

            povratna.appendChild(kartica);
            pomakniNaElement(povratna, 'nearest');
            povratna.focus({ preventScroll: true });
        }

        //**********************************************************
        // Osveži zgornji pas napak ob sprotno popravljenem vnosu    *
        //**********************************************************
        function osveziAktivniPasNapak() {
            if (!poskusOddaje || !povratna.querySelector('.povratna-napake')) {
                return;
            }
            const preostale = zberiTrenutneNapake();
            if (preostale.length === 0) {
                pocistiPovratnoPolje();
                return;
            }
            prikaziPovzetekNapak(preostale);
        }

        // Poveže poslušalce za sprotno štetje znakov in sprotno validacijo
        poljaSpec.forEach((spec) => {
            spec.element.addEventListener(spec.dogodek, () => {
                if (spec.id === 'sporocilo') {
                    posodobiStevecSporocila();
                }

                if (spec.dogodek === 'change') {
                    dotaknjenaPolja.add(spec.id);
                }

                if (poskusOddaje || dotaknjenaPolja.has(spec.id)) {
                    preveriPolje(spec, true);
                    osveziAktivniPasNapak();
                }
            });

            spec.element.addEventListener('blur', (dogodek) => {
                if (dogodek.relatedTarget && dogodek.relatedTarget.id === 'gumb-pocisti') {
                    return;
                }
                dotaknjenaPolja.add(spec.id);
                preveriPolje(spec, true);
                if (dogodek.relatedTarget && dogodek.relatedTarget.classList.contains('povratna-skok-gumb')) {
                    window.setTimeout(osveziAktivniPasNapak, 0);
                    return;
                }
                osveziAktivniPasNapak();
            });
        });

        // Obravnava oddaje obrazca brez osvežitve strani
        obrazec.addEventListener('submit', (dogodek) => {
            dogodek.preventDefault();
            poskusOddaje = true;

            const neveljavnaPolja = [];
            poljaSpec.forEach((spec) => {
                dotaknjenaPolja.add(spec.id);
                const napaka = preveriPolje(spec, true);
                if (napaka) {
                    neveljavnaPolja.push({ spec, sporocilo: napaka });
                }
            });

            if (neveljavnaPolja.length > 0) {
                prikaziPovzetekNapak(neveljavnaPolja);
                const prvoPolje = neveljavnaPolja[0].spec.element;
                pomakniNaElement(prvoPolje, 'center');
                prvoPolje.focus({ preventScroll: true });
                return;
            }

            const podatki = preberiPodatkeObrazca();
            prikaziPotrditvenoKartico(podatki);
        });

        // Čista ponastavitev vseh napak, števca in potrditvene kartice
        obrazec.addEventListener('reset', () => {
            poskusOddaje = false;
            dotaknjenaPolja.clear();

            poljaSpec.forEach((spec) => {
                nastaviStanjePolja(spec, '', false);
            });

            pocistiPovratnoPolje();

            stevecSporocila.classList.remove('stevec-veljaven', 'stevec-presezen');
            stevecSporocila.textContent = `0 / ${MAX_DOLZINA_SPOROCILA} znakov (najmanj ${MIN_DOLZINA_SPOROCILA})`;

            window.setTimeout(() => {
                posodobiStevecSporocila();
            }, 0);
        });

        // Začetna uskladitev števca ob nalaganju strani (npr. ob ohranjenem vnosu)
        posodobiStevecSporocila();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializirajKontaktniObrazec);
    } else {
        inicializirajKontaktniObrazec();
    }
})();
