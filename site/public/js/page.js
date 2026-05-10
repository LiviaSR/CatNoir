// ── Scroll-to-top button ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('to-top-button');
    if (!btn) return;
    window.addEventListener('scroll', function () {
        btn.style.display =
            (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20)
                ? 'block' : 'none';
    });
});

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

// ── Easter egg (CatNoir brand click counter) ──────────────────────────────
var _easterEggCounter = 0;
function easterEgg() {
    if (_easterEggCounter === 5) {
        $('.toast').toast('show');
        setTimeout(function () { $('.toast').toast('hide'); }, 10000);
        _easterEggCounter = 0;
        return;
    }
    _easterEggCounter++;
}
