# Accord design direction

Updated 15-09-2026. Warm paper (#f8f6f0) is the default across the site and workspace. Forest (#285440), pale green (#cfdfbf), and apricot (#edd0ae) form the palette. Reference image 6 informs the inset frame and ruled/hatched gutters. The converter sits on a grainy green/apricot gradient. Manrope handles reading and UI; Geist Pixel handles the hero accent and selected display text. The supplied Hyperiux lines loader runs once per session with a short timeout and reduced-motion support. Originkit ASCII waves and footer Tetris remain, with real theSVG marks. Existing vendor assets remain credited below.

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

## Sources checked during the material redesign

- User supplied six reference images; image 6 supplies the frame/gutter grammar.
- Geist Pixel: https://vercel.com/font and https://github.com/vercel/geist-font. Loaded through Next font.
- Transitions.dev: https://transitions.dev, restrained hover/press timings applied to controls.
- BYQ: configured MCP endpoint discovered, but BYQ_SUPPLY_API_KEY is unavailable to this session; no BYQ component is claimed as imported.
