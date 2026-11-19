//**********************************************************
// Interaktivni kalkulator jadralnega doleta                *
// Datoteka: JS/informacije.js                             *
// Podstran: Praktične informacije in urnik                *
//**********************************************************

(function () {
    'use strict';

    //**********************************************************
    // Prednastavljeni tipi zrakoplovov z realističnimi        *
    // drsalnimi razmerji (L/D) in potovalnimi hitrostmi       *
    //**********************************************************
    const PREDNASTAVLJENI_ZRAKOPLOVI = [
        {
            id: 'rc-f5j',
            naziv: 'RC jadralec (F5J)',
            finesa: 20,
            hitrostKmh: 42,
            priporocenaVisina: 300,
            opis: 'Lahki tekmovalni model'
        },
        {
            id: 'solsko',
            naziv: 'Šolsko jadralno letalo',
            finesa: 30,
            hitrostKmh: 85,
            priporocenaVisina: 1000,
            opis: 'Stabilno šolsko letalo'
        },
        {
            id: 'klubsko',
            naziv: 'Klubsko jadralno letalo',
            finesa: 40,
            hitrostKmh: 95,
            priporocenaVisina: 1200,
            opis: 'Klubski razred'
        },
        {
            id: 'tekmovalno',
            naziv: 'Tekmovalno jadralno letalo',
            finesa: 52,
            hitrostKmh: 110,
            priporocenaVisina: 1500,
            opis: 'Visokozmogljivi jadralnik'
        }
    ];

    const PRIVZETA_VISINA_M = 1000;
    const PRIVZETA_FINESA = 30;
    const PRIVZETI_PRESET_ID = 'solsko';
    const VARNOSTNA_REZERVA_DELEZ = 0.70;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    //**********************************************************
    // Omejitev vrednosti med spodnjo in zgornjo mejo (clamp)  *
    //**********************************************************
    function omeji(vrednost, min, max) {
        return Math.min(max, Math.max(min, vrednost));
    }

    //**********************************************************
    // Izračun predvidene hitrosti drsenja iz ročne finese     *
    //**********************************************************
    function oceniHitrostIzFinese(finesa) {
        return omeji(25 + finesa * 1.75, 38, 125);
    }

    //**********************************************************
    // Oblikovanje števil po slovenskih pravopisnih pravilih   *
    // (vejica kot decimalno ločilo)                           *
    //**********************************************************
    function formatirajStevilo(vrednost, minDecimalk, maxDecimalk) {
        const minD = typeof minDecimalk === 'number' ? minDecimalk : 2;
        const maxD = typeof maxDecimalk === 'number' ? maxDecimalk : minD;
        try {
            return new Intl.NumberFormat('sl-SI', {
                minimumFractionDigits: minD,
                maximumFractionDigits: maxD
            }).format(vrednost);
        } catch (napaka) {
            return vrednost.toFixed(maxD).replace('.', ',');
        }
    }

    //**********************************************************
    // Oblikovanje trajanja leta v berljiv slovenski zapis     *
    //**********************************************************
    function formatirajTrajanje(casSekund) {
        if (!Number.isFinite(casSekund) || casSekund <= 0) {
            return '0 s';
        }
        if (casSekund < 1) {
            return '< 1 s';
        }

        const skupnoSekund = Math.round(casSekund);
        if (skupnoSekund < 60) {
            return skupnoSekund + ' s';
        }

        const ure = Math.floor(skupnoSekund / 3600);
        const ostanekPoUrah = skupnoSekund % 3600;
        const minute = Math.floor(ostanekPoUrah / 60);
        const sekunde = ostanekPoUrah % 60;
        const sekTekst = String(sekunde).padStart(2, '0');

        if (ure === 0) {
            return minute + ' min ' + sekTekst + ' s';
        }

        const minTekst = String(minute).padStart(2, '0');
        return ure + ' h ' + minTekst + ' min ' + sekTekst + ' s';
    }

    //**********************************************************
    // Branje in preverjanje številske vrednosti iz polja      *
    //**********************************************************
    function preberiSteviloIzPolja(vnosElement) {
        if (!vnosElement) {
            return NaN;
        }
        if (vnosElement.validity && vnosElement.validity.badInput) {
            return NaN;
        }
        const surovo = vnosElement.value.trim().replace(',', '.');
        if (surovo === '') {
            return NaN;
        }
        const stevilo = Number(surovo);
        return Number.isFinite(stevilo) ? stevilo : NaN;
    }

    //**********************************************************
    // Fizikalni izračun parametrov jadralnega doleta          *
    //**********************************************************
    function izracunajParametreDoleta(visinaM, finesa, hitrostKmh) {
        const teoreticniDoletKm = (visinaM * finesa) / 1000;
        const varniDoletKm = teoreticniDoletKm * VARNOSTNA_REZERVA_DELEZ;
        const hitrostMs = hitrostKmh / 3.6;
        const casSekund = (visinaM * finesa) / hitrostMs;
        const hitrostSpuscanjaMs = hitrostMs / finesa;
        const kotDrsenjaStopinje = Math.atan(1 / finesa) * (180 / Math.PI);

        return {
            teoreticniDoletKm: teoreticniDoletKm,
            varniDoletKm: varniDoletKm,
            hitrostKmh: hitrostKmh,
            hitrostMs: hitrostMs,
            casSekund: casSekund,
            hitrostSpuscanjaMs: hitrostSpuscanjaMs,
            kotDrsenjaStopinje: kotDrsenjaStopinje
        };
    }

    //**********************************************************
    // Pomožna funkcija za izdelavo SVG elementov              *
    //**********************************************************
    function ustvariSvgElement(imeOznake, atributi) {
        const element = document.createElementNS(SVG_NS, imeOznake);
        if (atributi) {
            Object.keys(atributi).forEach(function (kljuc) {
                element.setAttribute(kljuc, String(atributi[kljuc]));
            });
        }
        return element;
    }

    //**********************************************************
    // Pomožna funkcija za izdelavo HTML elementov             *
    //**********************************************************
    function ustvariElement(imeOznake, razred, besedilo) {
        const element = document.createElement(imeOznake);
        if (razred) {
            element.className = razred;
        }
        if (typeof besedilo === 'string') {
            element.textContent = besedilo;
        }
        return element;
    }

    //**********************************************************
    // Ponovni zagon CSS animacije tresenja ob napaki          *
    //**********************************************************
    function sproziStresNapake(elementi) {
        elementi.forEach(function (el) {
            if (!el) {
                return;
            }
            el.classList.remove('stres-napaka');
            void el.offsetWidth;
            el.classList.add('stres-napaka');
        });
    }

    //**********************************************************
    // Izgradnja DOM strukture kalkulatorja v                  *
    // elementu #kalkulator-vsebnik                            *
    //**********************************************************
    function ustvariVmesnikKalkulatorja(vsebnik) {
        vsebnik.textContent = '';

        // Prednastavitve vrst zrakoplovov
        const prednastavitveSklop = ustvariElement('div', 'prednastavitve-sklop');
        const prednastavitveOznaka = ustvariElement('p', 'prednastavitve-oznaka', 'Hitra izbira zrakoplova:');
        const prednastavitveSeznam = ustvariElement('div', 'prednastavitve-seznam');
        prednastavitveSeznam.setAttribute('role', 'group');
        prednastavitveSeznam.setAttribute('aria-label', 'Prednastavljeni tipi zrakoplovov');

        const gumbiPresetov = {};
        PREDNASTAVLJENI_ZRAKOPLOVI.forEach(function (preset) {
            const gumb = ustvariElement('button', 'zrakoplov-cip');
            gumb.type = 'button';
            gumb.dataset.presetId = preset.id;
            gumb.setAttribute('aria-pressed', preset.id === PRIVZETI_PRESET_ID ? 'true' : 'false');
            if (preset.id === PRIVZETI_PRESET_ID) {
                gumb.classList.add('aktiven');
            }

            const nazivSpan = ustvariElement('span', 'cip-naziv', preset.naziv);
            const podatekSpan = ustvariElement(
                'span',
                'cip-podatek',
                'L/D ' + preset.finesa + ' · ' + preset.hitrostKmh + ' km/h'
            );
            gumb.appendChild(nazivSpan);
            gumb.appendChild(podatekSpan);
            prednastavitveSeznam.appendChild(gumb);
            gumbiPresetov[preset.id] = gumb;
        });

        prednastavitveSklop.appendChild(prednastavitveOznaka);
        prednastavitveSklop.appendChild(prednastavitveSeznam);

        // Obrazec z vnosnima poljema in gumbom za izračun
        const obrazec = ustvariElement('form', 'kalkulator-obrazec');
        obrazec.id = 'kalkulator-obrazec';
        obrazec.noValidate = true;
        obrazec.setAttribute('aria-label', 'Izračun jadralnega doleta');

        const vnosnaMreza = ustvariElement('div', 'kalkulator-vnosna-mreza');

        // Polje 1: Začetna višina (m)
        const poljeVisinaSklop = ustvariElement('div', 'vnosno-polje-sklop');
        const labelaVisina = ustvariElement('label', 'vnos-labela', 'Začetna višina (m)');
        labelaVisina.setAttribute('for', 'vnos-visina');
        const vnosVisina = ustvariElement('input', 'vnos-stevilo');
        vnosVisina.type = 'number';
        vnosVisina.id = 'vnos-visina';
        vnosVisina.name = 'visina';
        vnosVisina.value = String(PRIVZETA_VISINA_M);
        vnosVisina.min = '1';
        vnosVisina.step = 'any';
        vnosVisina.inputMode = 'decimal';
        vnosVisina.autocomplete = 'off';
        vnosVisina.placeholder = 'npr. 1000';
        vnosVisina.required = true;
        const namigVisina = ustvariElement('span', 'vnos-namig', 'Višina nad terenom ob začetku jadranja');
        poljeVisinaSklop.appendChild(labelaVisina);
        poljeVisinaSklop.appendChild(vnosVisina);
        poljeVisinaSklop.appendChild(namigVisina);

        // Polje 2: Drsalno razmerje / finesa (L/D)
        const poljeFinesaSklop = ustvariElement('div', 'vnosno-polje-sklop');
        const labelaFinesa = ustvariElement('label', 'vnos-labela', 'Drsalno razmerje / finesa (L/D)');
        labelaFinesa.setAttribute('for', 'vnos-finesa');
        const vnosFinesa = ustvariElement('input', 'vnos-stevilo');
        vnosFinesa.type = 'number';
        vnosFinesa.id = 'vnos-finesa';
        vnosFinesa.name = 'finesa';
        vnosFinesa.value = String(PRIVZETA_FINESA);
        vnosFinesa.min = '1';
        vnosFinesa.step = 'any';
        vnosFinesa.inputMode = 'decimal';
        vnosFinesa.autocomplete = 'off';
        vnosFinesa.placeholder = 'npr. 30';
        vnosFinesa.required = true;
        const namigFinesa = ustvariElement('span', 'vnos-namig', 'Koliko metrov naprej preleti na 1 m izgube višine');
        poljeFinesaSklop.appendChild(labelaFinesa);
        poljeFinesaSklop.appendChild(vnosFinesa);
        poljeFinesaSklop.appendChild(namigFinesa);

        // Gumb za oddajo izračuna
        const gumbSklop = ustvariElement('div', 'vnos-gumb-sklop');
        const gumbIzracunaj = ustvariElement('button', 'gumb-primarni', 'Izračunaj dolet');
        gumbIzracunaj.type = 'submit';
        gumbIzracunaj.id = 'gumb-izracunaj';
        gumbSklop.appendChild(gumbIzracunaj);

        vnosnaMreza.appendChild(poljeVisinaSklop);
        vnosnaMreza.appendChild(poljeFinesaSklop);
        vnosnaMreza.appendChild(gumbSklop);
        obrazec.appendChild(vnosnaMreza);

        // Opozorilo ob neveljavnem vnosu
        const napakaOkvir = ustvariElement('div', 'kalkulator-napaka');
        napakaOkvir.id = 'kalkulator-napaka';
        napakaOkvir.setAttribute('role', 'alert');
        napakaOkvir.setAttribute('aria-live', 'assertive');
        napakaOkvir.hidden = true;

        // Sklop rezultatov (metrike + tehnični povzetek + SVG graf)
        const rezultatiSklop = ustvariElement('div', 'kalkulator-rezultati-sklop');
        rezultatiSklop.id = 'kalkulator-rezultati';
        rezultatiSklop.setAttribute('aria-live', 'polite');

        // 3 glavne metrične kartice
        const metrikeMreza = ustvariElement('div', 'metrike-mreza');

        const karticaTeoreticni = ustvariElement('article', 'metrika-kartica metrika-teoreticni');
        const oznakaTeor = ustvariElement('span', 'metrika-oznaka', 'Teoretični dolet');
        const vrednostTeor = ustvariElement('strong', 'metrika-vrednost');
        vrednostTeor.id = 'rezultat-teoreticni-dolet';
        const opisTeor = ustvariElement('span', 'metrika-opis', 'Največji doseg v mirnem zraku brez rezerve');
        karticaTeoreticni.appendChild(oznakaTeor);
        karticaTeoreticni.appendChild(vrednostTeor);
        karticaTeoreticni.appendChild(opisTeor);

        const karticaVarni = ustvariElement('article', 'metrika-kartica metrika-varni');
        const oznakaVarni = ustvariElement('span', 'metrika-oznaka', 'Varni dolet (30 % rezerva)');
        const vrednostVarni = ustvariElement('strong', 'metrika-vrednost');
        vrednostVarni.id = 'rezultat-varni-dolet';
        const opisVarni = ustvariElement('span', 'metrika-opis', 'Priporočena razdalja za varen prihod v šolski krog');
        karticaVarni.appendChild(oznakaVarni);
        karticaVarni.appendChild(vrednostVarni);
        karticaVarni.appendChild(opisVarni);

        const karticaCas = ustvariElement('article', 'metrika-kartica metrika-cas');
        const oznakaCas = ustvariElement('span', 'metrika-oznaka', 'Ocenjeni čas leta');
        const vrednostCas = ustvariElement('strong', 'metrika-vrednost');
        vrednostCas.id = 'rezultat-cas-leta';
        const opisCas = ustvariElement('span', 'metrika-opis', 'Trajanje jadranja v mirnem zraku do dotika');
        karticaCas.appendChild(oznakaCas);
        karticaCas.appendChild(vrednostCas);
        karticaCas.appendChild(opisCas);

        metrikeMreza.appendChild(karticaTeoreticni);
        metrikeMreza.appendChild(karticaVarni);
        metrikeMreza.appendChild(karticaCas);

        // Tehnični povzetek (hitrost, spuščanje, kot drsenja)
        const tehnicniPovzetek = ustvariElement('div', 'tehnicni-povzetek');
        tehnicniPovzetek.id = 'tehnicni-povzetek';

        const poljeHitrost = ustvariElement('div', 'tehnicni-podatek');
        poljeHitrost.appendChild(ustvariElement('span', 'tehnicni-naziv', 'Potovalna hitrost'));
        const vrednostHitrost = ustvariElement('strong', 'tehnicni-vrednost');
        vrednostHitrost.id = 'tehnicni-hitrost';
        poljeHitrost.appendChild(vrednostHitrost);

        const poljeSpuscanje = ustvariElement('div', 'tehnicni-podatek');
        poljeSpuscanje.appendChild(ustvariElement('span', 'tehnicni-naziv', 'Hitrost spuščanja'));
        const vrednostSpuscanje = ustvariElement('strong', 'tehnicni-vrednost');
        vrednostSpuscanje.id = 'tehnicni-spuscanje';
        poljeSpuscanje.appendChild(vrednostSpuscanje);

        const poljeKot = ustvariElement('div', 'tehnicni-podatek');
        poljeKot.appendChild(ustvariElement('span', 'tehnicni-naziv', 'Kot drsenja'));
        const vrednostKot = ustvariElement('strong', 'tehnicni-vrednost');
        vrednostKot.id = 'tehnicni-kot';
        poljeKot.appendChild(vrednostKot);

        tehnicniPovzetek.appendChild(poljeHitrost);
        tehnicniPovzetek.appendChild(poljeSpuscanje);
        tehnicniPovzetek.appendChild(poljeKot);

        // Vizualni SVG prikaz drsenja
        const grafOkvir = ustvariElement('div', 'graf-okvir');
        const grafGlava = ustvariElement('div', 'graf-glava');
        grafGlava.appendChild(ustvariElement('span', 'graf-naslov', 'Shematski prikaz drsnega kota in varnostne rezerve'));
        const grafNacinOznaka = ustvariElement('span', 'graf-vir-hitrosti');
        grafNacinOznaka.id = 'graf-vir-hitrosti';
        grafGlava.appendChild(grafNacinOznaka);

        const svgElement = ustvariSvgElement('svg', {
            id: 'graf-drsenja-svg',
            viewBox: '0 0 800 295',
            role: 'img',
            'aria-label': 'Shematski graf drsenja jadralnega letala'
        });

        // Definicije vzorcev in prelivov znotraj SVG
        const defs = ustvariSvgElement('defs');
        const vzorecRezerva = ustvariSvgElement('pattern', {
            id: 'vzorec-rezerva',
            width: '10',
            height: '10',
            patternUnits: 'userSpaceOnUse',
            patternTransform: 'rotate(45)'
        });
        vzorecRezerva.appendChild(ustvariSvgElement('rect', {
            width: '10',
            height: '10',
            fill: 'rgba(245, 158, 11, 0.14)'
        }));
        vzorecRezerva.appendChild(ustvariSvgElement('line', {
            x1: '0',
            y1: '0',
            x2: '0',
            y2: '10',
            stroke: 'rgba(245, 158, 11, 0.42)',
            'stroke-width': '2'
        }));
        defs.appendChild(vzorecRezerva);
        svgElement.appendChild(defs);

        // Ozadje neba in terena
        svgElement.appendChild(ustvariSvgElement('rect', {
            class: 'graf-nebo',
            x: '0',
            y: '0',
            width: '800',
            height: '218',
            rx: '10'
        }));

        // Vodoravne referenčne črte višine
        [68, 118, 168].forEach(function (yReferenca) {
            svgElement.appendChild(ustvariSvgElement('line', {
                class: 'graf-mreza-crta',
                x1: '24',
                y1: yReferenca,
                x2: '776',
                y2: yReferenca
            }));
        });

        // Pas tal (Letališče Moškanjci)
        svgElement.appendChild(ustvariSvgElement('rect', {
            class: 'graf-tla',
            x: '0',
            y: '218',
            width: '800',
            height: '77'
        }));

        // Osenčena cona 30 % rezerve za pristanek
        const rezervaPoligon = ustvariSvgElement('polygon', {
            id: 'rezerva-poligon',
            class: 'graf-cona-rezerve',
            fill: 'url(#vzorec-rezerva)'
        });
        const varniPasTla = ustvariSvgElement('rect', {
            id: 'varni-tla-pas',
            class: 'graf-varni-pas',
            y: '214',
            height: '8',
            rx: '4'
        });
        const rezervaPasTla = ustvariSvgElement('rect', {
            id: 'rezerva-tla-pas',
            class: 'graf-rezerva-pas',
            y: '214',
            height: '8',
            rx: '4'
        });
        svgElement.appendChild(rezervaPoligon);
        svgElement.appendChild(ustvariSvgElement('line', {
            class: 'graf-tla-crta',
            x1: '24',
            y1: '218',
            x2: '776',
            y2: '218'
        }));
        svgElement.appendChild(varniPasTla);
        svgElement.appendChild(rezervaPasTla);

        // Navpična os začetne višine
        const visinaCrta = ustvariSvgElement('line', {
            id: 'oznaka-visine-crta',
            class: 'graf-visina-crta'
        });
        const visinaZgornja = ustvariSvgElement('circle', {
            id: 'oznaka-visine-tocka',
            class: 'graf-visina-tocka',
            r: '4.5'
        });
        const visinaNaslov = ustvariSvgElement('text', {
            id: 'oznaka-visine-naslov',
            class: 'graf-oznaka-sekundarna',
            'text-anchor': 'start'
        });
        visinaNaslov.textContent = 'Začetna višina';
        const visinaVrednost = ustvariSvgElement('text', {
            id: 'oznaka-visine-tekst',
            class: 'graf-vrednost-visina',
            'text-anchor': 'end'
        });
        svgElement.appendChild(visinaCrta);
        svgElement.appendChild(visinaZgornja);
        svgElement.appendChild(visinaNaslov);
        svgElement.appendChild(visinaVrednost);

        // Navpična črta varnega doleta
        const varniCrta = ustvariSvgElement('line', {
            id: 'varni-navpicna-crta',
            class: 'graf-varni-crta'
        });
        svgElement.appendChild(varniCrta);

        // Drsna pot (podlaga, črtkana animirana pot in preletena sled)
        const potPodlaga = ustvariSvgElement('line', {
            id: 'pot-podlaga',
            class: 'graf-pot-podlaga'
        });
        const potDrsenja = ustvariSvgElement('line', {
            id: 'pot-drsenja',
            class: 'graf-pot-crtkana'
        });
        const preletenaPot = ustvariSvgElement('line', {
            id: 'preletena-pot',
            class: 'graf-preletena-pot'
        });
        svgElement.appendChild(potPodlaga);
        svgElement.appendChild(potDrsenja);
        svgElement.appendChild(preletenaPot);

        // Oznaka 30 % rezerve in kotna značka v zgornjem desnem kotu
        const rezervaOznaka = ustvariSvgElement('text', {
            id: 'rezerva-oznaka',
            class: 'graf-rezerva-tekst',
            'text-anchor': 'middle'
        });
        rezervaOznaka.textContent = '30 % rezerva';
        const grafPodatekOznaka = ustvariSvgElement('text', {
            id: 'graf-podatek-oznaka',
            class: 'graf-podatek-badge',
            x: '774',
            y: '30',
            'text-anchor': 'end'
        });
        svgElement.appendChild(rezervaOznaka);
        svgElement.appendChild(grafPodatekOznaka);

        // Točke na tleh: Letališče Moškanjci, Varni dolet, Teoretični dotik
        const tockaStart = ustvariSvgElement('circle', {
            id: 'tocka-start',
            class: 'graf-tocka-start',
            r: '5.5'
        });
        const napisLetalisce = ustvariSvgElement('text', {
            id: 'napis-letalisce',
            class: 'graf-tla-naziv',
            y: '246',
            'text-anchor': 'start'
        });
        napisLetalisce.textContent = 'Letališče Moškanjci';
        const napisStartKm = ustvariSvgElement('text', {
            id: 'napis-start-km',
            class: 'graf-tla-vrednost',
            y: '266',
            'text-anchor': 'start'
        });
        napisStartKm.textContent = '0,00 km';

        const tockaVarni = ustvariSvgElement('circle', {
            id: 'tocka-varni',
            class: 'graf-tocka-varni',
            r: '6'
        });
        const napisVarniNaziv = ustvariSvgElement('text', {
            id: 'napis-varni-naziv',
            class: 'graf-tla-naziv graf-tla-varni',
            y: '246',
            'text-anchor': 'middle'
        });
        napisVarniNaziv.textContent = 'Varni dolet';
        const napisVarniKm = ustvariSvgElement('text', {
            id: 'napis-varni-km',
            class: 'graf-tla-vrednost graf-tla-varni',
            y: '266',
            'text-anchor': 'middle'
        });

        const tockaDotik = ustvariSvgElement('circle', {
            id: 'tocka-dotik',
            class: 'graf-tocka-dotik',
            r: '6'
        });
        const napisDotikNaziv = ustvariSvgElement('text', {
            id: 'napis-dotik-naziv',
            class: 'graf-tla-naziv graf-tla-dotik',
            y: '246',
            'text-anchor': 'end'
        });
        napisDotikNaziv.textContent = 'Teoretični dotik';
        const napisDotikKm = ustvariSvgElement('text', {
            id: 'napis-dotik-km',
            class: 'graf-tla-vrednost graf-tla-dotik',
            y: '266',
            'text-anchor': 'end'
        });

        svgElement.appendChild(tockaStart);
        svgElement.appendChild(napisLetalisce);
        svgElement.appendChild(napisStartKm);
        svgElement.appendChild(tockaVarni);
        svgElement.appendChild(napisVarniNaziv);
        svgElement.appendChild(napisVarniKm);
        svgElement.appendChild(tockaDotik);
        svgElement.appendChild(napisDotikNaziv);
        svgElement.appendChild(napisDotikKm);

        // Silhueta jadralnega letala, ki drsi po poti
        const jadralecSkupina = ustvariSvgElement('g', {
            id: 'jadralec-simbol',
            class: 'graf-jadralec'
        });
        // Trup in rep T-konfiguracije
        jadralecSkupina.appendChild(ustvariSvgElement('path', {
            class: 'jadralec-trup',
            d: 'M -18 1 L -19 -6 L -15 -6 L -14 0.5 L -5 -1.8 L 8 -2.4 L 18 0.2 L 13 2.4 L -18 2 Z'
        }));
        // Višinsko krmilo na vrhu repa
        jadralecSkupina.appendChild(ustvariSvgElement('path', {
            class: 'jadralec-trup',
            d: 'M -21 -6.5 L -13 -6.5 L -14 -8 L -20 -8 Z'
        }));
        // Kabina
        jadralecSkupina.appendChild(ustvariSvgElement('path', {
            class: 'jadralec-kabina',
            d: 'M 4 -2.2 L 12 -1.2 L 10 0.4 L 3 0.4 Z'
        }));
        // Vitko krilo
        jadralecSkupina.appendChild(ustvariSvgElement('path', {
            class: 'jadralec-krilo',
            d: 'M -2 -0.6 L -11 -12 L -6 -12 L 4 -0.2 Z'
        }));
        svgElement.appendChild(jadralecSkupina);

        grafOkvir.appendChild(grafGlava);
        grafOkvir.appendChild(svgElement);

        rezultatiSklop.appendChild(metrikeMreza);
        rezultatiSklop.appendChild(tehnicniPovzetek);
        rezultatiSklop.appendChild(grafOkvir);

        vsebnik.appendChild(prednastavitveSklop);
        vsebnik.appendChild(obrazec);
        vsebnik.appendChild(napakaOkvir);
        vsebnik.appendChild(rezultatiSklop);

        return {
            gumbiPresetov: gumbiPresetov,
            obrazec: obrazec,
            vnosVisina: vnosVisina,
            vnosFinesa: vnosFinesa,
            napakaOkvir: napakaOkvir,
            rezultatiSklop: rezultatiSklop,
            vrednostTeor: vrednostTeor,
            vrednostVarni: vrednostVarni,
            vrednostCas: vrednostCas,
            vrednostHitrost: vrednostHitrost,
            vrednostSpuscanje: vrednostSpuscanje,
            vrednostKot: vrednostKot,
            grafNacinOznaka: grafNacinOznaka,
            svgElement: svgElement,
            rezervaPoligon: rezervaPoligon,
            varniPasTla: varniPasTla,
            rezervaPasTla: rezervaPasTla,
            visinaCrta: visinaCrta,
            visinaZgornja: visinaZgornja,
            visinaNaslov: visinaNaslov,
            visinaVrednost: visinaVrednost,
            varniCrta: varniCrta,
            potPodlaga: potPodlaga,
            potDrsenja: potDrsenja,
            preletenaPot: preletenaPot,
            rezervaOznaka: rezervaOznaka,
            grafPodatekOznaka: grafPodatekOznaka,
            tockaStart: tockaStart,
            napisLetalisce: napisLetalisce,
            napisStartKm: napisStartKm,
            tockaVarni: tockaVarni,
            napisVarniNaziv: napisVarniNaziv,
            napisVarniKm: napisVarniKm,
            tockaDotik: tockaDotik,
            napisDotikNaziv: napisDotikNaziv,
            napisDotikKm: napisDotikKm,
            jadralecSkupina: jadralecSkupina
        };
    }

    //**********************************************************
    // Zagon kalkulatorja in povezava vseh interakcij          *
    //**********************************************************
    function inicializirajKalkulator() {
        const vsebnik = document.getElementById('kalkulator-vsebnik');
        if (!vsebnik) {
            return;
        }

        const ui = ustvariVmesnikKalkulatorja(vsebnik);
        let aktivniPresetId = PRIVZETI_PRESET_ID;
        let zadnjeStanjeNapake = false;
        let animacijaId = null;

        //**********************************************************
        // Preklic morebitne aktivne animacije jadralnega letala   *
        //**********************************************************
        function ustaviAnimacijoJadralca() {
            if (animacijaId !== null) {
                window.cancelAnimationFrame(animacijaId);
                animacijaId = null;
            }
        }

        //**********************************************************
        // Posodobitev videza gumbov prednastavljenih zrakoplovov  *
        //**********************************************************
        function osveziOznakePresetov() {
            Object.keys(ui.gumbiPresetov).forEach(function (id) {
                const gumb = ui.gumbiPresetov[id];
                const jeAktiven = id === aktivniPresetId;
                gumb.classList.toggle('aktiven', jeAktiven);
                gumb.setAttribute('aria-pressed', jeAktiven ? 'true' : 'false');
            });
        }

        //**********************************************************
        // Gladka animacija jadralnega letala vzdolž drsne poti    *
        //**********************************************************
        function animirajJadralca(xStart, yStart, xEnd, yGround) {
            ustaviAnimacijoJadralca();

            const dx = xEnd - xStart;
            const dy = yGround - yStart;
            const kotStopinje = Math.atan2(dy, dx) * (180 / Math.PI);
            const zacetniDelez = 0.04;
            const koncniDelez = VARNOSTNA_REZERVA_DELEZ;

            function postaviNaDelez(t) {
                const gx = xStart + dx * t;
                const gy = yStart + dy * t;
                ui.jadralecSkupina.setAttribute(
                    'transform',
                    'translate(' + gx.toFixed(2) + ', ' + gy.toFixed(2) + ') rotate(' + kotStopinje.toFixed(2) + ')'
                );
                ui.preletenaPot.setAttribute('x1', xStart.toFixed(2));
                ui.preletenaPot.setAttribute('y1', yStart.toFixed(2));
                ui.preletenaPot.setAttribute('x2', gx.toFixed(2));
                ui.preletenaPot.setAttribute('y2', gy.toFixed(2));
            }

            const zmanjsanoGibanje =
                window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (zmanjsanoGibanje) {
                postaviNaDelez(koncniDelez);
                return;
            }

            const trajanjeMs = 1150;
            let zacetniCas = null;

            function korak(casovniZig) {
                if (zacetniCas === null) {
                    zacetniCas = casovniZig;
                }
                const suroviNapredek = omeji((casovniZig - zacetniCas) / trajanjeMs, 0, 1);
                const zglajeniNapredek = 1 - Math.pow(1 - suroviNapredek, 3);
                const trenutniDelez = zacetniDelez + (koncniDelez - zacetniDelez) * zglajeniNapredek;
                postaviNaDelez(trenutniDelez);

                if (suroviNapredek < 1) {
                    animacijaId = window.requestAnimationFrame(korak);
                } else {
                    animacijaId = null;
                }
            }

            postaviNaDelez(zacetniDelez);
            animacijaId = window.requestAnimationFrame(korak);
        }

        //**********************************************************
        // Posodobitev geometrije in oznak SVG grafa drsenja       *
        //**********************************************************
        function posodobiGrafDrsenja(visinaM, finesa, rezultati) {
            const xStart = 104;
            const yGround = 218;
            const finesaFaktor = omeji((finesa - 10) / 50, 0, 1);
            const xSpan = 570 + finesaFaktor * 70;
            const xEnd = xStart + xSpan;
            const xSafe = xStart + xSpan * VARNOSTNA_REZERVA_DELEZ;

            const visinaFaktor = omeji((Math.log10(Math.max(10, visinaM)) - 1) / 3, 0, 1);
            const yStart = 114 - visinaFaktor * 62;
            const ySafe = yStart + (yGround - yStart) * VARNOSTNA_REZERVA_DELEZ;

            // Navpična os začetne višine
            ui.visinaCrta.setAttribute('x1', xStart);
            ui.visinaCrta.setAttribute('y1', yStart);
            ui.visinaCrta.setAttribute('x2', xStart);
            ui.visinaCrta.setAttribute('y2', yGround);

            ui.visinaZgornja.setAttribute('cx', xStart);
            ui.visinaZgornja.setAttribute('cy', yStart);

            ui.visinaNaslov.setAttribute('x', xStart);
            ui.visinaNaslov.setAttribute('y', Math.max(22, yStart - 13));

            const visinaTekst = formatirajStevilo(visinaM, 0, 1) + ' m';
            ui.visinaVrednost.setAttribute('x', xStart - 12);
            ui.visinaVrednost.setAttribute('y', ((yStart + yGround) / 2 + 4).toFixed(1));
            ui.visinaVrednost.textContent = visinaTekst;

            // Osenčena cona 30 % rezerve
            const tockePoligona =
                xSafe.toFixed(1) + ',' + ySafe.toFixed(1) + ' ' +
                xEnd.toFixed(1) + ',' + yGround + ' ' +
                xSafe.toFixed(1) + ',' + yGround;
            ui.rezervaPoligon.setAttribute('points', tockePoligona);

            ui.varniPasTla.setAttribute('x', xStart);
            ui.varniPasTla.setAttribute('width', (xSafe - xStart).toFixed(1));

            ui.rezervaPasTla.setAttribute('x', xSafe.toFixed(1));
            ui.rezervaPasTla.setAttribute('width', (xEnd - xSafe).toFixed(1));

            ui.rezervaOznaka.setAttribute('x', ((xSafe + xEnd) / 2).toFixed(1));
            ui.rezervaOznaka.setAttribute('y', Math.min(182, ySafe - 12).toFixed(1));

            // Navpična črta varnega doleta
            ui.varniCrta.setAttribute('x1', xSafe.toFixed(1));
            ui.varniCrta.setAttribute('y1', ySafe.toFixed(1));
            ui.varniCrta.setAttribute('x2', xSafe.toFixed(1));
            ui.varniCrta.setAttribute('y2', yGround);

            // Glavne linije drsne poti
            ui.potPodlaga.setAttribute('x1', xStart);
            ui.potPodlaga.setAttribute('y1', yStart);
            ui.potPodlaga.setAttribute('x2', xEnd.toFixed(1));
            ui.potPodlaga.setAttribute('y2', yGround);

            ui.potDrsenja.setAttribute('x1', xStart);
            ui.potDrsenja.setAttribute('y1', yStart);
            ui.potDrsenja.setAttribute('x2', xEnd.toFixed(1));
            ui.potDrsenja.setAttribute('y2', yGround);

            // Značke na tleh
            ui.tockaStart.setAttribute('cx', xStart);
            ui.tockaStart.setAttribute('cy', yGround);
            ui.napisLetalisce.setAttribute('x', xStart);
            ui.napisStartKm.setAttribute('x', xStart);

            const varniDoletTekst = formatirajStevilo(rezultati.varniDoletKm, 2, 2) + ' km';
            ui.tockaVarni.setAttribute('cx', xSafe.toFixed(1));
            ui.tockaVarni.setAttribute('cy', yGround);
            ui.napisVarniNaziv.setAttribute('x', xSafe.toFixed(1));
            ui.napisVarniKm.setAttribute('x', xSafe.toFixed(1));
            ui.napisVarniKm.textContent = varniDoletTekst;

            const teoreticniDoletTekst = formatirajStevilo(rezultati.teoreticniDoletKm, 2, 2) + ' km';
            ui.tockaDotik.setAttribute('cx', xEnd.toFixed(1));
            ui.tockaDotik.setAttribute('cy', yGround);
            ui.napisDotikNaziv.setAttribute('x', xEnd.toFixed(1));
            ui.napisDotikKm.setAttribute('x', xEnd.toFixed(1));
            ui.napisDotikKm.textContent = teoreticniDoletTekst;

            const finesaTekst = formatirajStevilo(finesa, 0, 2);
            const kotTekst = formatirajStevilo(rezultati.kotDrsenjaStopinje, 2, 2) + '°';
            ui.grafPodatekOznaka.textContent = 'Finesa L/D ' + finesaTekst + ' · Kot ' + kotTekst;

            ui.svgElement.setAttribute(
                'aria-label',
                'Shema drsenja z višine ' + visinaTekst + ' pri finesi ' + finesaTekst +
                ': varni dolet ' + varniDoletTekst + ', teoretični dolet ' + teoreticniDoletTekst + '.'
            );

            animirajJadralca(xStart, yStart, xEnd, yGround);
        }

        //**********************************************************
        // Prikaz napake in skrivanje rezultatov ob neveljavnosti  *
        //**********************************************************
        function prikaziNapako(visinaVeljavna, finesaVeljavna, jeOddajaObrazca) {
            ustaviAnimacijoJadralca();

            ui.vnosVisina.classList.toggle('polje-napaka', !visinaVeljavna);
            ui.vnosVisina.setAttribute('aria-invalid', visinaVeljavna ? 'false' : 'true');

            ui.vnosFinesa.classList.toggle('polje-napaka', !finesaVeljavna);
            ui.vnosFinesa.setAttribute('aria-invalid', finesaVeljavna ? 'false' : 'true');

            let sporocilo = '';
            if (!visinaVeljavna && !finesaVeljavna) {
                sporocilo = 'Prosimo, vnesite veljavni pozitivni števili za začetno višino (m) in fineso (L/D).';
            } else if (!visinaVeljavna) {
                sporocilo = 'Začetna višina mora biti veljavno število, večje od 0 m.';
            } else {
                sporocilo = 'Drsalno razmerje oziroma finesa (L/D) mora biti veljavno število, večje od 0.';
            }

            ui.napakaOkvir.textContent = sporocilo;
            ui.napakaOkvir.hidden = false;

            ui.rezultatiSklop.classList.add('skrito');
            ui.rezultatiSklop.hidden = true;
            ui.rezultatiSklop.setAttribute('aria-hidden', 'true');

            if (jeOddajaObrazca || !zadnjeStanjeNapake) {
                const elementiZaStres = [ui.napakaOkvir];
                if (!visinaVeljavna) {
                    elementiZaStres.push(ui.vnosVisina);
                }
                if (!finesaVeljavna) {
                    elementiZaStres.push(ui.vnosFinesa);
                }
                sproziStresNapake(elementiZaStres);
            }

            if (jeOddajaObrazca) {
                if (!visinaVeljavna) {
                    ui.vnosVisina.focus();
                } else if (!finesaVeljavna) {
                    ui.vnosFinesa.focus();
                }
            }

            zadnjeStanjeNapake = true;
        }

        //**********************************************************
        // Celotna validacija, izračun in posodobitev vmesnika     *
        //**********************************************************
        function posodobiKalkulator(jeOddajaObrazca) {
            const visinaM = preberiSteviloIzPolja(ui.vnosVisina);
            const finesa = preberiSteviloIzPolja(ui.vnosFinesa);

            const visinaVeljavna = Number.isFinite(visinaM) && visinaM > 0;
            const finesaVeljavna = Number.isFinite(finesa) && finesa > 0;

            if (!visinaVeljavna || !finesaVeljavna) {
                prikaziNapako(visinaVeljavna, finesaVeljavna, Boolean(jeOddajaObrazca));
                return false;
            }

            zadnjeStanjeNapake = false;
            ui.napakaOkvir.hidden = true;
            ui.napakaOkvir.textContent = '';

            ui.vnosVisina.classList.remove('polje-napaka', 'stres-napaka');
            ui.vnosVisina.setAttribute('aria-invalid', 'false');
            ui.vnosFinesa.classList.remove('polje-napaka', 'stres-napaka');
            ui.vnosFinesa.setAttribute('aria-invalid', 'false');

            ui.rezultatiSklop.classList.remove('skrito');
            ui.rezultatiSklop.hidden = false;
            ui.rezultatiSklop.setAttribute('aria-hidden', 'false');

            const aktivniPreset = PREDNASTAVLJENI_ZRAKOPLOVI.find(function (p) {
                return p.id === aktivniPresetId;
            });

            const hitrostKmh = aktivniPreset
                ? aktivniPreset.hitrostKmh
                : oceniHitrostIzFinese(finesa);

            const rezultati = izracunajParametreDoleta(visinaM, finesa, hitrostKmh);

            ui.vrednostTeor.textContent = formatirajStevilo(rezultati.teoreticniDoletKm, 2, 2) + ' km';
            ui.vrednostVarni.textContent = formatirajStevilo(rezultati.varniDoletKm, 2, 2) + ' km';
            ui.vrednostCas.textContent = formatirajTrajanje(rezultati.casSekund);

            ui.vrednostHitrost.textContent = formatirajStevilo(rezultati.hitrostKmh, 0, 1) + ' km/h';
            ui.vrednostSpuscanje.textContent = formatirajStevilo(rezultati.hitrostSpuscanjaMs, 2, 2) + ' m/s';
            ui.vrednostKot.textContent = formatirajStevilo(rezultati.kotDrsenjaStopinje, 2, 2) + '°';

            ui.grafNacinOznaka.textContent = aktivniPreset
                ? 'Profil: ' + aktivniPreset.naziv
                : 'Ocenjena hitrost po finesi';

            posodobiGrafDrsenja(visinaM, finesa, rezultati);
            return true;
        }

        // Klik na prednastavljeni zrakoplov
        Object.keys(ui.gumbiPresetov).forEach(function (id) {
            ui.gumbiPresetov[id].addEventListener('click', function () {
                const izbrani = PREDNASTAVLJENI_ZRAKOPLOVI.find(function (p) {
                    return p.id === id;
                });
                if (!izbrani) {
                    return;
                }

                aktivniPresetId = izbrani.id;
                ui.vnosFinesa.value = String(izbrani.finesa);

                const visinaPrazna =
                    ui.vnosVisina.value.trim() === '' &&
                    !(ui.vnosVisina.validity && ui.vnosVisina.validity.badInput);
                if (visinaPrazna) {
                    ui.vnosVisina.value = String(izbrani.priporocenaVisina);
                }

                osveziOznakePresetov();
                posodobiKalkulator(false);
            });
        });

        // Ročno spreminjanje finese počisti aktivno prednastavitev
        ui.vnosFinesa.addEventListener('input', function () {
            aktivniPresetId = null;
            osveziOznakePresetov();
            posodobiKalkulator(false);
        });

        // Spreminjanje začetne višine sproti posodobi rezultate
        ui.vnosVisina.addEventListener('input', function () {
            posodobiKalkulator(false);
        });

        // Oddaja obrazca z gumbom "Izračunaj dolet" ali tipko Enter
        ui.obrazec.addEventListener('submit', function (dogodek) {
            dogodek.preventDefault();
            posodobiKalkulator(true);
        });

        // Začetni izračun ob nalaganju strani
        osveziOznakePresetov();
        posodobiKalkulator(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializirajKalkulator);
    } else {
        inicializirajKalkulator();
    }
})();
