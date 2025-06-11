 // Function to set a given theme/color-scheme
        function setTheme(themeName) {
            localStorage.setItem('theme', themeName);
            let r = document.querySelector(':root');
            if (localStorage.getItem('theme') === 'theme-dark') {
                r.style.setProperty('--primary-color', '#000000');
                r.style.setProperty('--secondary-color', '#21262d');
                r.style.setProperty('--link-color', 'rgb(150, 150, 150)');
                r.style.setProperty('--highlight-color', '#cc9900');
                r.style.setProperty('--text-color', '#ffffff');
                r.style.setProperty('--table-hover-1', '#393d3d');
                r.style.setProperty('--table-hover-2', '#21262d9d');
                r.style.setProperty('--table-border', '#383d3f');
                r.style.setProperty('--table-cell-border', 'rgb(134, 125, 110)');
                r.style.setProperty('--table-column-border', 'rgb(56, 61, 63)');
                r.style.setProperty('--text-muted', '#ece8e1');
                r.style.setProperty('--scroll-bar-background', '#737272');
                r.style.setProperty('--scroll-bar-track-background', '#404040'); 
                r.style.setProperty('--plot-container', 'rgba(211, 211, 211, 0.318)');
                r.style.setProperty('--logo-filter',  'invert(62%) sepia(84%) saturate(23%) hue-rotate(188deg) brightness(90%) contrast(102%)');
            } else {
                r.style.setProperty('--primary-color',  '#ffffff');
                r.style.setProperty('--secondary-color',  '#e6f0ff');
                r.style.setProperty('--link-color',  'rgb(20, 20, 20) !important');
                r.style.setProperty('--highlight-color',  '#cc9900');
                r.style.setProperty('--text-color',  '#000000');
                r.style.setProperty('--table-hover-1',  '#d9d9d9');
                r.style.setProperty('--table-hover-2',  '#b3d1ff');
                r.style.setProperty('--table-border',  '#383d3f');
                r.style.setProperty('--table-cell-border',  'rgb(134, 125, 110)');
                r.style.setProperty('--table-column-border',  'rgb(56, 61, 63)');
                r.style.setProperty('--text-muted',  '#ece8e1');
                r.style.setProperty('--scroll-bar-background',  '#b3d1ff');
                r.style.setProperty('--scroll-bar-track-background',  '#f2f2f2');
                r.style.setProperty('--plot-container',  'rgba(0, 0, 0, 0.318)');
                r.style.setProperty('--top-button-text-color',  '#ffffff');
                r.style.setProperty('--logo-filter',  'invert(62%) sepia(84%) saturate(23%) hue-rotate(188deg) brightness(10%) contrast(102%)');
                r.style.setProperty('--burger-icon-color',  'none');
            }
        }

        // function to toggle between light and light theme
        function toggleTheme(element) {
            if (localStorage.getItem('theme') === 'theme-light') {
                document.getElementById('toggle-theme-button').innerHTML = '<i class="fa fa-sun"></i> Light';
                setTheme('theme-dark');
                buildPlot();
            } else {
                document.getElementById('toggle-theme-button').innerHTML = '<i class="fa fa-moon"></i> Dark';
                setTheme('theme-light');
                buildPlot();
            }
        }

        // Immediately invoked function to set the theme on initial load
        (function () {
            if (localStorage.getItem('theme') === 'theme-light') {
                document.getElementById('toggle-theme-button').innerHTML = '<i class="fa fa-moon"></i> Dark';
                setTheme('theme-light');
            } else {
                document.getElementById('toggle-theme-button').innerHTML = '<i class="fa fa-sun"></i> Light';
                setTheme('theme-dark');
            }
        })();