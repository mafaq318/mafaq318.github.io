(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const termOutput = document.querySelector("[data-term-output]");
  const termForm = document.querySelector("[data-term-form]");
  const termInput = document.querySelector("[data-term-input]");
  const profileView = document.querySelector("[data-profile-view]");
  const termView = document.querySelector("[data-term-view]");
  const viewButtons = Array.from(document.querySelectorAll("[data-view-btn]"));

  const history = [];
  let historyIndex = -1;

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
      summary: "Degrees and certifications",
    },
    contact: {
      summary: "Email and links",
    },
    cv: {
      summary: "Open CV download",
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

  const closeNav = () => {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });
  }

  const setView = (view) => {
    const next = view === "profile" ? "profile" : "terminal";
    body.dataset.view = next;

    if (profileView) profileView.hidden = next !== "profile";
    if (termView) termView.hidden = next === "profile";

    viewButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.viewBtn === next);
    });

    if (next === "terminal") {
      closeNav();
      requestAnimationFrame(() => termInput?.focus());
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  };
  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.viewBtn));
  });

  document.querySelector("[data-home]")?.addEventListener("click", (event) => {
    if (body.dataset.view === "terminal") {
      event.preventDefault();
      runCommand("help", { echo: true });
      termInput?.focus();
    }
  });

  const navLinks = nav ? Array.from(nav.querySelectorAll("a[href^='#']")) : [];
  const sections = navLinks
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
    navLinks.forEach((link) => {
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

  const appendLine = (text, className = "") => {
    const safe = String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return appendBlock(
      `<pre class="term-line${className ? ` ${className}` : ""}">${safe}</pre>`
    );
  };

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
      <pre class="term-line term-line--dim">Available commands — click one or type it below:</pre>
      <div class="term-help">${rows}</div>
      <pre class="term-line term-line--dim">Tip: try the <span class="term-accent">mind reader</span> party trick on the left — or type <span class="term-accent">joke</span>.</pre>
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
      appendLine("Mohammad Afaq");
      appendLine("Software Engineer / Design Lead — Embedded & Automotive");
      appendLine("Oulu, Finland");
      appendLine("");
      appendLine(
        "Hands-on with C/C++ (C++14/C++20), Python, Yocto, Adaptive AUTOSAR,"
      );
      appendLine(
        "SDK maintenance, target testing, and CI/CD — focused on performance,"
      );
      appendLine("efficiency, and security.");
    },
    experience() {
      appendLine("Elektrobit Automotive Finland Oy — Software Engineer / Design Lead");
      appendLine("Oct 2022 – Present · Oulu, Finland");
      appendLine("  · Lead design/ownership of two Adaptive AUTOSAR components");
      appendLine("  · Production C++ Adaptive apps (security, reliability, performance)");
      appendLine("  · Coverage, unit/integration/fuzz testing (GTest, Robot Framework)");
      appendLine("  · Cross-component coordination across the build system");
      appendLine("");
      appendLine("Teradata Global Consulting — Associate Consultant");
      appendLine("Sept 2021 – Aug 2022 · Islamabad, Pakistan");
      appendLine("  · Enterprise ETL/DCM for retail clients");
      appendLine("  · SQL ops, Azure integration, workflow automation");
      appendLine("");
      appendLine("Educative Inc — Technical Engineer");
      appendLine("June 2021 – Sept 2021 · Lahore, Pakistan");
      appendLine("  · Docker, Kubernetes, shell scripting, Elixir testing");
    },
    projects() {
      appendLine("[elektrobit] Volkswagen ICAS1 Program");
      appendLine("  Embedded C++ (C++14/C++20) for VW software-defined vehicle platform");
      appendLine("  Feature work, C++20 migration, Linux/SDK stack maintenance");
      appendLine("");
      appendLine("[thesis/msc] Model Quantization for Efficient DMS Analysis");
      appendLine("  Attention mechanisms + U-Net; quantization for embedded inference");
      appendLine("");
      appendLine("[thesis/bsc] Motion Artifact Removal from PPG Data");
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
      appendLine("M.Sc. (Technology) in Computing Sciences");
      appendLine("Tampere University · Aug 2022 – Mar 2026");
      appendLine("Major: Signal Processing and Machine Learning");
      appendLine("");
      appendLine("B.Sc. in Electrical Engineering");
      appendLine("LUMS · Sept 2017 – May 2021");
      appendLine("");
      appendLine("Certifications:");
      appendLine("  · CMake for Cross-Platform C++ Project Building");
      appendLine("  · Teradata Vantage Associate");
      appendLine("  · Microsoft Azure Fundamentals");
      appendLine("  · 2023 Web Development Bootcamp");
      appendLine("  · C++ Unit Testing: Google Test and Google Mock");
    },
    contact() {
      appendBlock(`
        <pre class="term-line">Email     <a href="mailto:mafaqq318@gmail.com">mafaqq318@gmail.com</a></pre>
        <pre class="term-line">GitHub    <a href="https://github.com/mafaq318" target="_blank" rel="noopener noreferrer">github.com/mafaq318</a></pre>
        <pre class="term-line">LinkedIn  <a href="https://www.linkedin.com/in/mafaq" target="_blank" rel="noopener noreferrer">linkedin.com/in/mafaq</a></pre>
        <pre class="term-line">CV        <a href="docs/AFAQ_MOHAMMAD_CV.pdf" download>docs/AFAQ_MOHAMMAD_CV.pdf</a></pre>
      `);
    },
    ls() {
      appendLine("experience  projects  skills  education  contact  cv  joke");
      appendLine("Type a name, or run help.");
    },
  };

  const runCommand = (raw, { echo = true } = {}) => {
    const input = String(raw || "").trim();
    if (!input) return;

    if (echo) {
      appendBlock(`
        <pre class="term-line term-line--cmd"><span class="term-prompt-inline">visitor@mafaq318:~$</span> ${input
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>
      `);
    }

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

    appendLine(`command not found: ${name}`, "term-line--err");
    appendLine('Type "help" to see available commands.', "term-line--dim");
  };

  termView?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const cmd = target.dataset.run;
    if (!cmd) return;
    runCommand(cmd, { echo: true });
    termInput?.focus();
  });

  const initPartyTrick = () => {
    const root = document.querySelector("[data-party-trick]");
    if (!root) return;

    const cards = Array.from(root.querySelectorAll("[data-party-card]"));
    const revealBtn = root.querySelector("[data-party-reveal]");
    const resetBtn = root.querySelector("[data-party-reset]");
    const resultEl = root.querySelector("[data-party-result]");

    const reset = () => {
      root.classList.remove("is-solved");
      cards.forEach((card) => card.setAttribute("aria-pressed", "false"));
      if (resultEl) {
        resultEl.textContent = "";
        resultEl.classList.remove("is-reveal");
      }
      if (revealBtn) revealBtn.hidden = false;
      if (resetBtn) resetBtn.hidden = true;
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        if (root.classList.contains("is-solved")) return;
        const on = card.getAttribute("aria-pressed") === "true";
        card.setAttribute("aria-pressed", String(!on));
      });
    });

    revealBtn?.addEventListener("click", async () => {
      const selected = cards.filter((c) => c.getAttribute("aria-pressed") === "true");
      const total = selected.reduce(
        (sum, card) => sum + Number(card.dataset.value || 0),
        0
      );

      root.classList.add("is-solved");
      if (revealBtn) revealBtn.hidden = true;
      if (resetBtn) resetBtn.hidden = false;

      if (!resultEl) return;
      resultEl.classList.remove("is-reveal");

      if (total === 0) {
        resultEl.textContent = "You didn’t pick any cards — try 1–15, then select the matches.";
        resultEl.classList.add("is-reveal");
        root.classList.remove("is-solved");
        if (revealBtn) revealBtn.hidden = false;
        if (resetBtn) resetBtn.hidden = true;
        return;
      }

      resultEl.textContent = "Scanning bits…";
      if (!reduceMotion) await sleep(450);
      resultEl.textContent = `You’re thinking of ${total}.`;
      resultEl.classList.add("is-reveal");

      appendLine(`party-trick: guessed ${total} (binary mind reader)`, "term-line--dim");
    });

    resetBtn?.addEventListener("click", reset);
  };

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
      termInput.value = historyIndex === history.length ? "" : history[historyIndex] || "";
    }
  });

  // Keep focus in the terminal when clicking the window background
  document.querySelector(".term-window")?.addEventListener("click", (event) => {
    if (body.dataset.view !== "terminal") return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("a, button")) return;
    termInput?.focus();
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
      "MAFAQ-OS v1.9.26",
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

  const startPhosphorSpot = () => {
    const spot = document.querySelector("[data-phosphor]");
    if (!spot || reduceMotion) return;
    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    const render = () => {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      spot.style.left = `${x}px`;
      spot.style.top = `${y}px`;
      raf = requestAnimationFrame(render);
    };
    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        spot.classList.add("is-on");
      },
      { passive: true }
    );
    window.addEventListener("pointerleave", () => spot.classList.remove("is-on"), {
      passive: true,
    });
    raf = requestAnimationFrame(render);
    window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
  };

  const startCodeRain = () => {
    const canvas = document.querySelector("[data-code-rain]");
    if (!(canvas instanceof HTMLCanvasElement) || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const glyphs = "01<>[]{};:/\\$#*+=C++AUTOSARYOCTO";
    let columns = [];
    let width = 0;
    let height = 0;
    let fontSize = 14;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      fontSize = width < 700 ? 12 : 14;
      columns = Array.from({ length: Math.floor(width / fontSize) }, () => Math.random() * -40);
    };
    const draw = () => {
      ctx.fillStyle = "rgba(5, 12, 9, 0.08)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(57, 255, 136, 0.75)";
      ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;
      columns.forEach((y, index) => {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillText(char, index * fontSize, y * fontSize);
        columns[index] = y * fontSize > height && Math.random() > 0.975 ? 0 : y + 1;
      });
      requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
  };

  const init = async () => {
    startUptime();
    startPhosphorSpot();
    startCodeRain();
    initPartyTrick();

    // Always land on Terminal. Hash links (e.g. #experience) open Profile.
    const initialView =
      location.hash && document.querySelector(location.hash) ? "profile" : "terminal";

    try {
      localStorage.removeItem("mafaq-view");
    } catch {
      /* ignore */
    }

    setView(initialView);
    await boot();

    if (body.dataset.view === "terminal") {
      appendLine("MAFAQ portfolio shell — type a command or click one below.");
      appendLine("Party trick loaded on the left: binary mind reader.", "term-line--dim");
      runCommand("help", { echo: true });
      termInput?.focus();
    }
  };
  init();
})();
