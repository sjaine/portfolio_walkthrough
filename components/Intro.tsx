"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

const GREETING = "Hi, My name is Jaine.";
const PROMPT = "How can I help you today? Let’s start with [FO/RE].";
const OPTIONS = ["FO", "RE"];
const STATUS = "Preparing walkthrough";

/**
 * Intro sequence, one GSAP timeline:
 *  1. greeting streams in character by character (drop + blur → sharp)
 *  2. three "thinking" dots pop in and bounce, staggered
 *  3. the dots melt together and stretch into a progress bar that fills
 *  4. greeting fades out, Layer 1's prompt streams in, cards rise, first card selected
 */
export default function Intro() {
  const root = useRef<HTMLElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);
  const greetTextRef = useRef<HTMLParagraphElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const dotsRef = useRef<HTMLSpanElement[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const cardsRef = useRef<HTMLButtonElement[]>([]);
  const bordersRef = useRef<HTMLSpanElement[]>([]);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(-1);

  /* ---------------- the timeline ---------------- */
  useGSAP(
    () => {
      const greeting = greetingRef.current!;
      const dots = dotsRef.current;
      const loader = loaderRef.current!;
      const bar = barRef.current!;
      const fill = fillRef.current!;
      const status = statusRef.current!;
      const cards = cardsRef.current;

      const greet = SplitText.create(greetTextRef.current, { type: "words,chars" });
      const prompt = SplitText.create(promptRef.current, { type: "words,chars" });

      // Streamed-AI reveal: each glyph drops in from above and sharpens.
      const stream = { autoAlpha: 0, y: "-0.5em", filter: "blur(6px)", duration: 0.56, ease: "expo.out" };

      const finish = () => {
        setSelected(0);
        setReady(true);
      };

      const t = gsap.timeline({ paused: true });

      // 1 — greeting
      t.from(greet.chars, { ...stream, stagger: 0.03 }, 0.15);

      // 2 — thinking dots
      t.addLabel("think", "+=0.05")
        .fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.52, ease: "back.out(2.2)", stagger: 0.09 }, "think")
        .to(
          dots,
          {
            keyframes: {
              "0%": { yPercent: 0, scaleX: 1, scaleY: 1 },
              "32%": { yPercent: -85, scaleX: 0.94, scaleY: 1.06, ease: "power2.out" },
              "58%": { yPercent: 0, scaleX: 1.1, scaleY: 0.88, ease: "power2.in" },
              "72%": { scaleX: 1, scaleY: 1, ease: "power2.out" },
              "100%": { yPercent: 0 },
            },
            duration: 0.78,
            repeat: 1,
            stagger: 0.14,
          },
          ">-0.05",
        );

      // 3 — loading: dots slide together (the goo filter melts them), then stretch into a bar
      t.addLabel("load")
        .to(
          dots,
          {
            x: (i) => (1 - i) * (dots[1].offsetLeft - dots[0].offsetLeft),
            scale: 1.15,
            duration: 0.48,
            ease: "power2.inOut",
          },
          "load",
        )
        .set(loader, { autoAlpha: 1 })
        .to(dots, { autoAlpha: 0, duration: 0.16 }, "<")
        .fromTo(
          bar,
          {
            width: () => dots[0].offsetWidth * 1.15,
            height: () => dots[0].offsetWidth * 1.15,
            backgroundColor: "#2f2f2f",
          },
          {
            width: () => Math.min(180, greeting.clientWidth * 0.42),
            height: 6,
            backgroundColor: "#ededed",
            duration: 0.62,
            ease: "back.out(1.4)",
          },
          "<",
        )
        .fromTo(
          status,
          { autoAlpha: 0, x: -6, filter: "blur(4px)" },
          { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out" },
          "<0.22",
        );

      // Uneven progress, like a model working through steps.
      const progress = gsap
        .timeline({
          defaults: { ease: "power1.inOut" },
          onUpdate: () => {
            const p = Math.round(Number(gsap.getProperty(fill, "scaleX")) * 100);
            status.textContent = `${STATUS} · ${p}%`;
          },
        })
        .fromTo(fill, { scaleX: 0 }, { scaleX: 0.34, duration: 0.25 })
        .to(fill, { scaleX: 0.42, duration: 0.14 })
        .to(fill, { scaleX: 0.81, duration: 0.24 })
        .to(fill, { scaleX: 0.88, duration: 0.11 })
        .to(fill, { scaleX: 1, duration: 0.12 });
      t.add(progress, "<0.04").call(() => {
        status.textContent = "Ready";
      });

      // 4 — Layer 1
      t.to(greeting, { autoAlpha: 0, y: -6, filter: "blur(6px)", duration: 0.42, ease: "power2.in" }, "+=0.16")
        .addLabel("layer1")
        .from(prompt.chars, { ...stream, stagger: 0.017 }, "layer1")
        .fromTo(
          cards,
          { autoAlpha: 0, y: 48, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: "back.out(1.4)",
            stagger: 0.11,
            clearProps: "transform", // hand transforms back to CSS for the press effect
          },
          "layer1+=0.32",
        )
        .call(finish, [], "+=0.08");

      tl.current = t;

      // Everything that must start hidden is hidden now; reveal the stage.
      gsap.set(root.current, { autoAlpha: 1 });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        t.progress(1);
        return;
      }

      let cancelled = false;
      document.fonts.ready.then(() => {
        if (!cancelled) t.play(0);
      });
      return () => {
        cancelled = true;
      };
    },
    { scope: root },
  );

  /* ---------------- selected border ---------------- */
  useGSAP(
    () => {
      bordersRef.current.forEach((b, i) =>
        gsap.to(
          b,
          i === selected
            ? { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(2)", overwrite: true }
            : { autoAlpha: 0, scale: 1.04, duration: 0.22, ease: "power1.out", overwrite: true },
        ),
      );
    },
    { dependencies: [selected], scope: root },
  );

  /* ---------------- controls ---------------- */
  const skip = useCallback(() => {
    tl.current?.progress(1);
    setSelected(0);
    setReady(true);
  }, []);

  const replay = useCallback(() => {
    setReady(false);
    setSelected(-1);
    tl.current?.restart();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ready) {
        if (e.key === "Escape") skip();
        return;
      }
      const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
      if (!step) return;
      e.preventDefault();
      const next = (Math.max(selected, 0) + step + OPTIONS.length) % OPTIONS.length;
      setSelected(next);
      cardsRef.current[next]?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ready, selected, skip]);

  return (
    <>
      {/* Gooey filter: soft, slightly blobby dot edges, and lets the dots melt together. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
        </filter>
      </svg>

      <div className="grid h-full place-items-center">
        <main
          ref={root}
          className="invisible relative w-[calc(var(--card-size)*2+var(--gap))] max-w-[calc(100vw-32px)]"
        >
          {/* Greeting layer — sits exactly where the Layer 1 prompt will appear */}
          <div ref={greetingRef} className="absolute inset-x-0 top-0 z-10" aria-hidden="true">
            <p ref={greetTextRef} className="min-h-[1.3em] text-[length:var(--text)] leading-[1.3] tracking-[-0.012em]">
              {GREETING}
            </p>

            <div className="relative mt-[calc(var(--text)*0.95)] h-[calc(var(--text)*1.2)]">
              <div className="absolute inset-0 [filter:url(#goo)]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    ref={(el) => {
                      if (el) dotsRef.current[i] = el;
                    }}
                    className="absolute bottom-[calc(var(--text)*0.15)] size-[var(--dot)] rounded-full bg-dot"
                    style={{ left: `calc(var(--dot-step) * ${i})` }}
                  />
                ))}
              </div>

              <div
                ref={loaderRef}
                className="invisible absolute bottom-[calc(var(--text)*0.15)] left-[var(--dot-step)] flex h-[var(--dot)] items-center gap-[calc(var(--text)*0.6)]"
              >
                <div ref={barRef} className="relative size-[var(--dot)] flex-none overflow-hidden rounded-full bg-dot">
                  <div ref={fillRef} className="sweep-glint absolute inset-0 origin-left scale-x-0 bg-ink" />
                </div>
                <span
                  ref={statusRef}
                  className="shimmer-text whitespace-nowrap text-[length:calc(var(--text)*0.5)] tracking-[0.01em] tabular-nums"
                >
                  {STATUS}
                </span>
              </div>
            </div>
          </div>

          {/* Layer 1 */}
          <h1 ref={promptRef} className="min-h-[1.3em] text-[length:var(--text)] font-normal leading-[1.3] tracking-[-0.012em]">
            {PROMPT}
          </h1>

          <div role="radiogroup" aria-label={PROMPT} className="mt-[calc(var(--text)*1.55)] flex gap-[var(--gap)]">
            {OPTIONS.map((label, i) => (
              <button
                key={label}
                ref={(el) => {
                  if (el) cardsRef.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected === i}
                aria-label={label}
                tabIndex={selected === i || (selected < 0 && i === 0) ? 0 : -1}
                onClick={() => ready && setSelected(i)}
                className="invisible relative aspect-square max-w-[var(--card-size)] flex-1 cursor-pointer rounded-[9%] bg-card transition-[background-color,scale] duration-200 [-webkit-tap-highlight-color:transparent] hover:bg-card-hover focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[#8a8a8a] active:scale-[0.975]"
              >
                <span
                  ref={(el) => {
                    if (el) bordersRef.current[i] = el;
                  }}
                  className="pointer-events-none invisible absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2.5px_var(--color-ink)]"
                />
              </button>
            ))}
          </div>
        </main>
      </div>

      <button
        type="button"
        onClick={ready ? replay : skip}
        className="fixed bottom-4 right-4 cursor-pointer rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-[#8a8a8a]"
      >
        {ready ? "Replay" : "Skip"}
      </button>
    </>
  );
}
