(() => {
  'use strict';
  const terminal = document.querySelector('#terminal');
  const palette = document.querySelector('#palette');
  const input = document.querySelector('#terminal-input');
  const output = document.querySelector('#terminal-output');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let returnFocus = null;
  const openDialog = (dialog, trigger = document.activeElement) => {
    const wasOpen = terminal.open || palette.open;
    if (!wasOpen) returnFocus = trigger;
    if (terminal.open) terminal.close();
    if (palette.open) palette.close();
    dialog.showModal();
    if (dialog === terminal && !matchMedia('(pointer: coarse)').matches) input.focus();
  };
  const closeDialog = (dialog) => {
    dialog.close();
    if (returnFocus instanceof HTMLElement) returnFocus.focus({preventScroll:true});
  };
  document.querySelectorAll('[data-terminal]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => openDialog(terminal, button));
  });
  document.querySelectorAll('[data-palette]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => openDialog(palette, button));
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog(dialog);
    });
  });
  palette.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeDialog(palette)));
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (palette.open) closeDialog(palette); else openDialog(palette);
    }
  });
  const print = (text, className = '') => {
    const line = document.createElement('p');
    line.textContent = text;
    if (className) line.className = className;
    output.append(line);
    while (output.childElementCount > 120) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  };
  const printLink = (text, href) => {
    const line = document.createElement('p');
    const link = document.createElement('a');
    link.textContent = text; link.href = href;
    line.append(link); output.append(line); output.scrollTop = output.scrollHeight;
  };
  const history = [];
  let cursor = 0;
  let draft = '';
  const commands = {
    help: () => print('whoami      A little about me\nexperience  What I work on\nprojects    Systems and research\nskills      My everyday toolbox\neducation   The foundations\ncontact     Say hello\ncv          Download my CV\nprofile     Back to the page\nclear       A clean slate\njoke        Debugging break'),
    whoami: () => print('Hey, I’m Afaq. Software Engineer II at Elektrobit, based in Oulu, Finland.\nC++, Linux, embedded systems — and whatever looks interesting enough to break and rebuild.'),
    experience: () => print('Elektrobit · Oct 2022–present\nSoftware Engineer II (previously Engineer I, 2022–2024). SDK design, Adaptive AUTOSAR, secure diagnostics, IAM, and embedded Linux.\n\nTeradata · Sep 2021–Aug 2022\nAssociate Consultant. SQL, ETL/DCM, Azure, and workflow automation.\n\nEducative · Jun–Sep 2021\nTechnical Engineer. Containers, Linux, and testing.'),
    projects: () => { print('SDK engineering — VirtualBox to WSL, cross-compilation, and ARM target debugging.\nDMS research — U-Net attention and model quantization.\nPPG research — motion artifact detection and signal processing.'); printLink('PPG repository ↗', 'https://github.com/mafaq318/Motion-Artifacts-Detection-in-PPG-Signal'); printLink('Portfolio source ↗', 'https://github.com/mafaq318/mafaq318.github.io'); },
    skills: () => print('C++ · C · Python · SQL · Shell\nLinux · WSL · systemd · QEMU · Yocto\nCMake · GCC · GDB · Jenkins · Docker\nGoogleTest · GoogleMock · Robot Framework · gcov · Bullseye'),
    education: () => print('M.Sc. in Computing Sciences · Tampere University · 2022–2026\nSignal Processing and Machine Learning\n\nB.Sc. in Electrical Engineering · LUMS · 2017–2021'),
    contact: () => { printLink('Email: mafaqq318@gmail.com','mailto:mafaqq318@gmail.com'); printLink('LinkedIn ↗','https://www.linkedin.com/in/mafaq'); printLink('GitHub ↗','https://github.com/mafaq318'); },
    cv: () => printLink('Open the latest CV ↓','docs/AFAQ_MOHAMMAD_CV.pdf'),
    profile: () => closeDialog(terminal),
    clear: () => output.replaceChildren(),
    joke: () => print('There are only two hard things in computer science: cache invalidation, naming things, and off-by-one errors.'),
    ls: () => commands.help(),
    exit: () => closeDialog(terminal)
  };
  document.querySelector('#terminal-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    history.push(value); if (history.length > 100) history.shift();
    cursor = history.length; draft = ''; input.value = '';
    print(`visitor:~$ ${value}`, 'command');
    const name = value.toLowerCase();
    if (Object.hasOwn(commands, name)) commands[name]();
    else print(`Command not found: ${value}\nType help for available commands.`);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      if (cursor === history.length) draft = input.value;
      cursor = Math.max(0, cursor - 1); input.value = history[cursor];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); cursor = Math.min(history.length, cursor + 1);
      input.value = cursor === history.length ? draft : history[cursor];
    }
  });
  print('Welcome to my corner of the internet.');
  print('Type help to explore. This is a portfolio shell, not a real system terminal.');

  // A slow field of character-based waves. No external animation libraries.
  const canvas = document.querySelector('#signal');
  const context = canvas.getContext('2d');
  if (!context) return;
  const hero = document.querySelector('.hero');
  const toggle = document.querySelector('#motion-toggle');
  let width = 0, height = 0, frame = 0, last = 0, time = 0;
  let inView = true, paused = false;
  let pointer = {x:-1000,y:-1000};
  const glyphs = ' .:+=*#%@';
  const isStill = () => paused || motionQuery.matches;
  const draw = () => {
    context.clearRect(0,0,width,height);
    const mobile = width < 600;
    const stepX = mobile ? 13 : 11;
    const stepY = mobile ? 18 : 15;
    context.font = `${mobile ? 11 : 12}px ui-monospace, monospace`;
    context.textAlign = 'center';
    for (let y = 12; y < height; y += stepY) {
      for (let x = 8; x < width; x += stepX) {
        const nx = x / width, ny = y / height;
        const waveA = Math.sin(nx * 10 + ny * 7 - time * .38);
        const waveB = Math.cos(ny * 13 - nx * 5 + time * .24);
        const ridge = Math.pow((waveA * waveB + 1) / 2, 2.2);
        const distance = Math.hypot(x-pointer.x,y-pointer.y);
        const touch = isStill() ? 0 : Math.max(0,1-distance/150);
        const density = Math.min(1,ridge + touch * .2);
        const alpha = (.09 + density*.62) * Math.min(1,(height-y)/95);
        context.fillStyle = `rgba(${Math.round(90+density*55)},${Math.round(150+density*60)},${Math.round(153+density*49)},${alpha})`;
        const glyph = glyphs[Math.min(glyphs.length-1,Math.floor(density*glyphs.length))];
        context.fillText(glyph,x,y + touch * Math.sin(time)*3);
      }
    }
  };
  const tick = stamp => {
    if (isStill() || !inView || document.hidden) { frame = 0; return; }
    if (stamp-last >= (width < 600 ? 66 : 42)) {
      time += Math.min((stamp-last)/1000,.08); last = stamp; draw();
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0;
    toggle.textContent = isStill() ? 'Motion paused' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(isStill()));
    toggle.disabled = motionQuery.matches;
    toggle.title = motionQuery.matches ? 'Your reduced-motion preference is enabled' : '';
    draw();
    if (!isStill() && inView && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
  };
  const resize = () => {
    const rect = hero.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1,2);
    canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0); sync();
  };
  toggle.hidden = false;
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || isStill()) return;
    const rect = hero.getBoundingClientRect(); pointer = {x:event.clientX-rect.left,y:event.clientY-rect.top};
  },{passive:true});
  hero.addEventListener('pointerleave', () => { pointer = {x:-1000,y:-1000}; });
  motionQuery.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); },{threshold:0}).observe(hero);
  resize();
})();
