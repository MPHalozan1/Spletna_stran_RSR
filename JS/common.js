//**********************************************************
// Skupna JavaScript datoteka (JS/common.js)                *
// Projekt: Modelarska sekcija Aerokluba Ptuj - RC Letala  *
// Namen: Sinhrona inicializacija teme, ikone in navigacija*
//**********************************************************

(() => {
    'use strict';

    // Ključ za shranjevanje izbrane teme v localStorage
    const KLJUC_TEME = 'ak_ptuj_tema';

    //**********************************************************
    // Preveri veljavnost vrednosti teme ('light' ali 'dark')  *
    //**********************************************************
    function validirajTemo(vrednost) {
        return vrednost === 'light' ? 'light' : 'dark';
    }

    //**********************************************************
    // Varno prebere shranjeno temo iz localStorage            *
    // Privzeto vrne 'dark', če zapis ne obstaja ali ni dostop.*
    //**********************************************************
    function preberiShranjenoTemo() {
        try {
            const shranjena = window.localStorage.getItem(KLJUC_TEME);
            return validirajTemo(shranjena);
        } catch (napaka) {
            return 'dark';
        }
    }

    //**********************************************************
    // Vrne trenutno dejavno temo ('light' ali 'dark')         *
    //**********************************************************
    function pridobiTemo() {
        const atribut = document.documentElement.getAttribute('data-theme');
        if (atribut === 'light' || atribut === 'dark') {
            return atribut;
        }
        return preberiShranjenoTemo();
    }

    //**********************************************************
    // Nastavi izbrano temo, posodobi DOM, shrani v pomnilnik  *
    // ter sproži globalni dogodek 'tema-spremenjena'          *
    //**********************************************************
    function nastaviTemo(novaTema) {
        const tema = validirajTemo(novaTema);
        document.documentElement.setAttribute('data-theme', tema);

        try {
            window.localStorage.setItem(KLJUC_TEME, tema);
        } catch (napaka) {
            // Zasebni način ali omejen dostop do shrambe ne ustavi delovanja
        }

        const stikalo = document.getElementById('tema-stikalo');
        if (stikalo) {
            stikalo.checked = (tema === 'light');
        }

        window.dispatchEvent(new CustomEvent('tema-spremenjena', {
            detail: { tema }
        }));

        return tema;
    }

    // Takojšnja sinhrona uveljavitev teme pred prvim izrisom strani
    const zacetnaTema = preberiShranjenoTemo();
    document.documentElement.setAttribute('data-theme', zacetnaTema);

    // Javni vmesnik za ostale skripte na podstraneh
    window.AkPtujTema = {
        pridobiTemo,
        nastaviTemo
    };

    //**********************************************************
    // Dopolni prazne ikone za preklop teme in puščico menija, *
    // da so vse podstrani vizualno enotne brez odvečnega HTML *
    //**********************************************************
    function dopolniPrazneIkone() {
        const temaIkone = document.querySelectorAll('.tema-ikona');
        if (temaIkone[0] && temaIkone[0].textContent.trim() === '') {
            temaIkone[0].textContent = '\u{1F319}';
        }
        if (temaIkone[1] && temaIkone[1].textContent.trim() === '') {
            temaIkone[1].textContent = '\u2600\uFE0F';
        }

        const ddlPuscice = document.querySelectorAll('.ddl-puscica');
        ddlPuscice.forEach((puscica) => {
            if (puscica.textContent.trim() === '') {
                puscica.textContent = '\u25BE';
            }
        });
    }

    //**********************************************************
    // Doda povezavo za preskok na glavno vsebino na začetek   *
    // telesa strani ter zagotovi cilj in fokus elementa main *
    //**********************************************************
    function dodajPovezavoPreskociNaVsebino() {
        const telo = document.body;
        const glavnaVsebina = document.querySelector('main');
        if (!telo || !glavnaVsebina) {
            return;
        }

        if (!glavnaVsebina.id) {
            glavnaVsebina.id = 'glavna-vsebina';
        }

        if (!glavnaVsebina.hasAttribute('tabindex')) {
            glavnaVsebina.setAttribute('tabindex', '-1');
        }

        if (document.querySelector('.preskoci-na-vsebino')) {
            return;
        }

        const preskociPovezava = document.createElement('a');
        preskociPovezava.className = 'preskoci-na-vsebino';
        preskociPovezava.href = '#' + glavnaVsebina.id;
        preskociPovezava.textContent = 'Preskoči na glavno vsebino';

        preskociPovezava.addEventListener('click', () => {
            glavnaVsebina.focus({ preventScroll: false });
        });

        telo.insertBefore(preskociPovezava, telo.firstChild);
    }

    //**********************************************************
    // Poveže stikalo teme, povezavo za preskok ter zapiranje  *
    // mobilnega spustnega menija ob Escape ali kliku          *
    //**********************************************************
    function inicializirajSkupneKontrole() {
        dodajPovezavoPreskociNaVsebino();
        dopolniPrazneIkone();

        const stikaloTeme = document.getElementById('tema-stikalo');
        if (stikaloTeme) {
            stikaloTeme.checked = (pridobiTemo() === 'light');
            stikaloTeme.addEventListener('change', () => {
                nastaviTemo(stikaloTeme.checked ? 'light' : 'dark');
            });
        }

        const meniStikalo = document.getElementById('meni-ddl-stikalo');
        if (meniStikalo) {
            document.addEventListener('keydown', (dogodek) => {
                if (dogodek.key === 'Escape' && meniStikalo.checked) {
                    meniStikalo.checked = false;
                    meniStikalo.focus();
                }
            });

            document.addEventListener('click', (dogodek) => {
                if (
                    meniStikalo.checked &&
                    dogodek.target instanceof Element &&
                    !dogodek.target.closest('.pripeta-vrstica')
                ) {
                    meniStikalo.checked = false;
                }
            });

            const navPovezave = document.querySelectorAll('.nav-seznam a');
            navPovezave.forEach((povezava) => {
                povezava.addEventListener('click', () => {
                    if (meniStikalo.checked) {
                        meniStikalo.checked = false;
                    }
                });
            });
        }
    }

    // Inicializacija kontrol po nalaganju strukture DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializirajSkupneKontrole);
    } else {
        inicializirajSkupneKontrole();
    }
})();
