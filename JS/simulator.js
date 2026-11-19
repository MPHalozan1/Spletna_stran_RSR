//**********************************************************
// Interaktivni 2D simulator jadralnega letenja            *
// Datoteka: JS/simulator.js                               *
// Lokacija: Letališče Moškanjci (Aeroklub Ptuj)           *
//**********************************************************

'use strict';

(function () {
    //**********************************************************
    // 1. Profili zrakoplovov in vremenski pogoji             *
    //**********************************************************
    const LETALA = {
        solsko: {
            tip: 'solsko',
            naziv: 'Šolsko jadralno letalo',
            finesa: 30,
            hitrostPrevleka: 58,
            hitrostMinSpust: 68,
            najboljsaHitrost: 90,
            hitrostHitriPrelet: 128,
            vlecnaHitrost: 112,
            maxHitrost: 195,
            odzivnost: 1.05,
            zavoreSpust: 3.3,
            pospesekVitla: 16.5,
            dolzinaKrila: 1.0
        },
        tekmovalno: {
            tip: 'tekmovalno',
            naziv: 'Tekmovalno jadralno letalo',
            finesa: 48,
            hitrostPrevleka: 72,
            hitrostMinSpust: 84,
            najboljsaHitrost: 110,
            hitrostHitriPrelet: 158,
            vlecnaHitrost: 126,
            maxHitrost: 245,
            odzivnost: 1.22,
            zavoreSpust: 3.8,
            pospesekVitla: 19.0,
            dolzinaKrila: 1.18
        },
        rc: {
            tip: 'rc',
            naziv: 'RC jadralni model',
            finesa: 22,
            hitrostPrevleka: 24,
            hitrostMinSpust: 30,
            najboljsaHitrost: 40,
            hitrostHitriPrelet: 58,
            vlecnaHitrost: 64,
            maxHitrost: 95,
            odzivnost: 1.65,
            zavoreSpust: 2.0,
            pospesekVitla: 14.0,
            dolzinaKrila: 0.78
        }
    };

    const VREMENA = {
        mirno: {
            naziv: 'Mirno',
            razmak: 620,
            verjetnostToplo: 0.68,
            dvigMin: 1.4,
            dvigMax: 2.3,
            spustMin: 0.9,
            spustMax: 1.5,
            polmerMin: 105,
            polmerMax: 145,
            visinaOblakaMin: 680,
            visinaOblakaMax: 800,
            turbulenca: 0.08
        },
        termicno: {
            naziv: 'Termično',
            razmak: 470,
            verjetnostToplo: 0.62,
            dvigMin: 2.3,
            dvigMax: 4.2,
            spustMin: 1.5,
            spustMax: 2.7,
            polmerMin: 95,
            polmerMax: 135,
            visinaOblakaMin: 760,
            visinaOblakaMax: 920,
            turbulenca: 0.22
        },
        zahtevno: {
            naziv: 'Zahtevno',
            razmak: 420,
            verjetnostToplo: 0.48,
            dvigMin: 3.0,
            dvigMax: 5.2,
            spustMin: 2.4,
            spustMax: 4.1,
            polmerMin: 75,
            polmerMax: 112,
            visinaOblakaMin: 800,
            visinaOblakaMax: 980,
            turbulenca: 0.48
        }
    };

    const GRAVITACIJA = 9.81;
    const X_VITEL = 750;
    const STEZA_ZACETEK = -90;
    const STEZA_KONEC = 880;

    //**********************************************************
    // 2. Pomožne funkcije za pretvorbe, naključje in obliko   *
    //**********************************************************
    function omeji(vrednost, min, max) {
        return Math.max(min, Math.min(max, vrednost));
    }

    function nakljucnoMed(min, max) {
        return min + Math.random() * (max - min);
    }

    function kmhVMs(kmh) {
        return kmh / 3.6;
    }

    function msVKmh(ms) {
        return ms * 3.6;
    }

    function oblikujDecimalno(stevilo, decimalke) {
        return stevilo.toFixed(decimalke).replace('.', ',');
    }

    function oblikujCas(sekunde) {
        const skupaj = Math.max(0, Math.floor(sekunde));
        const min = Math.floor(skupaj / 60);
        const sek = skupaj % 60;
        const mm = min < 10 ? '0' + min : String(min);
        const ss = sek < 10 ? '0' + sek : String(sek);
        return mm + ':' + ss;
    }

    function pridobiHitrostRezima(profil, rezim) {
        if (rezim === 'min_spust') {
            return profil.hitrostMinSpust;
        }
        if (rezim === 'hitri_prelet') {
            return profil.hitrostHitriPrelet;
        }
        return profil.najboljsaHitrost;
    }

    function pridobiPriporoceniRezim(zracnaMasa) {
        if (zracnaMasa === 'toplo') {
            return 'min_spust';
        }
        if (zracnaMasa === 'hladno') {
            return 'hitri_prelet';
        }
        return 'najboljsi_dolet';
    }

    function pridobiTrenutnoTemo() {
        const atribut = document.documentElement.getAttribute('data-theme');
        if (atribut === 'light' || atribut === 'dark') {
            return atribut;
        }
        const stikalo = document.getElementById('tema-stikalo');
        return stikalo && stikalo.checked ? 'light' : 'dark';
    }

    //**********************************************************
    // 3. Glavni objekt simulatorja in inicializacija DOM     *
    //**********************************************************
    document.addEventListener('DOMContentLoaded', function () {
        const platno = document.getElementById('simulator-platno');
        const ovoj = document.getElementById('platno-ovoj');
        if (!platno || !ovoj) {
            return;
        }

        const ctx = platno.getContext('2d');
        if (!ctx) {
            return;
        }

        const ui = {
            izbiraLetala: document.getElementById('izbira-letala'),
            vremeGumbi: Array.from(document.querySelectorAll('.vreme-gumb')),
            trimGumbi: Array.from(document.querySelectorAll('.trim-gumb')),
            trimMinus: document.getElementById('trim-minus'),
            trimPlus: document.getElementById('trim-plus'),
            trimRezimOznaka: document.getElementById('trim-rezim-oznaka'),
            trimCiljVrednost: document.getElementById('trim-cilj-vrednost'),
            gumbZvok: document.getElementById('gumb-zvok-vario'),
            gumbHitriRestart: document.getElementById('gumb-hitri-restart'),
            hudVisina: document.getElementById('hud-visina'),
            hudHitrost: document.getElementById('hud-hitrost'),
            hudCiljHitrost: document.getElementById('hud-cilj-hitrost'),
            hudPolara: document.getElementById('hud-polara'),
            hitrostTrak: document.getElementById('hitrost-trak'),
            hitrostPrevlekCona: document.getElementById('hitrost-prevlek-cona'),
            hitrostPolnilo: document.getElementById('hitrost-polnilo'),
            hitrostOznakaMin: document.getElementById('hitrost-oznaka-min'),
            hitrostOznakaBest: document.getElementById('hitrost-oznaka-best'),
            hitrostOznakaHitri: document.getElementById('hitrost-oznaka-hitri'),
            hitrostCiljOznaka: document.getElementById('hitrost-cilj-oznaka'),
            hitrostTrenutnaOznaka: document.getElementById('hitrost-trenutna-oznaka'),
            hudVario: document.getElementById('hud-vario'),
            varioSpust: document.getElementById('vario-spust'),
            varioDvig: document.getElementById('vario-dvig'),
            hudZajla: document.getElementById('hud-zajla'),
            zajlaMerilnik: document.getElementById('zajla-merilnik'),
            hudZracnaMasa: document.getElementById('hud-zracna-masa'),
            hudFaza: document.getElementById('hud-faza'),
            hudZavore: document.getElementById('hud-zavore'),
            opozoriloPrevlek: document.getElementById('opozorilo-prevlek'),
            pasicaNasvet: document.getElementById('pasica-nasvet'),
            povzetekPristanka: document.getElementById('povzetek-pristanka'),
            pristanekOcena: document.getElementById('pristanek-ocena'),
            rezultatVisina: document.getElementById('rezultat-visina'),
            rezultatCas: document.getElementById('rezultat-cas'),
            rezultatRazdalja: document.getElementById('rezultat-razdalja'),
            rezultatTermike: document.getElementById('rezultat-termike'),
            rezultatPodrobnosti: document.getElementById('rezultat-podrobnosti'),
            gumbOverlayRestart: document.getElementById('gumb-overlay-restart'),
            ctrlVitel: document.getElementById('ctrl-vitel'),
            ctrlGor: document.getElementById('ctrl-gor'),
            ctrlDol: document.getElementById('ctrl-dol'),
            ctrlOdpni: document.getElementById('ctrl-odpni'),
            ctrlZavore: document.getElementById('ctrl-zavore'),
            ctrlRestart: document.getElementById('ctrl-restart')
        };

        //**********************************************************
        // 4. Stanje simulacije, vnosa in zvočnega variometra      *
        //**********************************************************
        const sim = {
            sirina: 960,
            visina: 440,
            dpr: 1,
            tema: pridobiTrenutnoTemo(),
            tipLetala: 'solsko',
            tipVremena: 'termicno',
            stanje: 'NA_STEZI',
            x: 0,
            y: 0,
            hitrost: 0,
            nagib: 0.03,
            rezimHitrosti: 'najboljsi_dolet',
            ciljnaHitrostKmh: LETALA.solsko.najboljsaHitrost,
            polarniSpust: 0,
            trenutnaFinesa: 0,
            priporoceniRezim: 'najboljsi_dolet',
            vario: 0,
            gladkiVario: 0,
            napetostZajle: 0,
            mocVitla: 0,
            zracneZavore: false,
            vPrevleku: false,
            resevanjePrevleka: false,
            zracnaMasa: 'miren',
            casLeta: 0,
            maxVisina: 0,
            ujetiTopliTokovi: 0,
            ujetiTokoviIds: new Set(),
            kotaljenje: false,
            dotikVario: 0,
            dotikNagibDeg: 0,
            naslednjiTokX: 980,
            naslednjiTokId: 1,
            tokovi: [],
            okrasniOblaki: [],
            zvezde: [],
            odpetaZajla: null,
            animacijaCas: 0,
            kameraX: 300,
            kameraY: 110,
            kameraZoom: 1.25,
            nasvetBesedilo: '',
            nasvetVrsta: 'info',
            nasvetPreostanek: 0,
            hladniNasvetZadnji: -99,
            visokaNapetostZadnji: -99,
            nizkaHitrostZadnji: -99,
            visokaHitrostZadnji: -99
        };

        const vhod = {
            tipkaSpace: false,
            tipkaGor: false,
            tipkaDol: false,
            gumbVitel: false,
            gumbGor: false,
            gumbDol: false
        };

        const zvok = {
            omogocen: false,
            ctx: null,
            naslednjiPip: 0,
            spustOsc: null,
            spustGain: null
        };

        //**********************************************************
        // 5. Inicializacija zvezd in okrasnih oblakov             *
        //**********************************************************
        function ustvariZvezde() {
            sim.zvezde = [];
            for (let i = 0; i < 65; i += 1) {
                sim.zvezde.push({
                    fx: Math.random(),
                    fy: Math.random() * 0.65,
                    velikost: nakljucnoMed(0.9, 2.2),
                    faza: nakljucnoMed(0, Math.PI * 2)
                });
            }
        }

        function generirajOkrasneOblakeDo(ciljX) {
            if (sim.okrasniOblaki.length === 0) {
                for (let x = -150; x < 1100; x += 280) {
                    sim.okrasniOblaki.push({
                        x: x + nakljucnoMed(-40, 40),
                        y: nakljucnoMed(500, 780),
                        sirina: nakljucnoMed(120, 210)
                    });
                }
            }
            let zadnjiX = sim.okrasniOblaki.length > 0
                ? sim.okrasniOblaki[sim.okrasniOblaki.length - 1].x
                : 0;
            while (zadnjiX < ciljX) {
                zadnjiX += nakljucnoMed(240, 390);
                sim.okrasniOblaki.push({
                    x: zadnjiX,
                    y: nakljucnoMed(520, 860),
                    sirina: nakljucnoMed(115, 220)
                });
            }
        }

        //**********************************************************
        // 6. Generator toplih termičnih in hladnih spustnih tokov *
        //**********************************************************
        function ustvariDelceToka(polmer, visinaOblaka, smer) {
            const delci = [];
            const stevilo = 14;
            for (let i = 0; i < stevilo; i += 1) {
                delci.push({
                    odmikX: nakljucnoMed(-polmer * 0.78, polmer * 0.78),
                    napredek: Math.random(),
                    hitrost: nakljucnoMed(0.14, 0.25) * smer,
                    dolzina: nakljucnoMed(18, 34),
                    visinaMax: visinaOblaka
                });
            }
            return delci;
        }

        function generirajTokoveDo(ciljX) {
            const vreme = VREMENA[sim.tipVremena];
            while (sim.naslednjiTokX < ciljX) {
                const jePrvi = sim.naslednjiTokId === 1;
                const jeTopli = jePrvi ? true : Math.random() < vreme.verjetnostToplo;
                const polmer = nakljucnoMed(vreme.polmerMin, vreme.polmerMax);
                const visinaOblaka = nakljucnoMed(vreme.visinaOblakaMin, vreme.visinaOblakaMax);
                const moc = jeTopli
                    ? nakljucnoMed(vreme.dvigMin, vreme.dvigMax)
                    : -nakljucnoMed(vreme.spustMin, vreme.spustMax);

                sim.tokovi.push({
                    id: sim.naslednjiTokId,
                    tip: jeTopli ? 'toplo' : 'hladno',
                    x: sim.naslednjiTokX,
                    polmer: polmer,
                    visinaOblaka: visinaOblaka,
                    moc: moc,
                    delci: ustvariDelceToka(polmer, visinaOblaka, jeTopli ? 1 : -1)
                });

                sim.naslednjiTokId += 1;
                sim.naslednjiTokX += nakljucnoMed(vreme.razmak * 0.78, vreme.razmak * 1.25);
            }
        }

        //**********************************************************
        // 7. Upravljanje Web Audio variometra (privzeto izključen)*
        //**********************************************************
        function zagotoviAudioKontekst() {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                return null;
            }
            if (!zvok.ctx) {
                zvok.ctx = new AudioCtx();
            }
            if (zvok.ctx.state === 'suspended') {
                zvok.ctx.resume().catch(function () {});
            }
            return zvok.ctx;
        }

        function ustaviSpustniTon() {
            if (zvok.spustGain && zvok.ctx) {
                try {
                    const zdaj = zvok.ctx.currentTime;
                    zvok.spustGain.gain.cancelScheduledValues(zdaj);
                    zvok.spustGain.gain.setTargetAtTime(0, zdaj, 0.02);
                } catch (e) {
                    // Ignoriraj morebitno zaprtje konteksta
                }
            }
        }

        function ustaviZvokVariometra() {
            ustaviSpustniTon();
            zvok.naslednjiPip = 0;
        }

        function predvajajPipDviga(vario) {
            if (!zvok.ctx || zvok.ctx.state !== 'running') {
                return;
            }
            const zdaj = zvok.ctx.currentTime;
            if (zdaj < zvok.naslednjiPip) {
                return;
            }

            const moc = omeji((vario - 0.3) / 4.5, 0, 1);
            const frekvenca = 520 + moc * 660;
            const trajanje = 0.095 - moc * 0.03;
            const premor = 0.44 - moc * 0.28;

            const osc = zvok.ctx.createOscillator();
            const gain = zvok.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frekvenca, zdaj);

            gain.gain.setValueAtTime(0.0001, zdaj);
            gain.gain.linearRampToValueAtTime(0.055, zdaj + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, zdaj + trajanje);

            osc.connect(gain);
            gain.connect(zvok.ctx.destination);
            osc.start(zdaj);
            osc.stop(zdaj + trajanje + 0.015);

            zvok.naslednjiPip = zdaj + trajanje + premor;
        }

        function posodobiSpustniTon(aktiven, vario) {
            if (!zvok.ctx || zvok.ctx.state !== 'running') {
                return;
            }
            if (!aktiven) {
                ustaviSpustniTon();
                return;
            }

            if (!zvok.spustOsc) {
                zvok.spustOsc = zvok.ctx.createOscillator();
                zvok.spustGain = zvok.ctx.createGain();
                zvok.spustOsc.type = 'triangle';
                zvok.spustGain.gain.value = 0;
                zvok.spustOsc.connect(zvok.spustGain);
                zvok.spustGain.connect(zvok.ctx.destination);
                zvok.spustOsc.start();
            }

            const zdaj = zvok.ctx.currentTime;
            const moc = omeji((-vario - 1.8) / 3.5, 0, 1);
            const frekvenca = 240 - moc * 75;
            zvok.spustOsc.frequency.setTargetAtTime(frekvenca, zdaj, 0.04);
            zvok.spustGain.gain.setTargetAtTime(0.032 + moc * 0.018, zdaj, 0.04);
        }

        function posodobiZvokVariometra() {
            const vZraku = (sim.stanje === 'VZLET_Z_VITLOM' || sim.stanje === 'PROSTI_LET') && sim.y > 1.5;
            if (!zvok.omogocen || !vZraku) {
                ustaviSpustniTon();
                return;
            }

            if (sim.gladkiVario > 0.3) {
                ustaviSpustniTon();
                predvajajPipDviga(sim.gladkiVario);
            } else if (sim.gladkiVario < -1.8) {
                posodobiSpustniTon(true, sim.gladkiVario);
            } else {
                ustaviSpustniTon();
            }
        }

        function preklopiZvokVariometra() {
            zvok.omogocen = !zvok.omogocen;
            if (zvok.omogocen) {
                zagotoviAudioKontekst();
                ui.gumbZvok.textContent = 'Zvok variometra: Vključen';
                ui.gumbZvok.setAttribute('aria-pressed', 'true');
            } else {
                ustaviZvokVariometra();
                ui.gumbZvok.textContent = 'Zvok variometra: Izključen';
                ui.gumbZvok.setAttribute('aria-pressed', 'false');
            }
        }

        //**********************************************************
        // 8. Pasice obvestil, ponastavitev poleta in velikost     *
        //**********************************************************
        function pokaziNasvet(besedilo, vrsta, trajanje) {
            sim.nasvetBesedilo = besedilo;
            sim.nasvetVrsta = vrsta || 'info';
            sim.nasvetPreostanek = trajanje || 3.5;

            ui.pasicaNasvet.textContent = besedilo;
            ui.pasicaNasvet.classList.remove('skrito', 'pasica-opozorilo', 'pasica-hladno');
            if (sim.nasvetVrsta === 'opozorilo') {
                ui.pasicaNasvet.classList.add('pasica-opozorilo');
            } else if (sim.nasvetVrsta === 'hladno') {
                ui.pasicaNasvet.classList.add('pasica-hladno');
            }
        }

        function skrijNasvet() {
            sim.nasvetPreostanek = 0;
            sim.nasvetBesedilo = '';
            ui.pasicaNasvet.classList.add('skrito');
        }

        function osveziPriporociloTrim() {
            const pokaziPriporocilo = sim.stanje === 'PROSTI_LET'
                && (sim.zracnaMasa === 'toplo' || sim.zracnaMasa === 'hladno');
            for (let i = 0; i < ui.trimGumbi.length; i += 1) {
                const gumb = ui.trimGumbi[i];
                const rezim = gumb.getAttribute('data-rezim');
                gumb.classList.toggle('priporoceno', pokaziPriporocilo && rezim === sim.priporoceniRezim);
            }
        }

        function osveziTrimUI() {
            const profil = LETALA[sim.tipLetala];
            const napisi = {
                min_spust: '1 · Min. spuščanje (' + profil.hitrostMinSpust + ' km/h)',
                najboljsi_dolet: '2 · Najboljši dolet (' + profil.najboljsaHitrost + ' km/h)',
                hitri_prelet: '3 · Hitri prelet (' + profil.hitrostHitriPrelet + ' km/h)'
            };
            const oznakeRezima = {
                min_spust: 'Min. spuščanje',
                najboljsi_dolet: 'Najboljši dolet',
                hitri_prelet: 'Hitri prelet',
                rocno: 'Ročni trim'
            };

            for (let i = 0; i < ui.trimGumbi.length; i += 1) {
                const gumb = ui.trimGumbi[i];
                const rezim = gumb.getAttribute('data-rezim');
                const jeAktiven = sim.rezimHitrosti === rezim;
                if (napisi[rezim]) {
                    gumb.textContent = napisi[rezim];
                }
                gumb.classList.toggle('aktiven', jeAktiven);
                gumb.setAttribute('aria-pressed', jeAktiven ? 'true' : 'false');
            }

            if (ui.trimRezimOznaka) {
                ui.trimRezimOznaka.textContent = oznakeRezima[sim.rezimHitrosti] || 'Ročni trim';
                ui.trimRezimOznaka.classList.toggle('rocno', sim.rezimHitrosti === 'rocno');
            }

            if (ui.trimCiljVrednost) {
                ui.trimCiljVrednost.textContent = Math.round(sim.ciljnaHitrostKmh) + ' km/h';
            }

            const minTrim = profil.hitrostPrevleka + 6;
            const maxTrim = profil.maxHitrost - 15;
            if (ui.trimMinus) {
                ui.trimMinus.disabled = sim.ciljnaHitrostKmh <= minTrim;
            }
            if (ui.trimPlus) {
                ui.trimPlus.disabled = sim.ciljnaHitrostKmh >= maxTrim;
            }

            osveziPriporociloTrim();
        }

        function nastaviRezimHitrosti(novRezim) {
            if (novRezim !== 'min_spust' && novRezim !== 'najboljsi_dolet' && novRezim !== 'hitri_prelet') {
                return;
            }
            const profil = LETALA[sim.tipLetala];
            sim.rezimHitrosti = novRezim;
            sim.ciljnaHitrostKmh = pridobiHitrostRezima(profil, novRezim);
            osveziTrimUI();
            osveziHUD();
        }

        function prilagodiCiljnoHitrost(deltaKmh) {
            const profil = LETALA[sim.tipLetala];
            const minTrim = profil.hitrostPrevleka + 6;
            const maxTrim = profil.maxHitrost - 15;
            sim.ciljnaHitrostKmh = omeji(Math.round(sim.ciljnaHitrostKmh + deltaKmh), minTrim, maxTrim);
            sim.rezimHitrosti = 'rocno';
            osveziTrimUI();
            osveziHUD();
        }

        function posodobiStanjeZavorUI() {
            if (sim.zracneZavore) {
                ui.hudZavore.textContent = 'Zračne zavore: Odprte';
                ui.hudZavore.classList.add('aktivne');
                ui.ctrlZavore.classList.add('aktiven');
                ui.ctrlZavore.setAttribute('aria-pressed', 'true');
            } else {
                ui.hudZavore.textContent = 'Zračne zavore: Zaprte';
                ui.hudZavore.classList.remove('aktivne');
                ui.ctrlZavore.classList.remove('aktiven');
                ui.ctrlZavore.setAttribute('aria-pressed', 'false');
            }
        }

        function ponastaviPolet() {
            const profil = LETALA[sim.tipLetala];
            ustaviZvokVariometra();

            sim.stanje = 'NA_STEZI';
            sim.x = 0;
            sim.y = 0;
            sim.hitrost = 0;
            sim.nagib = 0.03;
            sim.polarniSpust = 0;
            sim.trenutnaFinesa = 0;
            sim.priporoceniRezim = 'najboljsi_dolet';
            sim.vario = 0;
            sim.gladkiVario = 0;
            sim.napetostZajle = 0;
            sim.mocVitla = 0;
            sim.zracneZavore = false;
            sim.vPrevleku = false;
            sim.resevanjePrevleka = false;
            sim.zracnaMasa = 'miren';
            sim.casLeta = 0;
            sim.maxVisina = 0;
            sim.ujetiTopliTokovi = 0;
            sim.ujetiTokoviIds.clear();
            sim.kotaljenje = false;
            sim.dotikVario = 0;
            sim.dotikNagibDeg = 0;
            sim.naslednjiTokX = 980;
            sim.naslednjiTokId = 1;
            sim.tokovi = [];
            sim.okrasniOblaki = [];
            sim.odpetaZajla = null;
            sim.hladniNasvetZadnji = -99;
            sim.visokaNapetostZadnji = -99;
            sim.nizkaHitrostZadnji = -99;
            sim.visokaHitrostZadnji = -99;
            sim.kameraX = 360;
            sim.kameraY = 95;
            sim.kameraZoom = Math.max(0.50, Math.min(1.14, (sim.sirina / 960) * 1.14));

            if (sim.rezimHitrosti === 'rocno') {
                sim.ciljnaHitrostKmh = omeji(
                    sim.ciljnaHitrostKmh,
                    profil.hitrostPrevleka + 6,
                    profil.maxHitrost - 15
                );
            } else {
                sim.ciljnaHitrostKmh = pridobiHitrostRezima(profil, sim.rezimHitrosti);
            }

            vhod.tipkaSpace = false;
            vhod.tipkaGor = false;
            vhod.tipkaDol = false;
            vhod.gumbVitel = false;
            vhod.gumbGor = false;
            vhod.gumbDol = false;

            generirajTokoveDo(4200);
            generirajOkrasneOblakeDo(4200);

            ui.povzetekPristanka.classList.add('skrito');
            ui.opozoriloPrevlek.classList.add('skrito');
            posodobiStanjeZavorUI();
            osveziTrimUI();
            pokaziNasvet('Držite preslednico ali gumb "Vzlet z vitlom" za začetek vzleta na Moškanjcih.', 'info', 6.5);
            osveziHUD();
        }

        function prilagodiVelikostPlatna() {
            const pravokotnik = ovoj.getBoundingClientRect();
            const novaSirina = Math.max(280, Math.round(pravokotnik.width));
            const novaVisina = Math.max(240, Math.round(pravokotnik.height));
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            if (sim.sirina !== novaSirina || sim.visina !== novaVisina || sim.dpr !== dpr) {
                sim.sirina = novaSirina;
                sim.visina = novaVisina;
                sim.dpr = dpr;
                platno.width = Math.round(novaSirina * dpr);
                platno.height = Math.round(novaVisina * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        }

        //**********************************************************
        // 9. Pomožne metode za odklop zajle in zaključek pristanka*
        //**********************************************************
        function ustvariPadajocoZajlo(zacetekX, zacetekY) {
            sim.odpetaZajla = {
                aktivna: true,
                padalceX: zacetekX,
                padalceY: Math.max(2, zacetekY),
                vitelX: X_VITEL,
                vitelY: 0,
                vx: 2.5,
                vy: -14.0,
                nihanje: 0,
                naTlehCas: 0
            };
        }

        function odpniZajlo(razlog) {
            if (sim.stanje !== 'VZLET_Z_VITLOM') {
                return;
            }
            const profil = LETALA[sim.tipLetala];
            ustvariPadajocoZajlo(sim.x, sim.y);

            sim.stanje = 'PROSTI_LET';
            sim.napetostZajle = 0;
            sim.mocVitla = 0;

            if (sim.y < 1.5) {
                // Predčasen odklop še na tleh preide v kotaljenje do zaustavitve
                sim.stanje = 'PRISTANEK';
                sim.kotaljenje = true;
                sim.dotikVario = 0;
                sim.dotikNagibDeg = 0;
                pokaziNasvet('Zajla odpeta na tleh — letalo se varno ustavlja.', 'info', 3.5);
                return;
            }

            const varnaHitrost = kmhVMs(profil.hitrostPrevleka) * 1.18;
            if (sim.hitrost < varnaHitrost) {
                sim.hitrost = varnaHitrost;
            }
            sim.nagib = omeji(sim.nagib, -0.25, 0.22);

            if (razlog === 'preobremenitev') {
                pokaziNasvet('Varnostni odklop zajle pri 100 % napetosti! Nadaljuj prosti let.', 'opozorilo', 4.5);
            } else if (razlog === 'vrh') {
                pokaziNasvet('Samodejni odklop zajle na vrhu vzpenjanja — poišči topli tok!', 'info', 4.5);
            } else {
                pokaziNasvet('Zajla odpeta! Uravnavaj hitrost in išči zlate tople tokove.', 'info', 4.0);
            }
            osveziHUD();
        }

        function zakljuciPristanek() {
            const profil = LETALA[sim.tipLetala];
            const spustAbs = Math.abs(sim.dotikVario);
            let ocenaBesedilo = 'Varen pristanek';
            let ocenaRazred = 'ocena-varen';

            if (spustAbs <= 1.5 && sim.dotikNagibDeg >= -5 && sim.dotikNagibDeg <= 12) {
                ocenaBesedilo = 'Odličen mehak pristanek!';
                ocenaRazred = 'ocena-odlicen';
            } else if (spustAbs > 2.9 || sim.dotikNagibDeg < -12) {
                ocenaBesedilo = 'Trd pristanek — naslednjič bolj ublaži dotik!';
                ocenaRazred = 'ocena-trd';
            }

            ui.pristanekOcena.textContent = ocenaBesedilo;
            ui.pristanekOcena.className = ocenaRazred;
            ui.rezultatVisina.textContent = Math.round(sim.maxVisina) + ' m';
            ui.rezultatCas.textContent = oblikujCas(sim.casLeta);
            ui.rezultatRazdalja.textContent = oblikujDecimalno(Math.max(0, sim.x) / 1000, 2) + ' km';
            ui.rezultatTermike.textContent = String(sim.ujetiTopliTokovi);
            ui.rezultatPodrobnosti.textContent =
                'Dotik s stezo: ' + oblikujDecimalno(sim.dotikVario, 1) + ' m/s · Zrakoplov: ' + profil.naziv;

            ui.opozoriloPrevlek.classList.add('skrito');
            skrijNasvet();
            ui.povzetekPristanka.classList.remove('skrito');
        }

        //**********************************************************
        // 10. Izračun navpičnega toka zračne mase na lokaciji     *
        //**********************************************************
        function izracunajZracniTok() {
            let skupniTok = 0;
            let najdenTopli = null;
            let najdenHladni = null;

            for (let i = 0; i < sim.tokovi.length; i += 1) {
                const tok = sim.tokovi[i];
                const dx = Math.abs(sim.x - tok.x);
                if (dx < tok.polmer && sim.y <= tok.visinaOblaka + 15) {
                    const profilVod = Math.cos((dx / tok.polmer) * (Math.PI * 0.5));
                    let profilVis = 1.0;
                    if (sim.y < 15) {
                        profilVis = 0;
                    } else if (sim.y < 35) {
                        profilVis = omeji((sim.y - 15) / 20, 0, 1.0);
                    } else if (sim.y > tok.visinaOblaka * 0.85) {
                        const delez = (tok.visinaOblaka + 15 - sim.y) / (tok.visinaOblaka * 0.15 + 15);
                        profilVis = omeji(delez, 0, 1);
                    }

                    const prispevek = tok.moc * profilVod * profilVis;
                    skupniTok += prispevek;
                    if (tok.tip === 'toplo' && profilVod > 0.12) {
                        najdenTopli = tok;
                    } else if (tok.tip === 'hladno' && profilVod > 0.12) {
                        najdenHladni = tok;
                    }
                }
            }

            if (skupniTok > 0.35 && najdenTopli) {
                sim.zracnaMasa = 'toplo';
                if (!sim.ujetiTokoviIds.has(najdenTopli.id)) {
                    sim.ujetiTokoviIds.add(najdenTopli.id);
                    sim.ujetiTopliTokovi += 1;
                    pokaziNasvet('Topli tok ujet! Termika dviga letalo — Min. spuščanje (1) najbolje izkoristi vzgornik.', 'info', 3.4);
                }
            } else if (skupniTok < -0.35 && najdenHladni) {
                sim.zracnaMasa = 'hladno';
                if (sim.animacijaCas - sim.hladniNasvetZadnji > 7.0) {
                    sim.hladniNasvetZadnji = sim.animacijaCas;
                    pokaziNasvet('Hladni tok: izberi Hitri prelet (3) ali potisni nos dol (S / ↓) za hiter prelet spusta!', 'hladno', 3.8);
                }
            } else {
                sim.zracnaMasa = 'miren';
            }

            return skupniTok;
        }

        //**********************************************************
        // 11. Fizikalni korak simulacije (60 FPS, omejen dt)      *
        //**********************************************************
        function izracunajOsnovniSpust(profil, vMs) {
            const vBest = kmhVMs(profil.najboljsaHitrost);
            const vVarna = Math.max(vMs, kmhVMs(profil.hitrostPrevleka) * 0.65);
            return 0.5 * (vBest / profil.finesa) * (Math.pow(vVarna / vBest, 3) + (vBest / Math.max(2, vVarna)));
        }

        function izracunajNaravniSpust(profil, vMs) {
            const vBest = kmhVMs(profil.najboljsaHitrost);
            const wPolara = izracunajOsnovniSpust(profil, vMs);
            const wZavore = sim.zracneZavore
                ? profil.zavoreSpust * omeji(Math.pow(vMs / vBest, 2), 0.5, 2.4)
                : 0;
            const wPrevlek = sim.vPrevleku ? 1.85 : 0;
            return wPolara + wZavore + wPrevlek;
        }

        function izracunajRavnotezniKot(profil, vMs) {
            return -Math.asin(omeji(izracunajNaravniSpust(profil, vMs) / Math.max(4, vMs), 0.01, 0.55));
        }

        function posodobiStanjePrevleka(vPrevlek) {
            if (sim.hitrost <= vPrevlek) {
                sim.vPrevleku = true;
                sim.resevanjePrevleka = true;
            } else if (sim.resevanjePrevleka && sim.hitrost >= vPrevlek * 1.16) {
                sim.vPrevleku = false;
                sim.resevanjePrevleka = false;
            } else if (!sim.resevanjePrevleka) {
                sim.vPrevleku = false;
            }
        }

        function posodobiPadajocoZajlo(dt) {
            const z = sim.odpetaZajla;
            if (!z || !z.aktivna) {
                return;
            }
            if (z.padalceY > 0.4) {
                z.nihanje += dt * 4.2;
                z.vx = 2.8 + Math.sin(z.nihanje * 0.7) * 1.4;
                z.padalceX += z.vx * dt;
                z.padalceY = Math.max(0, z.padalceY + z.vy * dt);
            } else {
                z.padalceY = 0;
                z.naTlehCas += dt;
                if (z.naTlehCas > 6.0) {
                    z.aktivna = false;
                }
            }
        }

        function posodobiDelceTokov(dt) {
            for (let i = 0; i < sim.tokovi.length; i += 1) {
                const tok = sim.tokovi[i];
                for (let j = 0; j < tok.delci.length; j += 1) {
                    const delec = tok.delci[j];
                    delec.napredek += delec.hitrost * dt;
                    if (delec.napredek > 1) {
                        delec.napredek -= 1;
                    } else if (delec.napredek < 0) {
                        delec.napredek += 1;
                    }
                }
            }
        }

        function posodobiFiziko(dt) {
            const profil = LETALA[sim.tipLetala];
            const vreme = VREMENA[sim.tipVremena];
            const vPrevlek = kmhVMs(profil.hitrostPrevleka);
            const vMax = kmhVMs(profil.maxHitrost);

            const vitelDrzan = vhod.tipkaSpace || vhod.gumbVitel;
            const nosGor = vhod.tipkaGor || vhod.gumbGor;
            const nosDol = vhod.tipkaDol || vhod.gumbDol;
            const krmiloNagiba = (nosGor ? 1 : 0) - (nosDol ? 1 : 0);

            sim.animacijaCas += dt;
            posodobiDelceTokov(dt);
            posodobiPadajocoZajlo(dt);

            if (sim.nasvetPreostanek > 0) {
                sim.nasvetPreostanek -= dt;
                if (sim.nasvetPreostanek <= 0) {
                    skrijNasvet();
                }
            }

            // Generiraj nove tokove in oblake daleč pred jadralnim letalom
            generirajTokoveDo(sim.x + 3600);
            generirajOkrasneOblakeDo(sim.x + 3600);

            if (sim.stanje === 'NA_STEZI') {
                sim.vario = 0;
                sim.gladkiVario = 0;
                sim.napetostZajle = 0;
                sim.zracnaMasa = 'miren';
                sim.polarniSpust = 0;
                sim.trenutnaFinesa = 0;
                sim.priporoceniRezim = 'najboljsi_dolet';
                if (vitelDrzan) {
                    sim.stanje = 'VZLET_Z_VITLOM';
                    sim.mocVitla = 0.12;
                    pokaziNasvet('Vitel pospešuje po stezi — ob vzletu zmerno vodi nos navzgor!', 'info', 4.0);
                }
            } else if (sim.stanje === 'VZLET_Z_VITLOM') {
                sim.casLeta += dt;

                if (vitelDrzan) {
                    sim.mocVitla = Math.min(1, sim.mocVitla + dt * 2.2);
                } else {
                    sim.mocVitla = Math.max(0, sim.mocVitla - dt * 2.8);
                }

                const vVzlet = vPrevlek * 1.08;
                const vCilj = kmhVMs(profil.vlecnaHitrost);

                if (sim.y <= 0.05) {
                    // Pospeševanje po travnati stezi pred dvigom
                    const trenje = 0.8 + sim.hitrost * 0.04;
                    const vlecniPospesek = sim.mocVitla * profil.pospesekVitla;
                    sim.hitrost = omeji(sim.hitrost + (vlecniPospesek - trenje) * dt, 0, vCilj);
                    sim.x += sim.hitrost * dt;
                    sim.y = 0;
                    sim.nagib = 0.04 + (sim.hitrost / vVzlet) * 0.14;
                    sim.vario = 0;
                    sim.napetostZajle = sim.mocVitla * 52;
                    sim.polarniSpust = sim.hitrost > 2 ? izracunajNaravniSpust(profil, sim.hitrost) : 0;
                    sim.trenutnaFinesa = sim.polarniSpust > 0.01 ? sim.hitrost / Math.max(0.2, sim.polarniSpust) : 0;
                    sim.priporoceniRezim = 'najboljsi_dolet';

                    if (sim.hitrost >= vVzlet && vitelDrzan) {
                        sim.y = 0.35;
                        sim.nagib = 0.24;
                    } else if (!vitelDrzan && sim.hitrost < 0.4) {
                        sim.hitrost = 0;
                        sim.stanje = 'NA_STEZI';
                        sim.napetostZajle = 0;
                    }
                } else {
                    // Vzpenjanje na jekleni zajli ali drsenje brez vleke vitla
                    const dxVitel = Math.max(20, X_VITEL - sim.x);
                    const kotZajle = Math.atan2(sim.y, dxVitel);

                    posodobiStanjePrevleka(vPrevlek);

                    if (sim.resevanjePrevleka) {
                        // Samodejen spust nosu ob prevleku prepreči lažno vzpenjanje brez vleke
                        sim.nagib += (-0.30 - sim.nagib) * Math.min(1, dt * 2.8);
                        ui.opozoriloPrevlek.classList.remove('skrito');
                    } else {
                        ui.opozoriloPrevlek.classList.add('skrito');
                        if (vitelDrzan) {
                            sim.nagib += krmiloNagiba * profil.odzivnost * 0.92 * dt;
                            if (krmiloNagiba === 0) {
                                // Naraven vzgonski moment zajle na trebuhu trupa
                                sim.nagib += (0.62 - sim.nagib) * 0.58 * dt;
                            }
                        } else if (krmiloNagiba !== 0) {
                            sim.nagib += krmiloNagiba * profil.odzivnost * 0.88 * dt;
                        } else {
                            // Brez vleke vitla vzdolžni trim uravna nos proti ciljni hitrosti drsenja
                            const vCiljTrim = kmhVMs(sim.ciljnaHitrostKmh);
                            const ciljniNagib = izracunajRavnotezniKot(profil, vCiljTrim)
                                + omeji(0.032 * (sim.hitrost - vCiljTrim), -0.26, 0.26);
                            sim.nagib += (ciljniNagib - sim.nagib) * Math.min(1, dt * 2.2);
                        }
                    }
                    sim.nagib = omeji(sim.nagib, vitelDrzan ? -0.18 : -0.78, 0.88);

                    if (vitelDrzan) {
                        const zeljaHitrost = vCilj * (0.94 + Math.max(0, 0.5 - sim.nagib) * 0.22);
                        const pospesekVleke = (zeljaHitrost - sim.hitrost) * 1.85 + GRAVITACIJA * Math.sin(sim.nagib) * 0.85;
                        const naravniSpust = izracunajNaravniSpust(profil, sim.hitrost);
                        const upor = GRAVITACIJA * naravniSpust / Math.max(5, sim.hitrost);
                        sim.hitrost = omeji(sim.hitrost + (pospesekVleke - upor) * dt, vPrevlek * 0.85, vMax);
                    } else {
                        const naravniSpust = izracunajNaravniSpust(profil, sim.hitrost);
                        const pospesek = -GRAVITACIJA * Math.sin(sim.nagib)
                            - GRAVITACIJA * (naravniSpust / Math.max(4.5, sim.hitrost));
                        sim.hitrost = omeji(sim.hitrost + pospesek * dt, vPrevlek * 0.78, vMax);
                    }

                    const naravniSpust = izracunajNaravniSpust(profil, sim.hitrost);
                    const vx = Math.max(2.5, sim.hitrost * Math.cos(sim.nagib));
                    const vy = vitelDrzan
                        ? sim.hitrost * Math.sin(sim.nagib) - naravniSpust * 0.35
                        : sim.hitrost * Math.sin(sim.nagib);

                    sim.x += vx * dt;
                    sim.y += vy * dt;
                    sim.vario = vy;
                    sim.polarniSpust = naravniSpust;
                    sim.trenutnaFinesa = sim.hitrost / Math.max(0.2, naravniSpust);
                    sim.priporoceniRezim = 'najboljsi_dolet';

                    if (vitelDrzan) {
                        const stresNagiba = Math.max(0, (sim.nagib - 0.40) * 62) + Math.max(0, (sim.nagib - 0.72) * 185);
                        const stresHitrosti = Math.max(0, (sim.hitrost - vCilj) * 3.0);
                        const stresKota = Math.max(0, (kotZajle - 0.88) * 36);
                        const ciljnaNapetost = omeji(48 * sim.mocVitla + stresNagiba + stresHitrosti + stresKota, 10, 108);
                        sim.napetostZajle += (ciljnaNapetost - sim.napetostZajle) * Math.min(1, dt * 1.65);
                    } else {
                        sim.napetostZajle += (12 - sim.napetostZajle) * Math.min(1, dt * 5.0);
                    }

                    if (sim.napetostZajle > 85 && sim.napetostZajle < 100) {
                        if (sim.animacijaCas - sim.visokaNapetostZadnji > 2.2) {
                            sim.visokaNapetostZadnji = sim.animacijaCas;
                            pokaziNasvet('Pozor: visoka napetost zajle (> 85 %)! Znižaj nos (S / ↓).', 'opozorilo', 2.4);
                        }
                    }

                    if (sim.napetostZajle >= 100) {
                        sim.napetostZajle = 100;
                        odpniZajlo('preobremenitev');
                    } else if (sim.y >= 395 || (sim.y > 160 && kotZajle >= 1.26) || sim.x >= X_VITEL - 60) {
                        odpniZajlo('vrh');
                    } else if (sim.y <= 0) {
                        if (vitelDrzan && sim.y > -2 && vy > -2.5) {
                            sim.y = 0;
                            sim.nagib = 0.05;
                        } else {
                            sim.y = 0;
                            sim.stanje = 'PRISTANEK';
                            sim.kotaljenje = true;
                            sim.vPrevleku = false;
                            sim.resevanjePrevleka = false;
                            sim.dotikVario = vy;
                            sim.dotikNagibDeg = sim.nagib * (180 / Math.PI);
                            ui.opozoriloPrevlek.classList.add('skrito');
                            ustaviZvokVariometra();
                        }
                    }
                }
            } else if (sim.stanje === 'PROSTI_LET') {
                sim.casLeta += dt;

                // Preveri prevlečen let in samodejno reševanje
                posodobiStanjePrevleka(vPrevlek);

                if (sim.resevanjePrevleka) {
                    // Samodejen spust nosu za ponovno pridobitev vzgonske hitrosti
                    sim.nagib += (-0.30 - sim.nagib) * Math.min(1, dt * 2.8);
                    ui.opozoriloPrevlek.classList.remove('skrito');
                } else {
                    ui.opozoriloPrevlek.classList.add('skrito');

                    if (krmiloNagiba !== 0) {
                        sim.nagib += krmiloNagiba * profil.odzivnost * 0.88 * dt;
                        if (sim.hitrost < vPrevlek * 1.10 && krmiloNagiba > 0) {
                            if (sim.animacijaCas - sim.nizkaHitrostZadnji > 3.5) {
                                sim.nizkaHitrostZadnji = sim.animacijaCas;
                                pokaziNasvet('Nizka hitrost! Popusti nos navzdol (S / ↓), da preprečiš prevlek.', 'opozorilo', 2.8);
                            }
                        }
                    } else {
                        // Vzdolžni trim vzdržuje izbrano ciljno hitrost in ravnotežni kot drsenja
                        const vCilj = kmhVMs(sim.ciljnaHitrostKmh);
                        const ciljniNagib = izracunajRavnotezniKot(profil, vCilj) + omeji(0.032 * (sim.hitrost - vCilj), -0.26, 0.26);
                        sim.nagib += (ciljniNagib - sim.nagib) * Math.min(1, dt * 2.2);
                    }

                    if (sim.hitrost > vMax * 0.90) {
                        if (sim.animacijaCas - sim.visokaHitrostZadnji > 3.5) {
                            sim.visokaHitrostZadnji = sim.animacijaCas;
                            pokaziNasvet('Visoka hitrost blizu omejitve — rahlo dvigni nos (W / ↑) ali odpri zavore!', 'opozorilo', 2.8);
                        }
                    }
                }
                sim.nagib = omeji(sim.nagib, -0.78, 0.78);

                const tokZracneMase = izracunajZracniTok();
                const faktorTal = omeji(sim.y / 18, 0, 1);
                const turbulenca = vreme.turbulenca * faktorTal * Math.sin(sim.animacijaCas * 2.3 + sim.x * 0.02);
                const wZrak = tokZracneMase + turbulenca;

                const naravniSpust = izracunajNaravniSpust(profil, sim.hitrost);
                const uporPos = GRAVITACIJA * (naravniSpust / Math.max(4.5, sim.hitrost));
                const dV = (-GRAVITACIJA * Math.sin(sim.nagib) - uporPos) * dt;
                sim.hitrost = omeji(sim.hitrost + dV, vPrevlek * 0.78, vMax);

                const vx = Math.max(2.5, sim.hitrost * Math.cos(sim.nagib));
                let vy = sim.hitrost * Math.sin(sim.nagib) + wZrak;
                if (sim.y < 8 && vy < -0.6 && !sim.zracneZavore) {
                    // Blag talni učinek (ground effect) tik nad travnato stezo
                    const blazenje = (1 - sim.y / 8) * 0.35;
                    vy = vy * (1 - blazenje);
                }

                sim.x += vx * dt;
                sim.y += vy * dt;
                sim.vario = vy;
                sim.polarniSpust = izracunajNaravniSpust(profil, sim.hitrost);
                sim.trenutnaFinesa = sim.hitrost / Math.max(0.2, sim.polarniSpust);
                sim.priporoceniRezim = pridobiPriporoceniRezim(sim.zracnaMasa);

                if (sim.y <= 0) {
                    sim.y = 0;
                    sim.stanje = 'PRISTANEK';
                    sim.kotaljenje = true;
                    sim.vPrevleku = false;
                    sim.resevanjePrevleka = false;
                    sim.dotikVario = vy;
                    sim.dotikNagibDeg = sim.nagib * (180 / Math.PI);
                    ui.opozoriloPrevlek.classList.add('skrito');
                    ustaviZvokVariometra();
                }
            } else if (sim.stanje === 'PRISTANEK') {
                sim.vario = 0;
                sim.gladkiVario = 0;
                sim.zracnaMasa = 'miren';
                sim.polarniSpust = 0;
                sim.trenutnaFinesa = 0;
                sim.priporoceniRezim = 'najboljsi_dolet';
                sim.nagib += (0 - sim.nagib) * Math.min(1, dt * 6);

                if (sim.kotaljenje) {
                    const zavornoPojemanje = 4.2 + (sim.zracneZavore ? 3.5 : 0);
                    sim.hitrost = Math.max(0, sim.hitrost - zavornoPojemanje * dt);
                    sim.x += sim.hitrost * dt;
                    if (sim.hitrost <= 0.4) {
                        sim.hitrost = 0;
                        sim.kotaljenje = false;
                        zakljuciPristanek();
                    }
                }
            }

            if (sim.y > sim.maxVisina) {
                sim.maxVisina = sim.y;
            }

            sim.gladkiVario += (sim.vario - sim.gladkiVario) * Math.min(1, dt * 7.5);
            posodobiZvokVariometra();
            posodobiKamero(dt);
        }

        function posodobiKamero(dt) {
            const sirinaFaktor = sim.sirina / 960;
            let ciljZoom = 1.14 * sirinaFaktor;
            if (sim.y > 45) {
                const faktorVisine = omeji((sim.y - 45) / 420, 0, 1);
                ciljZoom = (1.14 - faktorVisine * 0.56) * sirinaFaktor;
            }
            ciljZoom = Math.max(0.45, Math.min(1.32, ciljZoom));
            sim.kameraZoom += (ciljZoom - sim.kameraZoom) * Math.min(1, dt * 3.5);

            const vidnaSirinaM = sim.sirina / sim.kameraZoom;
            const vidnaVisinaM = sim.visina / sim.kameraZoom;

            let ciljX = sim.x + vidnaSirinaM * 0.24;
            if (sim.stanje === 'NA_STEZI') {
                ciljX = Math.max(sim.x + vidnaSirinaM * 0.36, X_VITEL * 0.50);
            }
            const tlaOdmikM = Math.max(38, 62 / sim.kameraZoom);
            const minKameraY = vidnaVisinaM * 0.5 - tlaOdmikM;
            const ciljY = Math.max(minKameraY, sim.y + vidnaVisinaM * 0.04);

            sim.kameraX += (ciljX - sim.kameraX) * Math.min(1, dt * 6.5);
            sim.kameraY += (ciljY - sim.kameraY) * Math.min(1, dt * 5.0);
        }

        //**********************************************************
        // 12. Osveževanje HUD instrumentov                        *
        //**********************************************************
        function osveziHUD() {
            const profil = LETALA[sim.tipLetala];
            const faze = {
                NA_STEZI: 'Na stezi',
                VZLET_Z_VITLOM: 'Vzlet z vitlom',
                PROSTI_LET: 'Prosti let',
                PRISTANEK: sim.kotaljenje ? 'Iztek po stezi' : 'Pristanek'
            };

            const trenutnaKmh = msVKmh(sim.hitrost);
            ui.hudVisina.textContent = Math.round(sim.y) + ' m';
            ui.hudHitrost.textContent = Math.round(trenutnaKmh) + ' km/h';

            if (ui.hudCiljHitrost) {
                ui.hudCiljHitrost.textContent = 'Cilj: ' + Math.round(sim.ciljnaHitrostKmh) + ' km/h';
            }

            if (ui.hudPolara) {
                if (sim.polarniSpust > 0.01) {
                    ui.hudPolara.textContent = 'Polara: -' + oblikujDecimalno(sim.polarniSpust, 1)
                        + ' m/s · L/D ' + Math.round(sim.trenutnaFinesa);
                } else {
                    ui.hudPolara.textContent = 'Polara: 0,0 m/s · L/D —';
                }
            }

            if (ui.hitrostTrak) {
                const maxKmh = profil.maxHitrost;
                const prevlekPct = omeji((profil.hitrostPrevleka / maxKmh) * 100, 0, 100);
                const minSpustPct = omeji((profil.hitrostMinSpust / maxKmh) * 100, 0, 100);
                const bestPct = omeji((profil.najboljsaHitrost / maxKmh) * 100, 0, 100);
                const hitriPct = omeji((profil.hitrostHitriPrelet / maxKmh) * 100, 0, 100);
                const ciljPct = omeji((sim.ciljnaHitrostKmh / maxKmh) * 100, 0, 100);
                const trenutnaPct = omeji((trenutnaKmh / maxKmh) * 100, 0, 100);

                if (ui.hitrostPrevlekCona) {
                    ui.hitrostPrevlekCona.style.width = prevlekPct.toFixed(1) + '%';
                }
                if (ui.hitrostOznakaMin) {
                    ui.hitrostOznakaMin.style.left = minSpustPct.toFixed(1) + '%';
                }
                if (ui.hitrostOznakaBest) {
                    ui.hitrostOznakaBest.style.left = bestPct.toFixed(1) + '%';
                }
                if (ui.hitrostOznakaHitri) {
                    ui.hitrostOznakaHitri.style.left = hitriPct.toFixed(1) + '%';
                }
                if (ui.hitrostCiljOznaka) {
                    ui.hitrostCiljOznaka.style.left = ciljPct.toFixed(1) + '%';
                }
                if (ui.hitrostPolnilo) {
                    ui.hitrostPolnilo.style.width = trenutnaPct.toFixed(1) + '%';
                }
                if (ui.hitrostTrenutnaOznaka) {
                    ui.hitrostTrenutnaOznaka.style.left = trenutnaPct.toFixed(1) + '%';
                }

                ui.hitrostTrak.classList.toggle('hitrost-prevlek', sim.vPrevleku);
                ui.hitrostTrak.classList.toggle('hitrost-hitra', trenutnaKmh > maxKmh * 0.90);
            }

            osveziPriporociloTrim();

            const varioZaPrikaz = Math.abs(sim.gladkiVario) < 0.05 ? 0 : sim.gladkiVario;
            const predznak = varioZaPrikaz > 0 ? '+' : '';
            ui.hudVario.textContent = predznak + oblikujDecimalno(varioZaPrikaz, 1) + ' m/s';

            const obsegVario = 6.0;
            if (varioZaPrikaz >= 0) {
                ui.varioDvig.style.width = omeji((varioZaPrikaz / obsegVario) * 100, 0, 100) + '%';
                ui.varioSpust.style.width = '0%';
            } else {
                ui.varioSpust.style.width = omeji((Math.abs(varioZaPrikaz) / obsegVario) * 100, 0, 100) + '%';
                ui.varioDvig.style.width = '0%';
            }

            const napetostPct = Math.round(sim.napetostZajle);
            ui.hudZajla.textContent = napetostPct + ' %';
            ui.zajlaMerilnik.style.width = omeji(napetostPct, 0, 100) + '%';
            ui.zajlaMerilnik.classList.remove('napetost-visoka', 'napetost-kriticna');
            if (napetostPct >= 85) {
                ui.zajlaMerilnik.classList.add('napetost-kriticna');
            } else if (napetostPct >= 68) {
                ui.zajlaMerilnik.classList.add('napetost-visoka');
            }

            ui.hudZracnaMasa.classList.remove('zracna-miren', 'zracna-toplo', 'zracna-hladno');
            if (sim.zracnaMasa === 'toplo') {
                ui.hudZracnaMasa.textContent = 'Topli tok ↑';
                ui.hudZracnaMasa.classList.add('zracna-toplo');
            } else if (sim.zracnaMasa === 'hladno') {
                ui.hudZracnaMasa.textContent = 'Hladni tok ↓';
                ui.hudZracnaMasa.classList.add('zracna-hladno');
            } else {
                ui.hudZracnaMasa.textContent = 'Miren zrak';
                ui.hudZracnaMasa.classList.add('zracna-miren');
            }

            ui.hudFaza.textContent = faze[sim.stanje] || 'V pripravljenosti';
        }

        //**********************************************************
        // 13. Pretvorba svetovnih koordinat v zaslonske in izris  *
        //**********************************************************
        function vPlatnoX(svetX) {
            return (svetX - sim.kameraX) * sim.kameraZoom + sim.sirina * 0.5;
        }

        function vPlatnoY(svetY) {
            return sim.visina * 0.5 - (svetY - sim.kameraY) * sim.kameraZoom;
        }

        function izrisiNeboInNebesnaTelesa(jeSvetla) {
            const w = sim.sirina;
            const h = sim.visina;
            const nebo = ctx.createLinearGradient(0, 0, 0, h);

            if (jeSvetla) {
                nebo.addColorStop(0, '#0284c7');
                nebo.addColorStop(0.55, '#7dd3fc');
                nebo.addColorStop(1, '#fef3c7');
            } else {
                nebo.addColorStop(0, '#040814');
                nebo.addColorStop(0.55, '#0b142c');
                nebo.addColorStop(1, '#1e3a5f');
            }
            ctx.fillStyle = nebo;
            ctx.fillRect(0, 0, w, h);

            if (jeSvetla) {
                const sonceX = w * 0.82;
                const sonceY = h * 0.19;
                const sij = ctx.createRadialGradient(sonceX, sonceY, 8, sonceX, sonceY, 72);
                sij.addColorStop(0, 'rgba(254, 249, 195, 0.98)');
                sij.addColorStop(0.35, 'rgba(253, 224, 71, 0.45)');
                sij.addColorStop(1, 'rgba(253, 224, 71, 0)');
                ctx.fillStyle = sij;
                ctx.beginPath();
                ctx.arc(sonceX, sonceY, 72, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(sonceX, sonceY, 22, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Zvezde v temnem načinu
                for (let i = 0; i < sim.zvezde.length; i += 1) {
                    const z = sim.zvezde[i];
                    const utrip = 0.45 + 0.55 * Math.sin(sim.animacijaCas * 1.5 + z.faza);
                    ctx.fillStyle = 'rgba(248, 250, 252, ' + (utrip * 0.8).toFixed(2) + ')';
                    ctx.beginPath();
                    ctx.arc(z.fx * w, z.fy * h, z.velikost, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Luna s svetlim sijem
                const lunaX = w * 0.83;
                const lunaY = h * 0.18;
                const sij = ctx.createRadialGradient(lunaX, lunaY, 10, lunaX, lunaY, 58);
                sij.addColorStop(0, 'rgba(226, 232, 240, 0.45)');
                sij.addColorStop(1, 'rgba(226, 232, 240, 0)');
                ctx.fillStyle = sij;
                ctx.beginPath();
                ctx.arc(lunaX, lunaY, 58, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.arc(lunaX, lunaY, 18, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function izrisiHalozeInPtuj(tlaY, jeSvetla) {
            const w = sim.sirina;
            if (tlaY < -40 || tlaY > sim.visina + 85) {
                return;
            }
            const osnovaY = tlaY;

            // Oddaljena silhueta Ptujskega gradu in mesta Ptuj (paralaksa)
            const ptujOdmik = -(sim.kameraX * 0.06);
            const ptujX = ((ptujOdmik % (w + 400)) + (w + 400)) % (w + 400) - 120;
            ctx.fillStyle = jeSvetla ? 'rgba(71, 85, 105, 0.28)' : 'rgba(30, 41, 59, 0.72)';
            ctx.beginPath();
            ctx.moveTo(ptujX - 75, osnovaY);
            ctx.lineTo(ptujX - 55, osnovaY - 26);
            ctx.lineTo(ptujX - 18, osnovaY - 34);
            ctx.lineTo(ptujX + 12, osnovaY - 34);
            ctx.lineTo(ptujX + 24, osnovaY - 46);
            ctx.lineTo(ptujX + 34, osnovaY - 32);
            ctx.lineTo(ptujX + 68, osnovaY - 22);
            ctx.lineTo(ptujX + 86, osnovaY);
            ctx.closePath();
            ctx.fill();

            // Zvonik ob Ptuju
            ctx.fillRect(ptujX + 44, osnovaY - 48, 6, 24);
            ctx.beginPath();
            ctx.moveTo(ptujX + 43, osnovaY - 48);
            ctx.lineTo(ptujX + 47, osnovaY - 58);
            ctx.lineTo(ptujX + 51, osnovaY - 48);
            ctx.closePath();
            ctx.fill();

            // Valovito gričevje Haloze (paralaksa 1 in 2)
            const plasti = [
                {
                    hitrost: 0.12,
                    visina: 54,
                    val1: 0.0045,
                    val2: 0.009,
                    barva: jeSvetla ? 'rgba(101, 163, 13, 0.35)' : 'rgba(15, 34, 58, 0.85)'
                },
                {
                    hitrost: 0.22,
                    visina: 34,
                    val1: 0.0068,
                    val2: 0.013,
                    barva: jeSvetla ? 'rgba(77, 124, 15, 0.52)' : 'rgba(19, 44, 62, 0.92)'
                }
            ];

            for (let p = 0; p < plasti.length; p += 1) {
                const plast = plasti[p];
                ctx.fillStyle = plast.barva;
                ctx.beginPath();
                ctx.moveTo(0, osnovaY + 4);
                for (let sx = 0; sx <= w + 24; sx += 24) {
                    const svet = sx + sim.kameraX * plast.hitrost;
                    const hrib = Math.sin(svet * plast.val1) * (plast.visina * 0.55)
                        + Math.cos(svet * plast.val2 + 1.2) * (plast.visina * 0.32)
                        + plast.visina * 0.72;
                    ctx.lineTo(sx, osnovaY - Math.max(6, hrib));
                }
                ctx.lineTo(w, osnovaY + 4);
                ctx.closePath();
                ctx.fill();
            }

            if (!jeSvetla) {
                // Drobne lučke v dolini Drave v temnem načinu
                ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
                for (let i = 0; i < 16; i += 1) {
                    const lx = ((i * 89 - sim.kameraX * 0.14) % w + w) % w;
                    const ly = osnovaY - 5 - (i % 4) * 3;
                    ctx.fillRect(lx, ly, 2.2, 2.2);
                }
            }
        }

        function izrisiOblak(sx, sy, sirinaPx, vrsta, jeSvetla) {
            const r = sirinaPx * 0.22;
            if (vrsta === 'toplo') {
                ctx.fillStyle = jeSvetla ? 'rgba(255, 255, 255, 0.94)' : 'rgba(226, 232, 240, 0.82)';
            } else if (vrsta === 'hladno') {
                ctx.fillStyle = jeSvetla ? 'rgba(148, 163, 184, 0.88)' : 'rgba(51, 65, 85, 0.88)';
            } else {
                ctx.fillStyle = jeSvetla ? 'rgba(255, 255, 255, 0.72)' : 'rgba(100, 116, 139, 0.45)';
            }

            ctx.beginPath();
            ctx.arc(sx - r * 1.1, sy, r * 0.85, 0, Math.PI * 2);
            ctx.arc(sx - r * 0.3, sy - r * 0.52, r * 1.05, 0, Math.PI * 2);
            ctx.arc(sx + r * 0.55, sy - r * 0.36, r * 0.95, 0, Math.PI * 2);
            ctx.arc(sx + r * 1.18, sy + r * 0.05, r * 0.72, 0, Math.PI * 2);
            ctx.fill();

            if (vrsta === 'toplo') {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
                ctx.fillRect(sx - r * 1.4, sy + r * 0.35, r * 2.8, Math.max(4, r * 0.35));
            } else if (vrsta === 'hladno') {
                ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
                ctx.fillRect(sx - r * 1.4, sy + r * 0.35, r * 2.8, Math.max(4, r * 0.35));
            }
        }

        function izrisiZracneTokove(jeSvetla) {
            // Okrasni oblaki v ozadju
            for (let i = 0; i < sim.okrasniOblaki.length; i += 1) {
                const oblak = sim.okrasniOblaki[i];
                const sx = vPlatnoX(oblak.x);
                const sy = vPlatnoY(oblak.y);
                if (sx < -250 || sx > sim.sirina + 250 || sy < -150 || sy > sim.visina + 100) {
                    continue;
                }
                izrisiOblak(sx, sy, oblak.sirina * Math.max(0.45, sim.kameraZoom * 0.65), 'miren', jeSvetla);
            }

            // Aktivni topli in hladni zračni stebri
            for (let i = 0; i < sim.tokovi.length; i += 1) {
                const tok = sim.tokovi[i];
                const sx = vPlatnoX(tok.x);
                const polmerPx = tok.polmer * sim.kameraZoom;
                if (sx + polmerPx < -80 || sx - polmerPx > sim.sirina + 80) {
                    continue;
                }

                const vrhY = vPlatnoY(tok.visinaOblaka);
                const dnoY = vPlatnoY(0);
                const jeTopli = tok.tip === 'toplo';

                const stolpecGrad = ctx.createLinearGradient(sx - polmerPx, 0, sx + polmerPx, 0);
                if (jeTopli) {
                    stolpecGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
                    stolpecGrad.addColorStop(0.5, jeSvetla ? 'rgba(245, 158, 11, 0.20)' : 'rgba(251, 191, 36, 0.16)');
                    stolpecGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
                } else {
                    stolpecGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
                    stolpecGrad.addColorStop(0.5, jeSvetla ? 'rgba(2, 132, 199, 0.20)' : 'rgba(56, 189, 248, 0.16)');
                    stolpecGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                }

                ctx.fillStyle = stolpecGrad;
                ctx.fillRect(sx - polmerPx, vrhY, polmerPx * 2, Math.max(0, dnoY - vrhY));

                // Animirani delci dviga ali spusta
                ctx.lineWidth = 2;
                for (let j = 0; j < tok.delci.length; j += 1) {
                    const delec = tok.delci[j];
                    const py = vPlatnoY(delec.napredek * tok.visinaOblaka);
                    if (py < -30 || py > sim.visina + 30) {
                        continue;
                    }
                    const zavoj = Math.sin(delec.napredek * Math.PI * 6 + sim.animacijaCas * 2) * 14 * sim.kameraZoom;
                    const px = vPlatnoX(tok.x + delec.odmikX) + zavoj;
                    const dolzina = delec.dolzina * Math.max(0.55, sim.kameraZoom * 0.7);
                    const alfa = Math.sin(delec.napredek * Math.PI) * 0.68;

                    ctx.strokeStyle = jeTopli
                        ? 'rgba(251, 191, 36, ' + alfa.toFixed(2) + ')'
                        : 'rgba(56, 189, 248, ' + alfa.toFixed(2) + ')';

                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + (jeTopli ? dolzina : -dolzina));
                    ctx.stroke();

                    // Majhna puščica na vrhu ali dnu črtice
                    ctx.beginPath();
                    if (jeTopli) {
                        ctx.moveTo(px - 4, py + 5);
                        ctx.lineTo(px, py);
                        ctx.lineTo(px + 4, py + 5);
                    } else {
                        ctx.moveTo(px - 4, py - 5);
                        ctx.lineTo(px, py);
                        ctx.lineTo(px + 4, py - 5);
                    }
                    ctx.stroke();
                }

                // Pripadajoči oblak na vrhu stolpca
                if (vrhY > -120 && vrhY < sim.visina + 80) {
                    const oblakSirina = Math.max(76, polmerPx * 1.45);
                    izrisiOblak(sx, vrhY - 12, oblakSirina, tok.tip, jeSvetla);
                }

                // Čitljiva oznaka stolpca, ko je blizu pogleda
                if (Math.abs(tok.x - sim.x) < 950) {
                    const napisY = omeji(vPlatnoY(Math.max(120, Math.min(tok.visinaOblaka - 40, sim.y + 70))), 42, sim.visina - 76);
                    ctx.font = '700 12px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = jeTopli
                        ? (jeSvetla ? '#b45309' : '#fbbf24')
                        : (jeSvetla ? '#0369a1' : '#7dd3fc');
                    ctx.fillText(jeTopli ? 'Topli tok ↑' : 'Hladni tok ↓', sx, napisY);
                }
            }
        }

        function izrisiTlaInMoskanjce(jeSvetla) {
            const tlaY = vPlatnoY(0);
            if (tlaY > sim.visina + 20) {
                return;
            }

            // Osnovna travnata površina Podravja
            const tlaGrad = ctx.createLinearGradient(0, tlaY, 0, sim.visina);
            if (jeSvetla) {
                tlaGrad.addColorStop(0, '#16a34a');
                tlaGrad.addColorStop(0.22, '#15803d');
                tlaGrad.addColorStop(1, '#14532d');
            } else {
                tlaGrad.addColorStop(0, '#0f3d2e');
                tlaGrad.addColorStop(0.28, '#0b2c23');
                tlaGrad.addColorStop(1, '#051412');
            }
            ctx.fillStyle = tlaGrad;
            ctx.fillRect(0, tlaY, sim.sirina, Math.max(0, sim.visina - tlaY));

            // Steza letališča Moškanjci
            const stezaLevo = vPlatnoX(STEZA_ZACETEK);
            const stezaDesno = vPlatnoX(STEZA_KONEC);
            if (stezaDesno > -40 && stezaLevo < sim.sirina + 40) {
                ctx.fillStyle = jeSvetla ? '#22c55e' : '#14532d';
                ctx.fillRect(stezaLevo, tlaY, stezaDesno - stezaLevo, 10);

                // Bele oznake praga steze in sredinska črta
                ctx.fillStyle = jeSvetla ? 'rgba(255, 255, 255, 0.88)' : 'rgba(226, 232, 240, 0.65)';
                for (let xm = -40; xm <= STEZA_KONEC - 40; xm += 45) {
                    const mx = vPlatnoX(xm);
                    if (mx > -20 && mx < sim.sirina + 20) {
                        ctx.fillRect(mx, tlaY + 3, Math.max(6, 14 * sim.kameraZoom), 2.5);
                    }
                }

                // Robne lučke steze v temnem načinu
                if (!jeSvetla) {
                    ctx.fillStyle = '#fbbf24';
                    for (let xm = -60; xm <= STEZA_KONEC; xm += 70) {
                        const lx = vPlatnoX(xm);
                        if (lx > -10 && lx < sim.sirina + 10) {
                            ctx.beginPath();
                            ctx.arc(lx, tlaY + 1, 2.3, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }

            // Klubski hangar Moškanjci pri x = -48 m
            const hangarX = vPlatnoX(-48);
            const meriloObjekta = Math.max(0.55, Math.min(1.15, sim.kameraZoom * 0.88));
            if (hangarX > -140 && hangarX < sim.sirina + 140) {
                const hw = 66 * meriloObjekta;
                const hh = 28 * meriloObjekta;
                ctx.fillStyle = jeSvetla ? '#cbd5e1' : '#334155';
                ctx.fillRect(hangarX - hw * 0.5, tlaY - hh, hw, hh);

                // Streha hangarja
                ctx.fillStyle = jeSvetla ? '#0284c7' : '#1e3a8a';
                ctx.beginPath();
                ctx.moveTo(hangarX - hw * 0.55, tlaY - hh);
                ctx.lineTo(hangarX, tlaY - hh - 13 * meriloObjekta);
                ctx.lineTo(hangarX + hw * 0.55, tlaY - hh);
                ctx.closePath();
                ctx.fill();

                // Vrata hangarja
                ctx.fillStyle = jeSvetla ? '#475569' : '#0f172a';
                ctx.fillRect(hangarX - hw * 0.25, tlaY - hh * 0.65, hw * 0.5, hh * 0.65);

                if (meriloObjekta > 0.65) {
                    ctx.fillStyle = jeSvetla ? '#0f172a' : '#f8fafc';
                    ctx.font = '700 ' + Math.round(9 * meriloObjekta) + 'px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('AK PTUJ', hangarX, tlaY - hh + 10 * meriloObjekta);
                }
            }

            // Veterna vreča (klobasa) pri x = 44 m
            const vrecaX = vPlatnoX(44);
            if (vrecaX > -60 && vrecaX < sim.sirina + 60) {
                const visinaDroga = 24 * meriloObjekta;
                ctx.strokeStyle = jeSvetla ? '#475569' : '#94a3b8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(vrecaX, tlaY);
                ctx.lineTo(vrecaX, tlaY - visinaDroga);
                ctx.stroke();

                const plapolanje = Math.sin(sim.animacijaCas * 4.5) * 2.5;
                const vrecaDolzina = 16 * meriloObjekta;
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(vrecaX, tlaY - visinaDroga);
                ctx.lineTo(vrecaX + vrecaDolzina, tlaY - visinaDroga + 3 + plapolanje);
                ctx.lineTo(vrecaX + vrecaDolzina, tlaY - visinaDroga + 7 + plapolanje);
                ctx.lineTo(vrecaX, tlaY - visinaDroga + 6);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(vrecaX + vrecaDolzina * 0.35, tlaY - visinaDroga + 2 + plapolanje * 0.4, vrecaDolzina * 0.25, 4);
            }

            // Vlečni vitel na koncu steze (X_VITEL = 750 m)
            const vitelX = vPlatnoX(X_VITEL);
            if (vitelX > -120 && vitelX < sim.sirina + 120) {
                const vw = 38 * meriloObjekta;
                const vh = 18 * meriloObjekta;
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(vitelX - vw * 0.5, tlaY - vh - 4 * meriloObjekta, vw, vh);
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(vitelX - vw * 0.45, tlaY - vh - 12 * meriloObjekta, vw * 0.42, 9 * meriloObjekta);

                // Boben z zajlo
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.arc(vitelX + vw * 0.18, tlaY - vh - 7 * meriloObjekta, 6 * meriloObjekta, 0, Math.PI * 2);
                ctx.fill();

                // Kolesa tovornjaka
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(vitelX - vw * 0.28, tlaY - 4 * meriloObjekta, 4.5 * meriloObjekta, 0, Math.PI * 2);
                ctx.arc(vitelX + vw * 0.28, tlaY - 4 * meriloObjekta, 4.5 * meriloObjekta, 0, Math.PI * 2);
                ctx.fill();

                // Utripajoča oranžna luč med vleko ali ponoči
                if (sim.stanje === 'VZLET_Z_VITLOM' || !jeSvetla) {
                    const utrip = 0.45 + 0.55 * Math.sin(sim.animacijaCas * 8);
                    ctx.fillStyle = 'rgba(251, 191, 36, ' + utrip.toFixed(2) + ')';
                    ctx.beginPath();
                    ctx.arc(vitelX - vw * 0.24, tlaY - vh - 14 * meriloObjekta, 4 * meriloObjekta, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = jeSvetla ? '#0f172a' : '#fde68a';
                ctx.font = '700 ' + Math.max(9, Math.round(10 * meriloObjekta)) + 'px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('VITEL', vitelX, tlaY - vh - 20 * meriloObjekta);
            }

            // Oznake razdalje vsakih 500 m po preletu steze
            const prviKm = Math.max(1000, Math.floor((sim.kameraX - sim.sirina / sim.kameraZoom) / 500) * 500);
            const zadnjiKm = sim.kameraX + sim.sirina / sim.kameraZoom;
            ctx.font = '600 11px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            for (let dm = prviKm; dm <= zadnjiKm; dm += 500) {
                const dx = vPlatnoX(dm);
                if (dx > 20 && dx < sim.sirina - 20) {
                    ctx.fillStyle = jeSvetla ? 'rgba(255, 255, 255, 0.75)' : 'rgba(148, 163, 184, 0.55)';
                    ctx.fillRect(dx - 1, tlaY, 2, 12);
                    ctx.fillText(oblikujDecimalno(dm / 1000, 1) + ' km', dx, tlaY + 25);
                }
            }
        }

        function izrisiAktivnoZajlo(jeSvetla) {
            if (sim.stanje !== 'NA_STEZI' && sim.stanje !== 'VZLET_Z_VITLOM') {
                return;
            }
            const letaloX = vPlatnoX(sim.x) + 4;
            const letaloY = vPlatnoY(sim.y) - 3;
            const vitelX = vPlatnoX(X_VITEL);
            const vitelY = vPlatnoY(0) - 10;

            const visokaNapetost = sim.napetostZajle >= 85;
            ctx.strokeStyle = visokaNapetost
                ? '#f43f5e'
                : (jeSvetla ? '#334155' : '#cbd5e1');
            ctx.lineWidth = visokaNapetost ? 2.4 : 1.7;

            // Rahla verižnica zajle ob manjši napetosti
            const poves = (1 - Math.min(1, sim.napetostZajle / 80)) * 22;
            const sredinaX = (letaloX + vitelX) * 0.5;
            const sredinaY = Math.min(vPlatnoY(0) - 2, (letaloY + vitelY) * 0.5 + poves);

            ctx.beginPath();
            ctx.moveTo(letaloX, letaloY);
            ctx.quadraticCurveTo(sredinaX, sredinaY, vitelX, vitelY);
            ctx.stroke();
        }

        function izrisiPadajocoZajlo() {
            const z = sim.odpetaZajla;
            if (!z || !z.aktivna) {
                return;
            }
            const px = vPlatnoX(z.padalceX);
            const py = vPlatnoY(z.padalceY);
            const vx = vPlatnoX(z.vitelX);
            const vy = vPlatnoY(0) - 10;

            // Padajoča zajla
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo((px + vx) * 0.5, Math.min(vy, (py + vy) * 0.5 + 32), vx, vy);
            ctx.stroke();

            // Vidno oranžno zavorno padalce na koncu zajle
            const nihanje = Math.sin(z.nihanje) * 5;
            const kupolaY = py - 20;
            const kupolaX = px + nihanje;

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(kupolaX - 9, kupolaY + 4);
            ctx.moveTo(px, py);
            ctx.lineTo(kupolaX + 9, kupolaY + 4);
            ctx.stroke();

            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(kupolaX, kupolaY + 4, 11, Math.PI, 0, false);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffedd5';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }

        function izrisiJadralnoLetalo(jeSvetla) {
            const profil = LETALA[sim.tipLetala];
            const sx = vPlatnoX(sim.x);
            const sy = vPlatnoY(sim.y);

            // Senca na tleh pri nizkem letu za občutek višine pred dotikom
            if (sim.y < 65) {
                const tlaY = vPlatnoY(0);
                const delezSence = 1 - sim.y / 65;
                ctx.fillStyle = 'rgba(0, 0, 0, ' + (delezSence * 0.34).toFixed(2) + ')';
                ctx.beginPath();
                ctx.ellipse(sx, tlaY + 2, 18 + delezSence * 12, 3.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            const buffet = sim.vPrevleku ? Math.sin(sim.animacijaCas * 48) * 2.2 : 0;
            const merilo = Math.max(0.84, Math.min(1.18, sim.sirina / 900)) * profil.dolzinaKrila;

            ctx.save();
            ctx.translate(sx, sy - 6 + buffet);
            ctx.rotate(-sim.nagib);
            ctx.scale(merilo, merilo);

            // Barvna shema glede na izbrani tip letala
            let barvaTrupa = jeSvetla ? '#ffffff' : '#f1f5f9';
            let poudarek = '#0284c7';
            let kabina = '#38bdf8';

            if (profil.tip === 'tekmovalno') {
                poudarek = '#f59e0b';
                kabina = '#0ea5e9';
            } else if (profil.tip === 'rc') {
                barvaTrupa = '#fde047';
                poudarek = '#ea580c';
                kabina = '#1e293b';
            }

            // Glavno krilo v perspektivi
            ctx.fillStyle = jeSvetla ? '#e2e8f0' : '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(4, -2);
            ctx.lineTo(-10, -14);
            ctx.lineTo(-16, -13);
            ctx.lineTo(-3, -1);
            ctx.closePath();
            ctx.fill();

            // Zračne zavore (spojlerji), kadar so odprte
            if (sim.zracneZavore) {
                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(-7, -10, 6, 7);
                ctx.fillRect(-5, 2, 6, 5);
                ctx.strokeStyle = '#fecdd3';
                ctx.lineWidth = 1;
                ctx.strokeRect(-7, -10, 6, 7);
            }

            // Trup jadralnega letala
            ctx.fillStyle = barvaTrupa;
            ctx.beginPath();
            ctx.moveTo(26, 0);
            ctx.quadraticCurveTo(18, -5, 4, -4.5);
            ctx.lineTo(-27, -2);
            ctx.lineTo(-28, 1.5);
            ctx.lineTo(4, 3.5);
            ctx.quadraticCurveTo(20, 3.5, 26, 0);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = jeSvetla ? '#475569' : '#334155';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Okrasna črta vzdolž trupa
            ctx.fillStyle = poudarek;
            ctx.fillRect(-22, -1.2, 34, 2);

            // Pokrov kabine (pri RC modelu temen karbonski pokrov)
            ctx.fillStyle = kabina;
            ctx.beginPath();
            ctx.moveTo(18, -1.5);
            ctx.quadraticCurveTo(11, -7.5, 3, -4);
            ctx.closePath();
            ctx.fill();

            // Smerno in višinsko krmilo (T-rep pri polnih, V/T pri RC)
            ctx.fillStyle = barvaTrupa;
            ctx.beginPath();
            ctx.moveTo(-22, -1.5);
            ctx.lineTo(-29, -12);
            ctx.lineTo(-33, -12);
            ctx.lineTo(-27, 1.2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = poudarek;
            ctx.fillRect(-35, -13, 9, 2.2);

            // Kolo podvozja (pri pravih jadralnih letalih)
            if (profil.tip !== 'rc') {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(3, 4.5, 2.6, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        function izrisiVisinskoLestvico(jeSvetla) {
            const korakM = 100;
            const najnizjaM = Math.max(100, Math.floor(Math.max(0, sim.kameraY - sim.visina / sim.kameraZoom) / korakM) * korakM);
            const najvisjaM = Math.ceil((sim.kameraY + sim.visina / sim.kameraZoom) / korakM) * korakM;

            ctx.font = '600 10px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            for (let m = najnizjaM; m <= najvisjaM; m += korakM) {
                const py = vPlatnoY(m);
                if (py > 18 && py < sim.visina - 24) {
                    ctx.strokeStyle = jeSvetla ? 'rgba(15, 23, 42, 0.14)' : 'rgba(148, 163, 184, 0.18)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, py);
                    ctx.lineTo(14, py);
                    ctx.stroke();

                    ctx.fillStyle = jeSvetla ? 'rgba(15, 23, 42, 0.58)' : 'rgba(148, 163, 184, 0.72)';
                    ctx.fillText(m + ' m', 18, py + 3);
                }
            }
        }

        function izrisiPozivNaStezi() {
            if (sim.stanje !== 'NA_STEZI') {
                return;
            }
            const x = sim.sirina * 0.5;
            const y = Math.min(sim.visina * 0.36, 155);
            const besedilo = 'Držite preslednico ali gumb "Vzlet z vitlom" za vzlet';

            ctx.font = '700 14px Inter, system-ui, sans-serif';
            const sirinaBesedila = ctx.measureText(besedilo).width;
            const skatlaW = Math.min(sim.sirina - 24, sirinaBesedila + 36);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x - skatlaW * 0.5, y - 20, skatlaW, 40, 20);
            } else {
                ctx.rect(x - skatlaW * 0.5, y - 20, skatlaW, 40);
            }
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.fillText(besedilo, x, y + 5);
        }

        function izrisiPrizor() {
            const jeSvetla = sim.tema === 'light';
            ctx.clearRect(0, 0, sim.sirina, sim.visina);

            izrisiNeboInNebesnaTelesa(jeSvetla);
            izrisiHalozeInPtuj(vPlatnoY(0), jeSvetla);
            izrisiZracneTokove(jeSvetla);
            izrisiTlaInMoskanjce(jeSvetla);
            izrisiAktivnoZajlo(jeSvetla);
            izrisiPadajocoZajlo();
            izrisiJadralnoLetalo(jeSvetla);
            izrisiVisinskoLestvico(jeSvetla);
            izrisiPozivNaStezi();
        }

        //**********************************************************
        // 14. Upravljanje tipkovnice, miške in dotika             *
        //**********************************************************
        function jeVnosFokusiran() {
            const aktivni = document.activeElement;
            if (!aktivni) {
                return false;
            }
            const tag = aktivni.tagName;
            return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
        }

        function nastaviDrzanjeGumba(gumb, kljuc) {
            if (!gumb) {
                return;
            }
            const sprosti = function () {
                vhod[kljuc] = false;
                gumb.classList.remove('pritisnjen');
            };
            gumb.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                vhod[kljuc] = true;
                gumb.classList.add('pritisnjen');
            });
            gumb.addEventListener('pointerup', sprosti);
            gumb.addEventListener('pointerleave', sprosti);
            gumb.addEventListener('pointercancel', sprosti);
            gumb.addEventListener('lostpointercapture', sprosti);
        }

        function preklopiZracneZavore() {
            if (sim.stanje === 'PRISTANEK' && !sim.kotaljenje) {
                return;
            }
            sim.zracneZavore = !sim.zracneZavore;
            posodobiStanjeZavorUI();
        }

        window.addEventListener('keydown', function (e) {
            if (jeVnosFokusiran() || e.ctrlKey || e.metaKey || e.altKey) {
                return;
            }
            const koda = e.code;
            const tipka = e.key ? e.key.toLowerCase() : '';

            if (koda === 'Space' || tipka === ' ') {
                e.preventDefault();
                vhod.tipkaSpace = true;
                ui.ctrlVitel.classList.add('pritisnjen');
            } else if (koda === 'ArrowUp' || koda === 'KeyW' || tipka === 'w') {
                e.preventDefault();
                vhod.tipkaGor = true;
                ui.ctrlGor.classList.add('pritisnjen');
            } else if (koda === 'ArrowDown' || koda === 'KeyS' || tipka === 's') {
                e.preventDefault();
                vhod.tipkaDol = true;
                ui.ctrlDol.classList.add('pritisnjen');
            } else if ((koda === 'KeyR' || tipka === 'r') && !e.repeat) {
                odpniZajlo('rocno');
            } else if ((koda === 'KeyB' || tipka === 'b') && !e.repeat) {
                preklopiZracneZavore();
            } else if ((koda === 'Digit1' || koda === 'Numpad1' || tipka === '1') && !e.repeat) {
                nastaviRezimHitrosti('min_spust');
            } else if ((koda === 'Digit2' || koda === 'Numpad2' || tipka === '2') && !e.repeat) {
                nastaviRezimHitrosti('najboljsi_dolet');
            } else if ((koda === 'Digit3' || koda === 'Numpad3' || tipka === '3') && !e.repeat) {
                nastaviRezimHitrosti('hitri_prelet');
            } else if (tipka === '-' || tipka === '[' || koda === 'NumpadSubtract') {
                prilagodiCiljnoHitrost(-2);
            } else if (tipka === '+' || tipka === '=' || tipka === ']' || koda === 'NumpadAdd') {
                prilagodiCiljnoHitrost(2);
            }
        });

        window.addEventListener('keyup', function (e) {
            const koda = e.code;
            const tipka = e.key ? e.key.toLowerCase() : '';

            if (koda === 'Space' || tipka === ' ') {
                vhod.tipkaSpace = false;
                ui.ctrlVitel.classList.remove('pritisnjen');
            } else if (koda === 'ArrowUp' || koda === 'KeyW' || tipka === 'w') {
                vhod.tipkaGor = false;
                ui.ctrlGor.classList.remove('pritisnjen');
            } else if (koda === 'ArrowDown' || koda === 'KeyS' || tipka === 's') {
                vhod.tipkaDol = false;
                ui.ctrlDol.classList.remove('pritisnjen');
            }
        });

        window.addEventListener('blur', function () {
            vhod.tipkaSpace = false;
            vhod.tipkaGor = false;
            vhod.tipkaDol = false;
            vhod.gumbVitel = false;
            vhod.gumbGor = false;
            vhod.gumbDol = false;
            ui.ctrlVitel.classList.remove('pritisnjen');
            ui.ctrlGor.classList.remove('pritisnjen');
            ui.ctrlDol.classList.remove('pritisnjen');
        });

        nastaviDrzanjeGumba(ui.ctrlVitel, 'gumbVitel');
        nastaviDrzanjeGumba(ui.ctrlGor, 'gumbGor');
        nastaviDrzanjeGumba(ui.ctrlDol, 'gumbDol');

        ui.ctrlOdpni.addEventListener('click', function () {
            odpniZajlo('rocno');
            ui.ctrlOdpni.blur();
        });

        ui.ctrlZavore.addEventListener('click', function () {
            preklopiZracneZavore();
            ui.ctrlZavore.blur();
        });

        ui.ctrlRestart.addEventListener('click', function () {
            ponastaviPolet();
            ui.ctrlRestart.blur();
        });

        ui.gumbHitriRestart.addEventListener('click', function () {
            ponastaviPolet();
            ui.gumbHitriRestart.blur();
        });

        ui.gumbOverlayRestart.addEventListener('click', function () {
            ponastaviPolet();
            ui.gumbOverlayRestart.blur();
        });

        ui.gumbZvok.addEventListener('click', function () {
            preklopiZvokVariometra();
            ui.gumbZvok.blur();
        });

        ui.izbiraLetala.addEventListener('change', function () {
            if (LETALA[ui.izbiraLetala.value]) {
                sim.tipLetala = ui.izbiraLetala.value;
                if (sim.rezimHitrosti === 'rocno') {
                    sim.rezimHitrosti = 'najboljsi_dolet';
                }
                ponastaviPolet();
            }
            ui.izbiraLetala.blur();
        });

        ui.trimGumbi.forEach(function (gumb) {
            gumb.addEventListener('click', function () {
                const novRezim = gumb.getAttribute('data-rezim');
                nastaviRezimHitrosti(novRezim);
                gumb.blur();
            });
        });

        if (ui.trimMinus) {
            ui.trimMinus.addEventListener('click', function () {
                prilagodiCiljnoHitrost(-2);
                ui.trimMinus.blur();
            });
        }

        if (ui.trimPlus) {
            ui.trimPlus.addEventListener('click', function () {
                prilagodiCiljnoHitrost(2);
                ui.trimPlus.blur();
            });
        }

        ui.vremeGumbi.forEach(function (gumb) {
            gumb.addEventListener('click', function () {
                const novoVreme = gumb.getAttribute('data-vreme');
                if (!VREMENA[novoVreme]) {
                    return;
                }
                sim.tipVremena = novoVreme;
                ui.vremeGumbi.forEach(function (el) {
                    const jeAktiven = el === gumb;
                    el.classList.toggle('aktiven', jeAktiven);
                    el.setAttribute('aria-pressed', jeAktiven ? 'true' : 'false');
                });
                ponastaviPolet();
                gumb.blur();
            });
        });

        window.addEventListener('tema-spremenjena', function (e) {
            if (e && e.detail && (e.detail.tema === 'light' || e.detail.tema === 'dark')) {
                sim.tema = e.detail.tema;
            } else {
                sim.tema = pridobiTrenutnoTemo();
            }
        });

        window.addEventListener('resize', prilagodiVelikostPlatna);

        //**********************************************************
        // 15. Glavna zanka 60 FPS (requestAnimationFrame)         *
        //**********************************************************
        let zadnjiCas = 0;

        function zanka(casovniZig) {
            if (!zadnjiCas) {
                zadnjiCas = casovniZig;
            }
            const dt = Math.min(0.05, Math.max(0.001, (casovniZig - zadnjiCas) / 1000));
            zadnjiCas = casovniZig;

            prilagodiVelikostPlatna();
            posodobiFiziko(dt);
            osveziHUD();
            izrisiPrizor();

            window.requestAnimationFrame(zanka);
        }

        ustvariZvezde();
        prilagodiVelikostPlatna();
        ponastaviPolet();
        window.requestAnimationFrame(zanka);
    });
}());
