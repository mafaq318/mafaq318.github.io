(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Touch / coarse pointers: never autofocus the shell input (opens mobile keyboard).
  const isTouchUi =
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const termOutput = document.querySelector("[data-term-output]");
  const termForm = document.querySelector("[data-term-form]");
  const termInput = document.querySelector("[data-term-input]");
  const profileView = document.querySelector("[data-profile-view]");
  const termView = document.querySelector("[data-term-view]");
  const viewButtons = Array.from(document.querySelectorAll("[data-view-btn]"));
  const profileMenu = document.querySelector("[data-profile-menu]");
  const profileTrigger = document.querySelector("[data-profile-trigger]");
  const profileDropdown = document.querySelector("[data-profile-dropdown]");
  const profileLinks = Array.from(document.querySelectorAll("[data-profile-link]"));

  const history = [];
  let historyIndex = -1;

  const focusTermInput = () => {
    if (!termInput || isTouchUi) return;
    termInput.focus({ preventScroll: true });
  };

  const COMMANDS = {
    help: {
      summary: "List available commands",
    },
    whoami: {
      summary: "Short intro",
    },
    experience: {
      summary: "Work history",
    },
    projects: {
      summary: "Selected projects",
    },
    skills: {
      summary: "Technical strengths",
    },
    education: {
      summary: "Degrees",
    },
    contact: {
      summary: "Email and links",
    },
    cv: {
      summary: "Download CV (PDF)",
    },
    ls: {
      summary: "List sections",
    },
    joke: {
      summary: "Random programmer joke",
    },
    clear: {
      summary: "Clear the terminal",
    },
    profile: {
      summary: "Switch to Profile view",
    },
  };

  const JOKES = [
    {
      setup: "Why do programmers prefer dark mode?",
      punchline: "Because light attracts bugs.",
    },
    {
      setup: "A SQL query walks into a bar, walks up to two tables, and asks:",
      punchline: '"Mind if I join you?"',
    },
    {
      setup: "How many programmers does it take to change a light bulb?",
      punchline: "None. It's a hardware problem.",
    },
    {
      setup: "What's a programmer's favorite hangout?",
      punchline: "Foo Bar.",
    },
    {
      setup: "Why did the C++ developer go broke?",
      punchline: "Because he lost his object of reference.",
    },
    {
      setup: "There are only 10 kinds of people in the world.",
      punchline: "Those who understand binary, and those who don't.",
    },
  ];
  let jokeIndex = Math.floor(Math.random() * JOKES.length);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const closeProfileMenu = () => {
    if (!profileMenu || !profileTrigger || !profileDropdown) return;
    profileMenu.classList.remove("is-open");
    profileTrigger.setAttribute("aria-expanded", "false");
    profileDropdown.hidden = true;
  };

  const openProfileMenu = () => {
    if (!profileMenu || !profileTrigger || !profileDropdown) return;
    profileMenu.classList.add("is-open");
    profileTrigger.setAttribute("aria-expanded", "true");
    profileDropdown.hidden = false;
  };

  const revealProfileContent = () => {
    // Sections start hidden — IntersectionObserver never sees them until the view opens
    profileView?.querySelectorAll("[data-reveal]").forEach((node) => {
      node.classList.add("is-visible");
    });
  };

  /** @type {{ setActive: (on: boolean) => void } | null} */
  let heroConstellation = null;

  const setView = (view, { scrollTop = true } = {}) => {
    const next = view === "profile" ? "profile" : "terminal";
    body.dataset.view = next;

    if (profileView) profileView.hidden = next !== "profile";
    if (termView) termView.hidden = next === "profile";

    viewButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.viewBtn === next);
    });

    heroConstellation?.setActive(next === "profile");

    if (next === "terminal") {
      closeProfileMenu();
      requestAnimationFrame(() => focusTermInput());
    } else {
      revealProfileContent();
      if (scrollTop) {
        // Instant — smooth scroll here races with section jumps from the dropdown
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }
  };

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const targetView = btn.dataset.viewBtn;
      if (targetView === "profile") {
        const wasTerminal = body.dataset.view !== "profile";
        if (btn.hasAttribute("data-profile-trigger")) {
          // Only reset scroll when arriving from Terminal; keep position when toggling the menu
          setView("profile", { scrollTop: wasTerminal });
          if (profileMenu?.classList.contains("is-open")) closeProfileMenu();
          else openProfileMenu();
          event.stopPropagation();
        } else {
          setView("profile", { scrollTop: true });
          closeProfileMenu();
        }
        return;
      }
      closeProfileMenu();
      setView("terminal");
    });
  });

  const scrollToSection = (section, { smooth = false } = {}) => {
    if (!section) return;
    section.scrollIntoView({
      behavior: smooth && !reduceMotion ? "smooth" : "auto",
      block: "start",
    });
  };

  const goToProfileSection = (href) => {
    if (!href) return;
    const section = document.querySelector(href);
    if (!section) return;

    setView("profile", { scrollTop: false });
    closeProfileMenu();

    // Wait for Profile to un-hide and lay out, then jump.
    // history.replaceState does NOT scroll — use hash + scrollIntoView.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const html = document.documentElement;
        const prevBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";

        const { pathname, search } = window.location;
        if (window.location.hash === href) {
          history.replaceState(null, "", pathname + search);
        }
        window.location.hash = href;
        scrollToSection(section, { smooth: false });

        html.style.scrollBehavior = prevBehavior;
      });
    });
  };

  // Event delegation — survives any DOM churn and always sees dropdown clicks
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest("[data-profile-link]");
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      goToProfileSection(link.getAttribute("href"));
      return;
    }

    if (profileMenu && !profileMenu.contains(target)) {
      closeProfileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProfileMenu();
  });

  document.querySelector("[data-home]")?.addEventListener("click", (event) => {
    if (body.dataset.view === "terminal") {
      event.preventDefault();
      runCommand("help", { echo: true });
      focusTermInput();
    } else {
      event.preventDefault();
      setView("profile");
    }
  });

  const sections = profileLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (body.dataset.view !== "profile") return;

    const marker = window.scrollY + window.innerHeight * 0.28;
    let activeId = "";
    sections.forEach((section) => {
      if (section.offsetTop <= marker) activeId = `#${section.id}`;
    });
    profileLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === activeId);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
  const show = (node) => node.classList.add("is-visible");
  if (!("IntersectionObserver" in window) || reduceMotion || revealNodes.length === 0) {
    revealNodes.forEach(show);
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealNodes.forEach((node) => observer.observe(node));
  }

  const scrollTerm = () => {
    if (!termOutput) return;
    termOutput.scrollTop = termOutput.scrollHeight;
  };

  const appendBlock = (html) => {
    if (!termOutput) return null;
    const block = document.createElement("div");
    block.className = "term-block";
    block.innerHTML = html;
    termOutput.appendChild(block);
    scrollTerm();
    return block;
  };

  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const appendLine = (text, className = "") => {
    const safe = escapeHtml(text);
    return appendBlock(
      `<pre class="term-line${className ? ` ${className}` : ""}">${safe}</pre>`
    );
  };

  /** Highlight a whole line (degree names, job titles, etc.). */
  const appendTitle = (text) =>
    appendBlock(
      `<pre class="term-line"><span class="term-accent">${escapeHtml(text)}</span></pre>`
    );

  const cmdButton = (name) =>
    `<button type="button" class="term-cmd" data-run="${name}">${name}</button>`;

  const renderHelp = () => {
    const rows = Object.entries(COMMANDS)
      .map(
        ([name, meta]) =>
          `<div class="term-help__row">${cmdButton(name)}<span class="term-help-desc">${meta.summary}</span></div>`
      )
      .join("");

    appendBlock(`
      <div class="term-help">${rows}</div>
      <pre class="term-line term-line--dim">Tip: type <span class="term-accent">joke</span> for a programmer joke.</pre>
    `);
  };

  const tellJoke = async () => {
    const joke = JOKES[jokeIndex % JOKES.length];
    jokeIndex += 1;
    appendLine(joke.setup);
    if (reduceMotion) {
      appendLine(joke.punchline, "term-line--punch");
      return;
    }
    appendLine("...", "term-line--dim");
    await sleep(700);
    const lastBlock = termOutput?.querySelector(".term-block:last-child");
    const dots = lastBlock?.querySelector(".term-line--dim");
    if (dots && dots.textContent === "...") {
      dots.textContent = joke.punchline;
      dots.classList.remove("term-line--dim");
      dots.classList.add("term-line--punch");
    } else {
      appendLine(joke.punchline, "term-line--punch");
    }
    scrollTerm();
  };

  const content = {
    whoami() {
      appendTitle("Mohammad Afaq");
      appendLine("Oulu, Finland");
      appendTitle("Software Engineer by heart");
    },
    experience() {
      appendTitle("Elektrobit Automotive Finland Oy — Software Engineer / Design Lead");
      appendLine("Oct 2022 – Present · Oulu, Finland");
      appendLine("  · Lead design/ownership of two Adaptive AUTOSAR components");
      appendLine("  · Production C++ Adaptive apps (security, reliability, performance)");
      appendLine("  · Coverage, unit/integration/fuzz testing (GTest, Robot Framework)");
      appendLine("  · Cross-component coordination across the build system");
      appendLine("");
      appendTitle("Teradata Global Consulting — Associate Consultant");
      appendLine("Sept 2021 – Aug 2022 · Islamabad, Pakistan");
      appendLine("  · Enterprise ETL/DCM for retail clients");
      appendLine("  · SQL ops, Azure integration, workflow automation");
      appendLine("");
      appendTitle("Educative Inc — Technical Engineer");
      appendLine("June 2021 – Sept 2021 · Lahore, Pakistan");
      appendLine("  · Docker, Kubernetes, shell scripting, Elixir testing");
    },
    projects() {
      appendTitle("[elektrobit] Volkswagen ICAS1 Program");
      appendLine("  Embedded C++ (C++14/C++20) for VW software-defined vehicle platform");
      appendLine("  Feature work, C++20 migration, Linux/SDK stack maintenance");
      appendLine("");
      appendTitle("[thesis/msc] Model Quantization for Efficient DMS Analysis");
      appendLine("  Attention mechanisms + U-Net; quantization for embedded inference");
      appendLine("");
      appendTitle("[thesis/bsc] Motion Artifact Removal from PPG Data");
      appendLine("  Real-time overlapping-window algorithm for heart-rate accuracy");
    },
    skills() {
      appendLine("Languages     C, C++ (C++14/C++20), Python, SQL, Shell");
      appendLine("Environments  Linux, Ubuntu, WSL, VirtualBox, Embedded Linux");
      appendLine("Build/CI      Git, Docker, Yocto, Jenkins, CMake, GCC, Makefiles");
      appendLine("Testing       Robot Framework, GoogleTest/Mock, GDB, fuzz testing");
      appendLine("Domain        Embedded systems, AUTOSAR, SDK maintenance");
      appendLine("Practices     Agile/Scrum, Jira, code reviews, SwDD/SwAD docs");
    },
    education() {
      appendTitle("M.Sc. (Technology) in Computing Sciences");
      appendLine("Tampere University · 2026");
      appendLine("Major: Signal Processing and Machine Learning");
      appendLine("");
      appendTitle("B.Sc. in Electrical Engineering");
      appendLine("LUMS · 2021");
    },
    contact() {
      appendBlock(`
        <pre class="term-line">Email     <a href="mailto:mafaqq318@gmail.com">mafaqq318@gmail.com</a></pre>
        <pre class="term-line">GitHub    <a href="https://github.com/mafaq318" target="_blank" rel="noopener noreferrer">github.com/mafaq318</a></pre>
        <pre class="term-line">LinkedIn  <a href="https://www.linkedin.com/in/mafaq" target="_blank" rel="noopener noreferrer">linkedin.com/in/mafaq</a></pre>
        <pre class="term-line">CV        <a href="docs/AFAQ_MOHAMMAD_CV.pdf" download>download now</a></pre>
      `);
    },
    ls() {
      appendLine("experience  projects  skills  education  contact  cv  joke");
      appendLine("Type a name, or run help.");
    },
  };

  const runCommand = (raw, { echo = true, sfx = true } = {}) => {
    const input = String(raw || "").trim();
    if (!input) return;

    if (echo) {
      appendBlock(`
        <pre class="term-line term-line--cmd"><span class="term-prompt-inline">visitor@afaq_os:~$</span> ${input
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>
      `);
    }

    if (sfx) termSfx?.blip();

    const [name, ...args] = input.toLowerCase().split(/\s+/);
    const aliases = {
      "?": "help",
      man: "help",
      about: "whoami",
      me: "whoami",
      exp: "experience",
      work: "experience",
      jobs: "experience",
      proj: "projects",
      edu: "education",
      mail: "contact",
      email: "contact",
      resume: "cv",
      "download-cv": "cv",
      jokes: "joke",
      funny: "joke",
      partytrick: "joke",
      "party-trick": "joke",
    };

    let cmd = aliases[name] || name;
    if (name === "cat" && args[0]) {
      cmd = aliases[args[0]] || args[0];
    }
    if ((name === "open" || name === "view") && args[0] === "profile") {
      cmd = "profile";
    }
    if (cmd === "help") {
      renderHelp();
      return;
    }
    if (cmd === "clear") {
      if (termOutput) termOutput.innerHTML = "";
      return;
    }
    if (cmd === "joke") {
      tellJoke();
      return;
    }
    if (cmd === "cv") {
      appendLine("Opening CV download…");
      const link = document.createElement("a");
      link.href = "docs/AFAQ_MOHAMMAD_CV.pdf";
      link.download = "";
      link.click();
      return;
    }
    if (cmd === "profile") {
      appendLine("Switching to Profile view…");
      setView("profile");
      return;
    }
    if (typeof content[cmd] === "function") {
      content[cmd]();
      return;
    }

    // Light replies for classic unix mischief
    const joke = matchShellJoke(input, name, args);
    if (joke) {
      joke.forEach((line, i) =>
        appendLine(line, i === 0 ? "term-line--warn" : "term-line--dim")
      );
      return;
    }

    appendLine(`command not found: ${name}`, "term-line--err");
    appendLine('Type "help" to see available commands.', "term-line--dim");
  };

  const SHELL_JOKES = [
    {
      test: (input, name, args) =>
        name === "sudo" ||
        (name === "su" && (!args.length || args[0] === "-" || args[0] === "root")) ||
        input.includes("sudo root") ||
        (name === "root" && !args.length),
      lines: [
        "sudo: nice try, visitor.",
        "With great power comes… a polite “no”.",
      ],
    },
    {
      test: (input, name) =>
        name === "shutdown" ||
        name === "reboot" ||
        name === "halt" ||
        name === "poweroff" ||
        name === "init",
      lines: [
        "shutdown: denied. This shell runs on caffeine, not ACPI.",
        "Try `clear` — same drama, fewer angry fans.",
      ],
    },
    {
      test: (input, name, args) =>
        name === "rm" && args.some((a) => a === "-rf" || a === "-fr" || a.startsWith("/")),
      lines: [
        "rm: whoa there, cowboy.",
        "I only delete bugs, and even those I unit-test first.",
      ],
    },
    {
      test: (input, name) =>
        name === "kill" || name === "killall" || name === "pkill",
      lines: [
        "kill: target process filed a restraining order.",
        "How about `whoami` instead? Harmless, and mildly flattering.",
      ],
    },
    {
      test: (input, name) => name === "forkbomb" || input.includes(":(){"),
      lines: [
        "forkbomb: cute. My laptop already has enough tabs open.",
        "Process limit reached: one curious visitor at a time.",
      ],
    },
    {
      test: (input, name) => name === "exit" || name === "logout" || name === "quit",
      lines: [
        "exit: leaving so soon? The prompt looks lonely.",
        "Type `profile` for the fancy view, or stick around and type `joke`.",
      ],
    },
  ];

  const matchShellJoke = (input, name, args) => {
    const hit = SHELL_JOKES.find((entry) => entry.test(input.toLowerCase(), name, args));
    return hit ? hit.lines : null;
  };

  termView?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const cmd = target.dataset.run;
    if (!cmd) return;
    runCommand(cmd, { echo: true });
    focusTermInput();
  });

  termForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = termInput?.value || "";
    if (!value.trim()) return;
    history.push(value);
    historyIndex = history.length;
    runCommand(value, { echo: true });
    if (termInput) termInput.value = "";
  });

  termInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      historyIndex = Math.max(0, historyIndex - 1);
      termInput.value = history[historyIndex] || "";
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      termInput.value =
        historyIndex === history.length ? "" : history[historyIndex] || "";
    }
  });

  // Keep focus in the terminal when clicking the window background (desktop only)
  document.querySelector(".term-window")?.addEventListener("click", (event) => {
    if (body.dataset.view !== "terminal" || isTouchUi) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("a, button, input")) return;
    focusTermInput();
  });

  const dismissBoot = async (bootEl) => {
    bootEl.classList.add("is-done");
    document.body.classList.remove("is-booting");
    await sleep(480);
    bootEl.hidden = true;
  };

  const boot = async () => {
    const bootEl = document.querySelector("[data-boot]");
    const logEl = document.querySelector("[data-boot-log]");
    if (!bootEl || !logEl) return;

    if (reduceMotion || sessionStorage.getItem("mafaq-booted") === "1") {
      await dismissBoot(bootEl);
      return;
    }

    document.body.classList.add("is-booting");
    const lines = [
      "AFAQ-OS v1.9.26",
      "Mounting portfolio shell .... OK",
      "Starting interactive terminal .... OK",
      "",
      "Welcome, visitor.",
    ];
    for (const line of lines) {
      logEl.textContent += `${line}\n`;
      await sleep(110 + Math.random() * 70);
    }
    await sleep(280);
    await dismissBoot(bootEl);
    sessionStorage.setItem("mafaq-booted", "1");
  };

  const startUptime = () => {
    const nodes = document.querySelectorAll("[data-uptime]");
    if (!nodes.length) return;
    const start = Date.now();
    const tick = () => {
      const total = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(total / 3600)).padStart(2, "0");
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
      const s = String(total % 60).padStart(2, "0");
      nodes.forEach((el) => {
        el.textContent = `${h}:${m}:${s}`;
      });
    };
    tick();
    setInterval(tick, 1000);
  };

  const createTermSfx = () => {
    const btn = document.querySelector("[data-term-sfx]");
    const label = btn?.querySelector(".term-music__label");
    let ctx = null;
    let enabled = true;

    const syncUi = () => {
      if (!btn) return;
      btn.setAttribute("aria-pressed", String(enabled));
      btn.title = enabled ? "Mute command beeps" : "Enable command beeps";
      if (label) label.textContent = enabled ? "sfx on" : "sfx off";
    };

    const ensureCtx = async () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
      }
      if (ctx.state === "suspended") await ctx.resume();
      return true;
    };

    const tone = (freq, when, dur, type, gainVal) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, when);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(gainVal, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + dur + 0.03);
    };

    const blip = () => {
      if (!enabled || reduceMotion) return;
      void ensureCtx().then((ok) => {
        if (!ok || !ctx) return;
        const t = ctx.currentTime;
        tone(520, t, 0.05, "square", 0.04);
        tone(780, t + 0.055, 0.07, "square", 0.035);
      });
    };

    const setEnabled = (on) => {
      enabled = Boolean(on);
      syncUi();
      if (enabled) blip();
    };

    btn?.addEventListener("click", () => {
      setEnabled(!enabled);
      appendLine(
        enabled ? "command beeps: on" : "command beeps: off",
        "term-line--dim"
      );
    });

    syncUi();

    return {
      blip,
      setEnabled,
      enabled: () => enabled,
    };
  };

  const termSfx = createTermSfx();

  const initHeroConstellation = () => {
    const hero = document.querySelector(".hero");
    const canvas = document.querySelector("[data-hero-constellation]");
    if (!(hero instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
      return null;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    /** @type {{ x: number, y: number, vx: number, vy: number, r: number }[]} */
    let nodes = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let active = false;
    let pointerInside = false;
    let pointerX = 0;
    let pointerY = 0;

    const nodeCount = () => {
      if (w < 520) return 48;
      if (w < 900) return 70;
      return 92;
    };

    const seedNodes = () => {
      const count = nodeCount();
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.6 + Math.random() * 2.2,
      }));
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
      if (reduceMotion) paintStatic();
    };

    const paintStatic = () => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = Math.min(180, w * 0.24);
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const alpha = (1 - dist / linkDist) * 0.42;
          ctx.strokeStyle = `rgba(100, 210, 255, ${alpha})`;
          ctx.lineWidth = 1.15;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = "rgba(48, 209, 88, 0.75)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      if (!active) return;
      ctx.clearRect(0, 0, w, h);

      const linkDist = Math.min(190, w * 0.26);
      const attractR = 220;

      for (const n of nodes) {
        if (pointerInside) {
          const dx = pointerX - n.x;
          const dy = pointerY - n.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < attractR) {
            const pull = (1 - dist / attractR) * 0.06;
            n.vx += (dx / dist) * pull;
            n.vy += (dy / dist) * pull;
          }
        }

        // Idle drift + damping
        n.vx += (Math.random() - 0.5) * 0.018;
        n.vy += (Math.random() - 0.5) * 0.018;
        n.vx *= 0.982;
        n.vy *= 0.982;

        const speed = Math.hypot(n.vx, n.vy);
        if (speed > 1.15) {
          n.vx = (n.vx / speed) * 1.15;
          n.vy = (n.vy / speed) * 1.15;
        }

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = w;
        if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h;
        if (n.y > h) n.y = 0;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;

          let alpha = (1 - dist / linkDist) * 0.5;
          if (pointerInside) {
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const toPtr = Math.hypot(mx - pointerX, my - pointerY);
            if (toPtr < attractR) {
              alpha += (1 - toPtr / attractR) * 0.65;
            }
          }

          const nearCyan = pointerInside && alpha > 0.4;
          ctx.strokeStyle = nearCyan
            ? `rgba(100, 210, 255, ${Math.min(alpha, 0.95)})`
            : `rgba(48, 209, 88, ${Math.min(alpha, 0.78)})`;
          ctx.lineWidth = nearCyan ? 1.6 : 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        let glow = 0.72;
        if (pointerInside) {
          const d = Math.hypot(n.x - pointerX, n.y - pointerY);
          if (d < attractR) glow = 0.72 + (1 - d / attractR) * 0.28;
        }
        ctx.fillStyle = `rgba(48, 209, 88, ${glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        if (glow > 0.82) {
          ctx.fillStyle = `rgba(100, 210, 255, ${(glow - 0.72) * 1.4})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };

    const setActive = (on) => {
      active = Boolean(on);
      cancelAnimationFrame(raf);
      if (!active) return;
      resize();
      if (reduceMotion) {
        paintStatic();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    if (!reduceMotion) {
      hero.addEventListener(
        "pointermove",
        (event) => {
          if (!active) return;
          const rect = hero.getBoundingClientRect();
          pointerInside = true;
          pointerX = event.clientX - rect.left;
          pointerY = event.clientY - rect.top;
        },
        { passive: true }
      );
      hero.addEventListener(
        "pointerleave",
        () => {
          pointerInside = false;
        },
        { passive: true }
      );
    }

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        if (!active) return;
        resize();
        if (reduceMotion) paintStatic();
      });
      ro.observe(hero);
    } else {
      window.addEventListener(
        "resize",
        () => {
          if (!active) return;
          resize();
          if (reduceMotion) paintStatic();
        },
        { passive: true }
      );
    }

    return { setActive };
  };

  const initPortraitTilt = () => {
    const figures = Array.from(document.querySelectorAll("[data-portrait-tilt]"));
    if (!figures.length || reduceMotion) return;

    const maxTilt = 11;
    const maxShift = 8;

    figures.forEach((figure) => {
      if (!(figure instanceof HTMLElement)) return;
      const bezel = figure.querySelector(".crt-portrait__bezel");
      if (!(bezel instanceof HTMLElement)) return;

      const reset = () => {
        figure.classList.remove("is-hot");
        figure.style.setProperty("--tilt-x", "0deg");
        figure.style.setProperty("--tilt-y", "0deg");
        figure.style.setProperty("--glare-a", "0");
        figure.style.setProperty("--glare-x", "50%");
        figure.style.setProperty("--glare-y", "40%");
        figure.style.setProperty("--img-x", "0px");
        figure.style.setProperty("--img-y", "0px");
      };

      figure.addEventListener(
        "pointermove",
        (event) => {
          const rect = figure.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          const nx = Math.min(1, Math.max(0, px));
          const ny = Math.min(1, Math.max(0, py));
          const tiltY = (nx - 0.5) * (maxTilt * 2);
          const tiltX = (0.5 - ny) * (maxTilt * 2);

          figure.classList.add("is-hot");
          figure.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
          figure.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
          figure.style.setProperty("--glare-x", `${(nx * 100).toFixed(1)}%`);
          figure.style.setProperty("--glare-y", `${(ny * 100).toFixed(1)}%`);
          figure.style.setProperty("--glare-a", "1");
          figure.style.setProperty("--img-x", `${((0.5 - nx) * maxShift).toFixed(2)}px`);
          figure.style.setProperty("--img-y", `${((0.5 - ny) * maxShift).toFixed(2)}px`);
        },
        { passive: true }
      );

      figure.addEventListener("pointerleave", reset, { passive: true });
      figure.addEventListener("pointercancel", reset, { passive: true });
    });
  };

  const hackerizeTerminalPortrait = () => {
    const img = document.querySelector(".crt-portrait--hacker img");
    if (!img || img.dataset.hackerized === "1") return;

    // Bayer 4×4 — classic terminal / hacker dither
    const bayer = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];

    const apply = () => {
      try {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        if (!srcW || !srcH) return;

        // Low-res dither, then nearest-neighbor upscale = chunky hacker bitmap
        const pixelSize = 3;
        const w = Math.max(48, Math.floor(srcW / pixelSize));
        const h = Math.max(48, Math.floor(srcH / pixelSize));

        const small = document.createElement("canvas");
        small.width = w;
        small.height = h;
        const sctx = small.getContext("2d", { willReadFrequently: true });
        if (!sctx) return;

        sctx.imageSmoothingEnabled = true;
        sctx.drawImage(img, 0, 0, w, h);
        const frame = sctx.getImageData(0, 0, w, h);
        const data = frame.data;

        const on = [48, 209, 88];
        const off = [2, 8, 4];

        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const i = (y * w + x) * 4;
            let luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            luma = Math.min(255, Math.max(0, (luma - 12) * 1.25));
            const threshold = ((bayer[y & 3][x & 3] + 0.5) / 16) * 255;
            const lit = luma > threshold;
            data[i] = lit ? on[0] : off[0];
            data[i + 1] = lit ? on[1] : off[1];
            data[i + 2] = lit ? on[2] : off[2];
            data[i + 3] = 255;
          }
        }
        sctx.putImageData(frame, 0, 0);

        const canvas = document.createElement("canvas");
        canvas.width = srcW;
        canvas.height = srcH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, 0, 0, srcW, srcH);

        img.dataset.hackerized = "1";
        img.src = canvas.toDataURL("image/png");
      } catch {
        /* ignore — leave original photo */
      }
    };

    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener("load", apply, { once: true });
  };

  const init = async () => {
    startUptime();
    hackerizeTerminalPortrait();
    initPortraitTilt();
    heroConstellation = initHeroConstellation();

    // Always land on Terminal. Hash links (e.g. #experience) open Profile.
    const initialView =
      location.hash && document.querySelector(location.hash) ? "profile" : "terminal";

    try {
      localStorage.removeItem("mafaq-view");
    } catch {
      /* ignore */
    }

    setView(initialView, { scrollTop: !location.hash });
    await boot();

    if (body.dataset.view === "terminal") {
      appendLine("AFAQ's shell — type a command or click one below.");
      runCommand("help", { echo: true, sfx: false });
      focusTermInput();
    } else if (location.hash) {
      const section = document.querySelector(location.hash);
      requestAnimationFrame(() => scrollToSection(section));
    }
  };
  init();
})();
