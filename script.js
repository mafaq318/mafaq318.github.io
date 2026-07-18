(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a[href^='#']")) : [];
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id ? document.querySelector(id) : null;
    })
    .filter(Boolean);

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
    navLinks.forEach((link) => link.addEventListener("click", closeNav));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });
  }

  const onScroll = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const typeText = async (el, text, speed = 28) => {
    if (!el) return;
    el.textContent = "";
    if (reduceMotion) {
      el.textContent = text;
      return;
    }
    for (let i = 0; i < text.length; i += 1) {
      el.textContent += text[i];
      await sleep(speed + Math.random() * 18);
    }
  };

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
      "MAFAQ-OS v1.9.26 (retro build)",
      "Checking memory ............... OK",
      "Mounting /home/mafaq ........... OK",
      "Loading profile modules ........ OK",
      "Init CRT phosphor driver ....... OK",
      "Starting portfolio shell .......",
      "",
      "Welcome, visitor.",
    ];

    for (const line of lines) {
      logEl.textContent += `${line}\n`;
      await sleep(140 + Math.random() * 90);
    }

    await sleep(350);
    await dismissBoot(bootEl);
    sessionStorage.setItem("mafaq-booted", "1");
  };
  const runHeroTyping = async () => {
    const cmdEl = document.querySelector("[data-typed-cmd]");
    const roleEl = document.querySelector("[data-typed-role]");
    const summaryEl = document.querySelector("[data-typed-summary]");

    await typeText(cmdEl, "whoami --verbose", 36);
    await sleep(220);
    await typeText(
      roleEl,
      "Software Engineer / Design Lead — Embedded & Automotive",
      22
    );
    await sleep(160);
    await typeText(
      summaryEl,
      "Building reliable low-level software in modern C++, Yocto, and Adaptive AUTOSAR — with a focus on performance, efficiency, and security.",
      12
    );
  };

  const startUptime = () => {
    const el = document.querySelector("[data-uptime]");
    if (!el) return;
    const start = Date.now();
    const tick = () => {
      const total = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(total / 3600)).padStart(2, "0");
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
      const s = String(total % 60).padStart(2, "0");
      el.textContent = `${h}:${m}:${s}`;
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

    window.addEventListener(
      "pointerleave",
      () => {
        spot.classList.remove("is-on");
      },
      { passive: true }
    );

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
      const colCount = Math.floor(width / fontSize);
      columns = Array.from({ length: colCount }, () => Math.random() * -40);
    };

    const draw = () => {
      ctx.fillStyle = "rgba(5, 12, 9, 0.08)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(57, 255, 136, 0.75)";
      ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;

      columns.forEach((y, index) => {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = index * fontSize;
        ctx.fillText(char, x, y * fontSize);
        if (y * fontSize > height && Math.random() > 0.975) {
          columns[index] = 0;
        } else {
          columns[index] = y + 1;
        }
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
    await boot();
    await runHeroTyping();
  };

  init();
})();
