// Function to set a given theme/color-scheme
function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    const r = document.querySelector(':root');

    if (themeName === 'theme-dark') {
        r.style.setProperty('--primary-color',        '#0d1117');   // deep blue-black bg
        r.style.setProperty('--secondary-color',      '#161b22');   // surface / card bg
        r.style.setProperty('--tertiary-color',       '#1e2329');   // subtle hover layer
        r.style.setProperty('--border-color',         '#2a2f36');   // all borders
        r.style.setProperty('--highlight-color',      '#e6a817');   // gold accent
        r.style.setProperty('--highlight-muted',      'rgba(230,168,23,0.15)'); // gold tint fills
        r.style.setProperty('--text-color',           '#e8e2d9');   // warm off-white
        r.style.setProperty('--text-muted',           '#8b8478');   // secondary text
        r.style.setProperty('--link-color',           '#8b8478');
        r.style.setProperty('--tag-lmxb-bg',          'rgba(29,158,117,0.15)');
        r.style.setProperty('--tag-lmxb-text',        '#5dcaa5');
        r.style.setProperty('--tag-lmxb-border',      'rgba(29,158,117,0.3)');
        r.style.setProperty('--tag-hmxb-bg',          'rgba(55,138,221,0.15)');
        r.style.setProperty('--tag-hmxb-text',        '#85b7eb');
        r.style.setProperty('--tag-hmxb-border',      'rgba(55,138,221,0.3)');
        r.style.setProperty('--table-hover-1',        '#1e2329');
        r.style.setProperty('--table-border',         '#2a2f36');
        r.style.setProperty('--table-cell-border',    '#2a2f36');
        r.style.setProperty('--scroll-bar-background',       '#2a2f36');
        r.style.setProperty('--scroll-bar-track-background', '#0d1117');
        r.style.setProperty('--plot-container',       'rgba(255,255,255,0.05)');
        r.style.setProperty('--logo-filter',          'brightness(0) saturate(100%) invert(72%) sepia(60%) saturate(500%) hue-rotate(5deg) brightness(100%)');
        r.style.setProperty('--table-hover-2',        '#1c2128');
        r.style.setProperty('--table-column-border',  '#2a2f36');
        r.style.setProperty('--table-row-hover-bg',   '#5a4a1e');
        r.style.setProperty('--table-row-hover-fg',   '#fffef9');
        r.style.setProperty('--table-row-hover-name', '#ffe566');
        r.style.setProperty('--table-row-hover-link', '#fff6cc');
        r.style.setProperty('--grid-line',            'rgba(232,226,217,0.14)');
        r.style.setProperty('--top-button-text-color','#0d1117');
        r.style.setProperty('--burger-icon-color',    '#e8e2d9');
        r.style.setProperty(
            '--hero-veil-gradient',
            'linear-gradient(to top, rgba(10, 14, 22, 0.5) 0%, rgba(10, 14, 22, 0.2) 38%, rgba(10, 14, 22, 0.06) 62%, rgba(10, 14, 22, 0) 100%)'
        );
    } else {
        r.style.setProperty('--primary-color',        '#f8f6f1');   // warm parchment bg
        r.style.setProperty('--secondary-color',      '#ffffff');   // surface / card bg
        r.style.setProperty('--tertiary-color',       '#f0ede7');   // subtle hover layer
        r.style.setProperty('--border-color',         '#ddd9d0');   // all borders
        r.style.setProperty('--highlight-color',      '#b8860e');   // darker gold for contrast
        r.style.setProperty('--highlight-muted',      'rgba(184,134,14,0.10)');
        r.style.setProperty('--text-color',           '#1a1814');   // warm near-black
        r.style.setProperty('--text-muted',           '#7a746a');
        r.style.setProperty('--link-color',           '#1a1814');
        r.style.setProperty('--tag-lmxb-bg',          'rgba(15,110,86,0.08)');
        r.style.setProperty('--tag-lmxb-text',        '#0f6e56');
        r.style.setProperty('--tag-lmxb-border',      'rgba(15,110,86,0.25)');
        r.style.setProperty('--tag-hmxb-bg',          'rgba(24,95,165,0.08)');
        r.style.setProperty('--tag-hmxb-text',        '#185fa5');
        r.style.setProperty('--tag-hmxb-border',      'rgba(24,95,165,0.25)');
        r.style.setProperty('--table-hover-1',        '#f0ede7');
        r.style.setProperty('--table-border',         '#ddd9d0');
        r.style.setProperty('--table-cell-border',    '#ddd9d0');
        r.style.setProperty('--scroll-bar-background',       '#ddd9d0');
        r.style.setProperty('--scroll-bar-track-background', '#f8f6f1');
        r.style.setProperty('--plot-container',       'rgba(0,0,0,0.05)');
        r.style.setProperty('--logo-filter',          'brightness(0) saturate(100%) sepia(50%) saturate(400%) hue-rotate(5deg) brightness(60%)');
        r.style.setProperty('--table-hover-2',        '#e5e1d8');
        r.style.setProperty('--table-column-border',  '#ddd9d0');
        r.style.setProperty('--table-row-hover-bg',   '#b8860e');
        r.style.setProperty('--table-row-hover-fg',   '#14110a');
        r.style.setProperty('--table-row-hover-name', '#0d0b07');
        r.style.setProperty('--table-row-hover-link', '#1c1508');
        r.style.setProperty('--grid-line',            'rgba(26,24,20,0.12)');
        r.style.setProperty('--top-button-text-color','#1a1814');
        r.style.setProperty('--burger-icon-color',    '#1a1814');
        r.style.setProperty(
            '--hero-veil-gradient',
            'linear-gradient(to top, rgba(22, 18, 14, 0.48) 0%, rgba(22, 18, 14, 0.19) 38%, rgba(22, 18, 14, 0.06) 62%, rgba(22, 18, 14, 0) 100%)'
        );
    }
}

function syncThemeSwitch() {
    var btn = document.getElementById('toggle-theme-button');
    if (!btn) return;
    var isDark = localStorage.getItem('theme') !== 'theme-light';
    btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    btn.classList.toggle('theme-switch--dark', isDark);
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

function toggleTheme() {
    if (localStorage.getItem('theme') === 'theme-light') {
        setTheme('theme-dark');
    } else {
        setTheme('theme-light');
    }
    syncThemeSwitch();
    if (typeof updatePlotlyPlot === 'function') updatePlotlyPlot();
}

(function () {
    if (localStorage.getItem('theme') === 'theme-light') {
        setTheme('theme-light');
    } else {
        setTheme('theme-dark');
    }
    syncThemeSwitch();
})();
