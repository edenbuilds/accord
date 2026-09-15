# Accord design direction

Updated 15-09-2026. Paper (#f7f8f3) is the default across the site, converter and gateway dashboard. Green (#d8e9bd) anchors the live demo; dark green type and buttons provide contrast. Dither stays on margins and the hero uses the supplied Originkit ASCII wave. No startup loader. Geist headings, ordinary readable labels, monospace only for code. Existing vendor assets remain credited below.

Logo: the A-mark supplied on 14-09-2026, traced by hand as a single even-odd SVG path (components/ui.tsx `Mark`). The registered-mark symbol is not used.

## Credits and lineage

- **Originkit hero-21:** the ASCII wave field (components/originkit/ui/hero-21/character-waves.tsx, typed and trimmed) and the dither noise strip (public/originkit/hero-21/nav-noise.png). Its sample logos and dashboard card were removed.
- **Originkit footer-02:** the Tetris canvas in the footer (components/originkit/ui/footer-02/tetris.tsx).
- **Hyperiux Vault:**
  - lines-loader (option 2, restyled; the once-per-session site loader)
  - scramble-text (text prop added)
  - border-beam (Test this tool)
  - number-counter (hero facts)
  - animated-faq (FAQ)
  - char-stagger-primary-button (hero CTA)
  - dotted-grid (waitlist background, demo hints removed)
- **theSVG** (github.com/glincker/thesvg): every brand icon.
- **References:** libraries.dev (agent-friendly structure) and transitions.dev (CSS micro-states).

GSAP drives Hyperiux effects and the old reveal. No element is animated by two libraries. Originkit's `motion` reveal was removed.
