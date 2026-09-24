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
- Optional terminal with `help`, `whoami`, `projects`, `experience`, `skills`, `education`, `contact`, and `cv` commands.
- Quick navigation with Ctrl/Cmd + K or the menu button.
- Motion can be paused and respects reduced-motion settings. Animation stops when the hero is offscreen or the tab is hidden.
- Content stays readable without JavaScript.

The CV download lives at `docs/AFAQ_MOHAMMAD_CV.pdf`. Page content is in `index.html`; styles and interactions are in `styles.css` and `script.js`.

ASCII motion inspiration: [jess.vc](https://www.jess.vc/). The signal animation here is an original canvas implementation.
