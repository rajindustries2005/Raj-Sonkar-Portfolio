(() => {
  const button = document.querySelector('#narration-toggle');
  const status = document.querySelector('#narration-status');
  const speech = window.speechSynthesis;
  if (!speech || typeof SpeechSynthesisUtterance !== 'function') return;

  const selectors = [
    'h1', 'h2', 'h3', 'p:not(#narration-status)', '.art-content strong',
    '.tags li', '.workflow li strong', '.workflow li small', '.credentials li',
  ];

  const name = document.querySelector('#name');
  const elements = Array.from(document.querySelector('main').querySelectorAll(selectors.join(', ')));
  const parts = ['Hi there! I’m ' + sentence(name.innerText) + ' Thanks for stopping by.'];
  let chunk = '';

  for (const element of elements) {
    if (element === name) continue;
    const text = sentence(element.dataset.narration ?? element.innerText);
    if (!text) continue;
    if (chunk && (element.matches('h2') || chunk.length + text.length > 240)) {
      parts.push(chunk);
      chunk = '';
    }
    chunk = chunk ? chunk + ' ' + text : text;
  }
  if (chunk) parts.push(chunk);
  parts.push('Thanks for listening. I hope you enjoy exploring my portfolio!');

  let activeUtterance = null;
  let startTimer;
  let autoplayTimer;

  function sentence(text) {
    const clean = text
      .replace(/B\.Sc\./g, 'Bachelor of Science in')
      .replace(/AI-ML/g, 'AI and machine learning')
      .replace(/\b3D\b/g, 'three-dimensional')
      .replace(/(\d)–(\d)/g, '$1 to $2')
      .replace(/(\d)%/g, '$1 percent')
      .replace(/[↗↘↓]/g, '').replace(/\s*·\s*/g, ', ').replace(/\s+/g, ' ').trim();
    return !clean || /[.!?]$/.test(clean) ? clean : clean + '.';
  }

  function finish(message = '') {
    const wasActive = activeUtterance !== null;
    activeUtterance = null;
    clearTimeout(startTimer);
    if (wasActive) speech.cancel();

    button.textContent = 'Listen to portfolio';
    status.hidden = !message;
    status.textContent = message;
  }

  function chooseVoice(voices) {
    // Web Speech has no gender field. Match female voice names exposed by vendors.
    const femaleName = /\b(female|neerja|heera|veena|raveena|aditi|kavya|samantha|susan|victoria|karen|moira|tessa|ava|zira|jenny|aria|michelle|hazel|sonia|libby|serena)\b/i;
    const indianEnglish = voice => /^en[-_]in$/i.test(voice.lang);
    const femaleEnglish = voices.filter(voice => /^en(?:[-_]|$)/i.test(voice.lang) &&
      femaleName.test(voice.name));
    return femaleEnglish.find(voice => indianEnglish(voice) && voice.localService)
      || femaleEnglish.find(indianEnglish)
      || femaleEnglish.find(voice => voice.localService)
      || femaleEnglish[0]
      || voices.find(voice => indianEnglish(voice) && voice.localService);
  }

  function start(automatic) {
    clearTimeout(autoplayTimer);
    const voice = chooseVoice(speech.getVoices());
    status.hidden = true;
    status.textContent = '';
    button.textContent = 'Stop narration';

    function speakPart(index) {
      const utterance = new SpeechSynthesisUtterance(parts[index]);
      utterance.lang = voice?.lang || 'en-IN';
      utterance.rate = 0.94;
      utterance.pitch = 1.04;
      if (voice) utterance.voice = voice;
      activeUtterance = utterance;

      function fail() {
        if (activeUtterance !== utterance) return;
        finish(automatic && index === 0
          ? 'Select Listen to portfolio to start the narration.'
          : 'Narration could not play. Select Listen to portfolio to try again.');
      }

      utterance.onstart = () => {
        if (activeUtterance === utterance) clearTimeout(startTimer);
      };
      utterance.onend = () => {
        if (activeUtterance !== utterance) return;
        clearTimeout(startTimer);
        if (index + 1 < parts.length) {
          speakPart(index + 1);
        } else {
          activeUtterance = null;
          finish();
        }
      };
      utterance.onerror = fail;

      startTimer = setTimeout(fail, 6000);
      try {
        speech.speak(utterance);
      } catch {
        fail();
      }
    }

    speakPart(0);
  }

  button.addEventListener('click', () => {
    if (activeUtterance) {
      finish();
    } else {
      start(false);
    }
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(autoplayTimer);
    finish();
  });

  button.hidden = false;
  if (speech.getVoices().length) {
    start(true);
  } else {
    // Some browsers populate the voice list after the page script runs.
    autoplayTimer = setTimeout(() => start(true), 450);
  }
})();
