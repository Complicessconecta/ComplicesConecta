console.clear();

/* Scrubbing animation control */
const elRange = document.querySelector('#range');

elRange.addEventListener('input', e => {
  document.body.style.setProperty('--scrub', +e.target.value);
  document.body.style.setProperty('--play-state', 'paused');
});

elRange.addEventListener('blur', e => {
  document.body.style.setProperty('--play-state', 'running');
});
