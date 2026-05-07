'use strict';

(function () {
  const enterBtn = document.getElementById('enter-btn');
  const intro = document.getElementById('intro');
  const main = document.getElementById('main');

  if (!enterBtn || !intro || !main) return;

  enterBtn.addEventListener('click', function () {
    intro.classList.add('hidden');
    main.classList.add('visible');
    // Allow scrolling on main page after transition
    setTimeout(function () {
      document.body.style.overflow = 'auto';
    }, 800);
  });

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !intro.classList.contains('hidden')) {
      enterBtn.click();
    }
  });
})();
