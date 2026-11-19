//**********************************************************
// Skripta za vstopno stran (JS/index.js)                  *
// Projekt: Modelarska sekcija Aerokluba Ptuj - RC Letala  *
// Namen: Pozdrav glede na del dneva in ura v živo         *
//**********************************************************

(() => {
    'use strict';

    // Slovenska imena dni v tednu (indeks 0 = nedelja)
    const DNEVI_V_TEDNU = [
        'Nedelja',
        'Ponedeljek',
        'Torek',
        'Sreda',
        'Četrtek',
        'Petek',
        'Sobota'
    ];

    // Slovenska imena mesecev
    const MESECI = [
        'januar',
        'februar',
        'marec',
        'april',
        'maj',
        'junij',
        'julij',
        'avgust',
        'september',
        'oktober',
        'november',
        'december'
    ];

    //**********************************************************
    // Vektorske ikone SVG za jutro (sončni vzhod), dan (sonce)*
    // in večer (luna z zvezdo)                                *
    //**********************************************************
    const IKONE_OBDOBJA = {
        jutro: [
            '<svg class="pozdrav-ikona-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '  <path d="M12 4v4"></path>',
            '  <path d="M5.6 9.6l1.8 1.8"></path>',
            '  <path d="M18.4 9.6l-1.8 1.8"></path>',
            '  <path d="M7 17a5 5 0 0 1 10 0"></path>',
            '  <path d="M3 17h18"></path>',
            '  <path d="M6 20.5h12"></path>',
            '</svg>'
        ].join(''),
        dan: [
            '<svg class="pozdrav-ikona-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '  <circle cx="12" cy="12" r="4.5"></circle>',
            '  <path d="M12 2.5v2.2"></path>',
            '  <path d="M12 19.3v2.2"></path>',
            '  <path d="M2.5 12h2.2"></path>',
            '  <path d="M19.3 12h2.2"></path>',
            '  <path d="M5.28 5.28l1.56 1.56"></path>',
            '  <path d="M17.16 17.16l1.56 1.56"></path>',
            '  <path d="M5.28 18.72l1.56-1.56"></path>',
            '  <path d="M17.16 6.84l1.56-1.56"></path>',
            '</svg>'
        ].join(''),
        vecer: [
            '<svg class="pozdrav-ikona-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '  <path d="M20.35 15.35A8.5 8.5 0 0 1 8.65 3.65a8.5 8.5 0 1 0 11.7 11.7z"></path>',
            '  <path d="M18 4.5v2.5"></path>',
            '  <path d="M16.75 5.75h2.5"></path>',
            '</svg>'
        ].join('')
    };

    //**********************************************************
    // Določi del dneva, slovenski pozdrav in pripadajoči CSS  *
    // razred glede na podano uro (0-23)                       *
    //**********************************************************
    function dolociObdobjeDneva(ura) {
        if (ura < 12) {
            return {
                obdobje: 'jutro',
                pozdrav: 'Dobro jutro',
                razred: 'pozdrav-jutro'
            };
        }
        if (ura < 18) {
            return {
                obdobje: 'dan',
                pozdrav: 'Dober dan',
                razred: 'pozdrav-dan'
            };
        }
        return {
            obdobje: 'vecer',
            pozdrav: 'Dober večer',
            razred: 'pozdrav-vecer'
        };
    }

    //**********************************************************
    // Oblikuje uro v natančen 24-urni zapis HH:MM:SS z vodil. *
    // ničlami (npr. 07:15:52)                                 *
    //**********************************************************
    function formatirajCas(datum) {
        const ure = String(datum.getHours()).padStart(2, '0');
        const minute = String(datum.getMinutes()).padStart(2, '0');
        const sekunde = String(datum.getSeconds()).padStart(2, '0');
        return `${ure}:${minute}:${sekunde}`;
    }

    //**********************************************************
    // Oblikuje datum v naravno slovensko obliko               *
    // (npr. Četrtek, 19. november 2026)                       *
    //**********************************************************
    function formatirajSlovenskiDatum(datum) {
        const danVTednu = DNEVI_V_TEDNU[datum.getDay()];
        const dan = datum.getDate();
        const mesec = MESECI[datum.getMonth()];
        const leto = datum.getFullYear();
        return `${danVTednu}, ${dan}. ${mesec} ${leto}`;
    }

    //**********************************************************
    // Zgradi gradnik pozdrava in ure v živo ter zažene        *
    // posodabljanje vsako sekundo brez začetnega zamika       *
    //**********************************************************
    function inicializirajPozdrav() {
        const sklop = document.getElementById('pozdrav-ura-sklop');
        if (!sklop) {
            return;
        }

        sklop.innerHTML = [
            '<div class="pozdrav-kartica">',
            '  <div class="pozdrav-levo">',
            '    <div class="pozdrav-ikona-okvir" aria-hidden="true"></div>',
            '    <div class="pozdrav-vsebina">',
            '      <span class="pozdrav-nadnaslov">Trenutni čas na modelarskem letališču</span>',
            '      <p id="pozdrav-ura-izpis" class="pozdrav-glavni-niz"><span class="pozdrav-besedilo"></span><span class="pozdrav-locilo"> - </span><time class="pozdrav-ura" aria-live="off"></time></p>',
            '      <p id="pozdrav-datum" class="pozdrav-datum"></p>',
            '    </div>',
            '  </div>',
            '  <div class="pozdrav-desno">',
            '    <span class="pozdrav-status-znacka">',
            '      <span class="pozdrav-utrip-pika" aria-hidden="true"></span>',
            '      <span>Letališče Moškanjci</span>',
            '    </span>',
            '  </div>',
            '</div>'
        ].join('');

        const ikonaOkvir = sklop.querySelector('.pozdrav-ikona-okvir');
        const besediloEl = sklop.querySelector('.pozdrav-besedilo');
        const uraEl = sklop.querySelector('.pozdrav-ura');
        const datumEl = sklop.querySelector('.pozdrav-datum');

        let zadnjeObdobje = null;
        let zadnjiDatumNiz = '';
        let utripPreklop = false;

        //**********************************************************
        // Osveži pozdrav, ikono obdobja, uro HH:MM:SS in datum    *
        //**********************************************************
        function posodobiPozdravInUro() {
            const zdaj = new Date();
            const podatkiObdobja = dolociObdobjeDneva(zdaj.getHours());
            const casNiz = formatirajCas(zdaj);
            const datumNiz = formatirajSlovenskiDatum(zdaj);

            if (podatkiObdobja.obdobje !== zadnjeObdobje) {
                sklop.classList.remove('pozdrav-jutro', 'pozdrav-dan', 'pozdrav-vecer');
                sklop.classList.add(podatkiObdobja.razred);
                ikonaOkvir.innerHTML = IKONE_OBDOBJA[podatkiObdobja.obdobje];
                besediloEl.textContent = podatkiObdobja.pozdrav;

                if (zadnjeObdobje !== null) {
                    const uporabiA = !sklop.classList.contains('pozdrav-prehod-a');
                    sklop.classList.toggle('pozdrav-prehod-a', uporabiA);
                    sklop.classList.toggle('pozdrav-prehod-b', !uporabiA);
                }
                zadnjeObdobje = podatkiObdobja.obdobje;
            }

            uraEl.textContent = casNiz;
            uraEl.setAttribute('datetime', casNiz);

            // Izmenjava razredov za tekoč sekundni utrip brez prisiljenega reflowa
            utripPreklop = !utripPreklop;
            uraEl.classList.toggle('tik-a', utripPreklop);
            uraEl.classList.toggle('tik-b', !utripPreklop);

            if (datumNiz !== zadnjiDatumNiz) {
                datumEl.textContent = datumNiz;
                zadnjiDatumNiz = datumNiz;
            }
        }

        // Takojšen prvi izris (ničelni zamik) in nato osveževanje vsako sekundo
        posodobiPozdravInUro();
        window.setInterval(posodobiPozdravInUro, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializirajPozdrav);
    } else {
        inicializirajPozdrav();
    }
})();
