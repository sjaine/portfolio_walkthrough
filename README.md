# Portfolio walkthrough

Intro sequence for Jaine's portfolio, built with Next.js (App Router), Tailwind CSS v4 and GSAP.

1. **Greeting** – "Hi, My name is Jaine." streams in character by character (drop + blur → sharp).
2. **Thinking** – three gooey dots pop in and bounce in a staggered loop.
3. **Loading** – the dots melt together and stretch into a progress bar with a shimmering status label.
4. **Layer 1** – the greeting fades out, the prompt streams into the same spot, the cards rise in and the first card is selected.

Cards are selectable by click or arrow keys. **Skip** (or `Esc`) jumps to the end; **Replay** restarts. Visitors with reduced motion enabled see the final screen immediately.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where things live

- `components/Intro.tsx` – the whole sequence as one GSAP timeline (texts and options at the top of the file).
- `app/globals.css` – colours, the layout scale (`--text`, `--card-size`, `--gap`) and the shimmer/glint animations.
