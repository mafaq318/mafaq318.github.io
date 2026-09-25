# mafaq318.github.io

My personal portfolio — C++, embedded Linux, automotive software, and applied ML research.

Plain HTML, CSS, and JavaScript. Hosted on GitHub Pages.

## Run locally

```sh
python3 -m http.server 8080
```

Open http://localhost:8080.

## A few details

- Profile-first layout with an animated ASCII signal in the hero.
- Linux-style terminal with `ls`, `cd`, `cat`, `grep`, `find`, `tree`, command history, and Tab completion. Type `help` for portfolio commands or `man` for shell commands.
- Terminal opens beside the portfolio on desktop and as a popup on mobile. Its in-memory filesystem resets on reload.
- Light and dark themes, plus a `kill` command with a crash animation and reboot button.
- Quick navigation with Ctrl/Cmd + K or the menu button.
- Motion can be paused and respects reduced-motion settings. Animation stops when the hero is offscreen or the tab is hidden.
- Content stays readable without JavaScript.

The CV download lives at `docs/AFAQ_MOHAMMAD_CV.pdf`. Page content is in `index.html`; styles and interactions are in `styles.css`, `script.js`, and `shell.js`.

ASCII motion inspiration: [jess.vc](https://www.jess.vc/). The signal animation here is an original canvas implementation.
