(() => {
  'use strict';
  const themeButton = document.querySelector('#theme-toggle');
  const updateThemeButton = () => {
    const light = document.documentElement.dataset.theme === 'light';
    themeButton.textContent = light ? '☾' : '☀';
    themeButton.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
    themeButton.title = themeButton.getAttribute('aria-label');
    document.querySelector('meta[name="theme-color"]').content = light ? '#f5f4ef' : '#101416';
  };
  themeButton.hidden = false;
  updateThemeButton();
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('afaq-theme', theme); } catch { /* Storage can be disabled. */ }
    updateThemeButton();
    document.dispatchEvent(new Event('portfolio-theme-change'));
  });
  const terminal = document.querySelector('#terminal');
  const palette = document.querySelector('#palette');
  const input = document.querySelector('#terminal-input');
  const output = document.querySelector('#terminal-output');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const desktopTerminal = matchMedia('(min-width: 1100px)');
  let returnFocus = null;
  const hideTerminal = () => {
    terminal.close();
    document.body.classList.remove('terminal-split');
  };
  const showTerminal = () => {
    document.body.classList.toggle('terminal-split', desktopTerminal.matches);
    if (desktopTerminal.matches) terminal.show();
    else terminal.showModal();
  };
  desktopTerminal.addEventListener('change', () => {
    if (!terminal.open) return;
    const focused = terminal.contains(document.activeElement);
    hideTerminal(); showTerminal();
    if (focused && !matchMedia('(pointer: coarse)').matches) input.focus({preventScroll:true});
  });
  const openDialog = (dialog, trigger = document.activeElement) => {
    const wasOpen = terminal.open || palette.open;
    if (!wasOpen) returnFocus = trigger;
    if (terminal.open) hideTerminal();
    if (palette.open) palette.close();
    if (dialog === terminal) showTerminal();
    else dialog.showModal();
    if (dialog === terminal) document.body.classList.add('terminal-discovered');
    if (dialog === terminal && !matchMedia('(pointer: coarse)').matches) input.focus();
  };
  const closeDialog = (dialog) => {
    if (dialog === terminal) hideTerminal();
    else dialog.close();
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
  document.querySelectorAll('#terminal, #palette').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog(dialog);
    });
  });
  palette.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeDialog(palette)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && terminal.open && desktopTerminal.matches) {
      event.preventDefault(); closeDialog(terminal); return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (crashing) return;
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
  const crash = document.querySelector('#crash');
  let crashTimer = 0;
  let crashing = false;
  const reboot = () => {
    clearTimeout(crashTimer);
    crashing = false;
    document.body.classList.remove('is-crashing');
    crash.close();
    input.disabled = false;
    print('System restored. Maybe try coffee next time.', 'command');
    if (returnFocus instanceof HTMLElement) returnFocus.focus({preventScroll:true});
  };
  const killPortfolio = () => {
    if (crashing) return;
    crashing = true;
    input.disabled = true;
    print('SIGKILL received. Saving absolutely nothing…', 'command');
    hideTerminal();
    palette.close();
    document.body.classList.add('is-crashing');
    crash.showModal();
    document.querySelector('#restart').focus();
    crashTimer = setTimeout(() => document.body.classList.remove('is-crashing'), motionQuery.matches ? 0 : 1500);
  };
  document.querySelector('#restart').addEventListener('click', reboot);
  crash.addEventListener('cancel', event => { event.preventDefault(); reboot(); });
  const commands = {
    help: () => print('about       A little about me\nexperience  What I work on\nprojects    Systems and research\nskills      My everyday toolbox\neducation   The foundations\ncontact     Say hello\ncv          Download my CV\nprofile     Back to the page\nclear       A clean slate\njoke        Debugging break\nls / cd / pwd / tree   Explore files\nman         Shell command reference\ncat <file>  Read a file from ls\nneofetch    System overview\nkill        Pull the plug'),
    kill: killPortfolio,
    'kill -9': killPortfolio,
    'kill portfolio': killPortfolio,
    about: () => print('Hey, I’m Afaq. Software Engineer II at Elektrobit, based in Oulu, Finland.\nC++, Linux, embedded systems — and whatever looks interesting enough to break and rebuild.'),
    experience: () => print('Elektrobit · Oct 2022–present\nSoftware Engineer II (previously Engineer I, 2022–2024). SDK design, Adaptive AUTOSAR, secure diagnostics, IAM, and embedded Linux.\n\nTeradata · Sep 2021–Aug 2022\nAssociate Consultant. SQL, ETL/DCM, Azure, and workflow automation.\n\nEducative · Jun–Sep 2021\nTechnical Engineer. Containers, Linux, and testing.'),
    projects: () => { print('SDK engineering — VirtualBox to WSL, cross-compilation, and ARM target debugging.\nDMS research — U-Net attention and model quantization.\nPPG research — motion artifact detection and signal processing.'); printLink('PPG repository ↗', 'https://github.com/mafaq318/Motion-Artifacts-Detection-in-PPG-Signal'); printLink('Portfolio source ↗', 'https://github.com/mafaq318/mafaq318.github.io'); },
    skills: () => print('C++ · C · Python · SQL · Shell\nLinux · WSL · systemd · QEMU · Yocto\nCMake · GCC · GDB · Jenkins · Docker\nGoogleTest · GoogleMock · Robot Framework · gcov · Bullseye'),
    education: () => print('M.Sc. in Computing Sciences · Tampere University · 2022–2026\nSignal Processing and Machine Learning\n\nB.Sc. in Electrical Engineering · LUMS · 2017–2021'),
    contact: () => { printLink('Email: mafaqq318@gmail.com','mailto:mafaqq318@gmail.com'); printLink('LinkedIn ↗','https://www.linkedin.com/in/mafaq'); printLink('GitHub ↗','https://github.com/mafaq318'); },
    cv: () => printLink('Open the latest CV ↓','docs/AFAQ_MOHAMMAD_CV.pdf'),
    profile: () => closeDialog(terminal),
    clear: () => output.replaceChildren(),
    joke: () => print('There are only two hard things in computer science: cache invalidation, naming things, and off-by-one errors.'),
    ls: () => print('about.txt    experience.txt    projects/    skills.txt    education.txt    contact.txt    cv.pdf'),
    pwd: () => print('/home/visitor'),
    'uname -a': () => print('Afaq Linux · portfolio shell · browser edition'),
    neofetch: () => print('    .--.       visitor@afaq-linux\n   |o_o |      ------------------\n   |:_/ |      OS: Afaq Linux (portfolio shell)\n  //   \\ \\     Host: Oulu, Finland\n (|     | )    Focus: C++ / embedded Linux\n /\\_   _/\\    Shell: JavaScript\n \\___)=(___/   Fuel: coffee + curiosity'),
    'cat about.txt': () => commands.about(),
    'cat experience.txt': () => commands.experience(),
    'cat skills.txt': () => commands.skills(),
    'cat education.txt': () => commands.education(),
    'cat contact.txt': () => commands.contact(),
    'ls projects': () => commands.projects(),
    'ls projects/': () => commands.projects(),
    exit: () => closeDialog(terminal)
  };
  const shell = new PortfolioShell({
    '/home/visitor/about.txt': 'Mohammad Afaq — Software Engineer II at Elektrobit.\nOulu, Finland. C++, embedded Linux, SDK engineering, and automotive software.',
    '/home/visitor/skills.txt': 'C++ / C / Python / SQL / Shell\nLinux / WSL / systemd / QEMU / Yocto\nCMake / GCC / GDB / Jenkins / Docker\nGoogleTest / GoogleMock / Robot Framework',
    '/home/visitor/experience.txt': 'Elektrobit: Software Engineer II, Oct 2022–present\nTeradata: Associate Consultant, Sep 2021–Aug 2022\nEducative: Technical Engineer, Jun–Sep 2021',
    '/home/visitor/contact.txt': 'Email: mafaqq318@gmail.com\nLinkedIn: https://www.linkedin.com/in/mafaq\nGitHub: https://github.com/mafaq318',
    '/home/visitor/education.txt': 'M.Sc. Computing Sciences — Tampere University, 2022–2026\nB.Sc. Electrical Engineering — LUMS, 2017–2021',
    '/home/visitor/projects/dms.txt': 'U-Net attention and quantization for differential mobility spectrometry analysis.',
    '/home/visitor/projects/ppg.txt': 'PPG motion artifact detection with MATLAB.\nhttps://github.com/mafaq318/Motion-Artifacts-Detection-in-PPG-Signal',
    '/home/visitor/projects/sdk.txt': 'Windows SDK design ownership, VirtualBox to WSL migration, cross-compilation and ARM target debugging.',
    '/home/visitor/.bashrc': '# Welcome, curious visitor.\n# Type help to explore.',
    '/etc/os-release': 'NAME="Afaq Linux"\nPRETTY_NAME="Afaq Linux — portfolio edition"',
    '/home/visitor/README.txt': 'This is a simulated Linux shell inside a portfolio.\nType help for portfolio commands or man for filesystem commands.\nTemporary file changes reset on reload. Try: cd projects, ls, cat dms.txt.'
  });
  const syncPrompt = () => {
    document.querySelector('.shell-path').textContent = shell.promptPath;
    document.querySelector('#terminal-title').textContent = `visitor@afaq-linux: ${shell.promptPath}`;
  };
  document.querySelector('#terminal-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    history.push(value); if (history.length > 100) history.shift();
    cursor = history.length; draft = ''; input.value = '';
    print(`visitor@afaq-linux:${shell.promptPath}$ ${value}`, 'command');
    const name = value.toLowerCase().replace(/\s+/g, ' ');
    const result = shell.execute(value, history);
    if (result !== null) { if (result) print(result); syncPrompt(); }
    else if (Object.hasOwn(commands, name)) commands[name]();
    else print(`Command not found: ${value}\nType help for available commands.`);
  });
  input.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); commands.clear(); return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault(); print(`visitor@afaq-linux:${shell.promptPath}$ ${input.value}^C`, 'command'); input.value = ''; return;
    }
    if (event.key === 'Tab' && input.value.trim() && !event.shiftKey) {
      const matches = shell.complete(input.value, Object.keys(commands).filter(name => !name.includes(' ')));
      if (matches.length) {
        event.preventDefault();
        if (matches.length === 1) input.value = matches[0];
        else print(matches.join('  '));
      }
      return;
    }
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      if (cursor === history.length) draft = input.value;
      cursor = Math.max(0, cursor - 1); input.value = history[cursor];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); cursor = Math.min(history.length, cursor + 1);
      input.value = cursor === history.length ? draft : history[cursor];
    }
  });
  print('Welcome to Afaq Linux — interactive portfolio shell');
  print('Type help for the portfolio, man for shell commands, or neofetch.');
  print('Simulated filesystem · local to this tab · resets on reload');
  print('');

  const ideScene = document.querySelector('.ide-opening-scene');
  if (ideScene && 'IntersectionObserver' in window) {
    ideScene.classList.add('ide-waiting');
    const ideObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        ideScene.classList.remove('ide-waiting');
        ideObserver.disconnect();
      }
    }, {threshold: .4});
    ideObserver.observe(ideScene);
  }

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
  const portrait = new Image();
  const portraitSample = document.createElement('canvas');
  portraitSample.width = 100; portraitSample.height = 120;
  const sampleContext = portraitSample.getContext('2d', {willReadFrequently:true});
  let portraitPixels = null;
  portrait.addEventListener('load', () => {
    const scale = Math.max(100 / portrait.width, 120 / portrait.height);
    sampleContext.drawImage(portrait, (100 - portrait.width * scale) / 2, (120 - portrait.height * scale) / 2, portrait.width * scale, portrait.height * scale);
    portraitPixels = sampleContext.getImageData(0, 0, 100, 120).data;
    draw();
  });
  portrait.src = 'assets/portrait.jpg';
  const isStill = () => paused || motionQuery.matches;
  const draw = () => {
    context.clearRect(0,0,width,height);
    const mobile = width < 600;
    const light = document.documentElement.dataset.theme === 'light';
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
        const alpha = (.18 + density*.8) * Math.min(1,(height-y)/95);
        context.fillStyle = light ? `rgba(15,105,111,${alpha})` : `rgba(125,235,223,${alpha})`;
        const glyph = glyphs[Math.min(glyphs.length-1,Math.floor(density*glyphs.length))];
        context.fillText(glyph,x,y + touch * Math.sin(time)*3);
      }
    }
    if (portraitPixels) {
      const pw = Math.min(width * (mobile ? .8 : .38), 460);
      const ph = pw * 1.2;
      const px = width - pw - width * .055;
      const py = (height - ph) / 2;
      const sweep = isStill() ? .5 : (time * .13) % 1.6 - .3;
      const cellX = mobile ? 5 : 6;
      const cellY = mobile ? 7 : 8;
      context.save();
      context.font = `${mobile ? 7 : 8}px ui-monospace, monospace`;
      context.textBaseline = 'middle';
      for (let y = 0; y < ph; y += cellY) {
        for (let x = 0; x < pw; x += cellX) {
          const sx = Math.min(99, Math.floor(x / pw * 100));
          const sy = Math.min(119, Math.floor(y / ph * 120));
          const i = (sy * 100 + sx) * 4;
          const brightness = (portraitPixels[i] * .2126 + portraitPixels[i + 1] * .7152 + portraitPixels[i + 2] * .0722) / 255;
          const band = Math.exp(-Math.pow((y / ph - sweep) / .19, 2));
          const edge = Math.min(1, x / 25, (pw - x) / 25, y / 25, (ph - y) / 25);
          const tone = light ? 1 - brightness : brightness;
          const alpha = (.16 + band * .84) * edge;
          context.fillStyle = light ? `rgba(15,80,85,${alpha})` : `rgba(141,235,219,${alpha})`;
          const characters = ' .,:;i1tfLCG08@';
          const character = characters[Math.min(characters.length - 1, Math.floor(tone * characters.length))];
          context.fillText(character, px + x, py + y);
        }
      }
      context.restore();
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
    document.body.classList.toggle('motion-paused', isStill());
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
  document.addEventListener('portfolio-theme-change', draw);
  motionQuery.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); },{threshold:0}).observe(hero);
  resize();

})();
