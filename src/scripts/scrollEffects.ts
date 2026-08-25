/**
 * Scroll-driven choreography + section glide (GSAP ScrollTrigger).
 *
 * - Hero intro: plays when the envelope overlay clears ("envelope:opened").
 * - Idle life: florals float gently forever.
 * - Scroll: hero florals drift on parallax; sections rise into view.
 * - Glide: natural scrolling everywhere; when the user pauses, the view
 *   glides to the nearest SECTION BOUNDARY. Sections taller than the
 *   viewport (e.g. schedule + map) scroll freely inside, so nothing is
 *   ever out of reach — snapping only engages near their edges.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function initScrollEffects(): void {
  const hero = document.querySelector<HTMLElement>("#inicio");
  const info = document.querySelector<HTMLElement>("#invitacion");
  if (!hero || !info) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      reduce: "(prefers-reduced-motion: reduce)",
      full: "(prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      const { reduce } = ctx.conditions;

      /* ------------------------------------------------------------------ */
      /* Hero intro                                                          */
      /* ------------------------------------------------------------------ */

      // Initial states are applied AT STARTUP (while the envelope overlay
      // still hides everything) so nothing is ever visible statically and
      // then "re-animated" — the intro simply tweens to the final state.
      const line = document.querySelector<SVGPathElement>("[data-flourish-line]");
      let lineLength = 0;

      if (!reduce) {
        gsap.set("[data-hero-animate]", { y: 26, autoAlpha: 0 });
        gsap.set("[data-hero-name-left]", { x: -56, autoAlpha: 0 });
        gsap.set("[data-hero-name-right]", { x: 56, autoAlpha: 0 });
        gsap.set("[data-hero-amp]", { scale: 0, autoAlpha: 0 });
        gsap.set("[data-hero-divider] i", { scale: 0, autoAlpha: 0 });
        gsap.set("[data-hero-divider] span:first-child", {
          scaleX: 0,
          transformOrigin: "right center",
          autoAlpha: 0,
        });
        gsap.set("[data-hero-divider] span:last-child", {
          scaleX: 0,
          transformOrigin: "left center",
          autoAlpha: 0,
        });
        if (line) {
          lineLength = line.getTotalLength();
          gsap.set(line, { strokeDasharray: lineLength, strokeDashoffset: lineLength });
        }
        gsap.set("[data-flourish-gem]", { scale: 0, transformOrigin: "center", autoAlpha: 0 });
      }

      const playHeroIntro = () => {
        if (reduce) return;

        const tl = gsap.timeline({ delay: 0.05 });

        // Flourish draws itself
        if (line) {
          tl.to(line, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0);
        }

        tl.to("[data-flourish-gem]", { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(3)" }, 0.75)
          .to("[data-hero-animate]", { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, 0.15)
          .to("[data-hero-name-left]", { x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" }, 0.35)
          .to("[data-hero-name-right]", { x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" }, 0.35)
          .to("[data-hero-amp]", { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(2.2)" }, 0.7)
          // Divider grows outward from its diamond
          .to("[data-hero-divider] i", { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(3)" }, 0.9)
          .to(
            "[data-hero-divider] span:first-child",
            { scaleX: 1, autoAlpha: 1, duration: 0.6, ease: "power2.out" },
            0.95,
          )
          .to(
            "[data-hero-divider] span:last-child",
            { scaleX: 1, autoAlpha: 1, duration: 0.6, ease: "power2.out" },
            0.95,
          );

        // Ignore gestures while the intro is playing so a swap can't collide
        // with the entrance animation.
        animating = true;
        tl.eventCallback("onComplete", () => {
          animating = false;
        });

        return tl;
      };

      if (document.querySelector("[data-envelope-scene]")) {
        window.addEventListener("envelope:opened", playHeroIntro, { once: true });
      } else {
        playHeroIntro();
      }

      if (reduce) return; // no further motion for reduced-motion users

      /* ------------------------------------------------------------------ */
      /* Idle life: florals breathe                                          */
      /* ------------------------------------------------------------------ */
      gsap.to("[data-parallax='fast']", { x: 10, y: -9, duration: 7, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to("[data-parallax='soft']", { y: 10, duration: 8, yoyo: true, repeat: -1, ease: "sine.inOut" });

      /* ------------------------------------------------------------------ */
      /* Parallax while scrolling away from the hero                         */
      /* ------------------------------------------------------------------ */
      const parallax = (selector: string, amount: number) =>
        gsap.to(selector, {
          yPercent: amount,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });

      parallax("[data-parallax='fast']", -12);
      parallax("[data-parallax='soft']", -6);

      /* ------------------------------------------------------------------ */
      /* Section 2 entrance                                                  */
      /* ------------------------------------------------------------------ */
      gsap.from("[data-info-animate]", {
        y: 44,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: { trigger: info, start: "top 65%" },
      });

      /* ------------------------------------------------------------------ */
      /* Section 3 entrance: schedule                                        */
      /* ------------------------------------------------------------------ */
      const schedule = document.querySelector<HTMLElement>("#cronograma");
      const timelineEl = document.querySelector<HTMLElement>(".timeline");

      if (schedule && timelineEl) {
        // Heading group
        gsap.from("[data-schedule-animate]", {
          y: 36,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: schedule, start: "top 62%" },
        });

        // Golden spine draws itself as you scroll through the list
        gsap.fromTo(
          "[data-timeline-line]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top center",
            scrollTrigger: { trigger: timelineEl, start: "top 80%", end: "bottom 45%", scrub: true },
          },
        );

        // Nodes pop in sequence
        gsap.from("[data-event-node]", {
          scale: 0,
          transformOrigin: "center",
          duration: 0.55,
          ease: "back.out(2.4)",
          stagger: 0.18,
          scrollTrigger: { trigger: timelineEl, start: "top 66%" },
        });

        // Cards slide toward the spine from their own side
        gsap.from(".event:nth-child(odd) [data-event-card]", {
          x: -46,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: timelineEl, start: "top 58%" },
        });

        gsap.from(".event:nth-child(even) [data-event-card]", {
          x: 46,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power3.out",
          delay: 0.15,
          scrollTrigger: { trigger: timelineEl, start: "top 58%" },
        });

        // Location block (address text, map, CTA)
        const location = document.querySelector<HTMLElement>(".location");
        if (location) {
          gsap.from("[data-location-animate]", {
            y: 34,
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: location, start: "top 82%" },
          });
        }
      }

      /* ------------------------------------------------------------------ */
      /* Section 4 entrance: RSVP                                            */
      /* ------------------------------------------------------------------ */
      const rsvp = document.querySelector<HTMLElement>("#confirmar");
      if (rsvp) {
        gsap.from("[data-rsvp-animate]", {
          y: 38,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.13,
          scrollTrigger: { trigger: rsvp, start: "top 62%" },
        });
      }

      /* ------------------------------------------------------------------ */
      /* Hero story panels                                                   */
      /*                                                                      */
      /* The hero holds three overlapping panels (names / verse 1 / verse 2). */
      /* Each scroll step inside the hero dissolves the current text into     */
      /* particles drifting sideways and assembles the next one the same way. */
      /* After the last verse, the next gesture continues to the date section.*/
      /* ------------------------------------------------------------------ */
      const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-hero-panel]"));

      /** Split [data-chunk="chars"] text into per-character spans (once). */
      const chunkify = (panel: HTMLElement) => {
        panel.querySelectorAll<HTMLElement>('[data-chunk="chars"]').forEach((el) => {
          if (el.dataset.chunked) return;
          el.dataset.chunked = "true";

          const walk = (node: Node) => {
            Array.from(node.childNodes).forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();
                (child.textContent ?? "").split(/(\s+)/).forEach((piece) => {
                  if (!piece) return;
                  if (/^\s+$/.test(piece)) {
                    frag.append(document.createTextNode(" "));
                    return;
                  }
                  const word = document.createElement("span");
                  word.style.display = "inline-block";
                  word.style.whiteSpace = "nowrap";
                  Array.from(piece).forEach((char) => {
                    const span = document.createElement("span");
                    span.dataset.chunk = "char";
                    span.style.display = "inline-block";
                    span.textContent = char;
                    word.append(span);
                  });
                  frag.append(word);
                });
                child.replaceWith(frag);
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const el2 = child as HTMLElement;
                if (!el2.dataset.chunk) walk(child); // keep whole-element chunks intact
              }
            });
          };
          walk(el);
        });
      };

      /** Every scatterable unit of a panel: element chunks + char chunks. */
      const chunksOf = (panel: HTMLElement): HTMLElement[] =>
        Array.from(panel.querySelectorAll<HTMLElement>("[data-chunk]")).filter(
          (el) => el.dataset.chunk !== "chars",
        );

      const rand = (min: number, max: number) => min + Math.random() * (max - min);

      let heroStep = 0;

      /** Show panel i instantly with its chunks at rest. */
      const showHeroPanelInstantly = (index: number) => {
        panels.forEach((panel, k) => {
          gsap.set(panel, { autoAlpha: k === index ? 1 : 0 });
          if (k === index) gsap.set(chunksOf(panel), { x: 0, y: 0, rotation: 0 });
        });
        heroStep = index;
      };

      /** Particle-style swap: current text scatters right/left, next assembles. */
      const swapHeroPanel = (fromIndex: number, toIndex: number, dir: 1 | -1) => {
        const from = panels[fromIndex];
        const to = panels[toIndex];
        if (!from || !to) return;

        const outX = dir === 1 ? rand(160, 480) : -rand(160, 480);
        const inX = dir === 1 ? -rand(160, 480) : rand(160, 480);

        animating = true;
        const tl = gsap.timeline({
          onComplete: () => {
            animating = false;
            // Long enough that the incoming phrase is actually READ before
            // the next gesture is accepted (no skipping through the story).
            cooldownUntil = Date.now() + 750;
          },
        });

        tl.to(chunksOf(from), {
          x: () => outX * rand(0.5, 1),
          y: () => rand(-56, 56),
          rotation: () => rand(-35, 35),
          autoAlpha: 0,
          duration: 0.7,
          ease: "power2.in",
          stagger: { each: 0.004, from: "random" },
        })
          .set(to, { autoAlpha: 1 })
          .fromTo(
            chunksOf(to),
            {
              x: () => inX * rand(0.5, 1),
              y: () => rand(-56, 56),
              rotation: () => rand(-30, 30),
              autoAlpha: 0,
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              autoAlpha: 1,
              duration: 0.8,
              ease: "power3.out",
              stagger: { each: 0.004, from: "random" },
            },
            "<+=0.12",
          );
      };

      /* ------------------------------------------------------------------ */
      /* Section navigation                                                  */
      /*                                                                      */
      /* One gesture = one step. Inside the hero that means the next story    */
      /* panel (names -> verse -> verse); after the last verse it glides to   */
      /* the date section. From section 3 onward scrolling is fully native.   */
      /* Coming back up lands on the last verse and rewinds the story.       */
      /* ------------------------------------------------------------------ */
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
      if (sections.length === 0) return;

      /** Last SECTION index reachable through gesture snapping. */
      const NAV_LIMIT = 1;
      const OVERSIZE_MARGIN = 8;
      let animating = false;
      let cooldownUntil = 0;

      // Prepare the story once motion is allowed.
      if (panels.length > 1) {
        panels.forEach(chunkify);
        panels.forEach((panel, i) => {
          if (i > 0) gsap.set(panel, { autoAlpha: 0 });
        });
      }

      /** Section whose vertical span currently contains the viewport top. */
      const currentIndex = () => {
        const y = window.scrollY + 1;
        let index = 0;
        sections.forEach((section, i) => {
          if (section.offsetTop <= y) index = i;
        });
        return index;
      };

      const isTall = (section: HTMLElement) =>
        section.offsetHeight > window.innerHeight + OVERSIZE_MARGIN;

      /** True when scrolling further in `dir` must leave the current section. */
      const atLeadingEdge = (dir: 1 | -1) => {
        const section = sections[currentIndex()];
        if (!isTall(section)) return true;
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight - window.innerHeight;
        return dir === 1 ? window.scrollY >= bottom - 2 : window.scrollY <= top + 2;
      };

      const busy = () => animating || Date.now() < cooldownUntil;

      const navigate = (dir: 1 | -1, onDone?: () => void) => {
        const current = currentIndex();
        const target = current + dir;
        if (target === current || target < 0 || target > NAV_LIMIT) return false;

        animating = true;
        gsap.to(window, {
          scrollTo: { y: sections[target], autoKill: false },
          duration: 0.95,
          ease: "power2.inOut",
          onComplete: () => {
            animating = false;
            cooldownUntil = Date.now() + 350; // swallow gesture momentum
            onDone?.();
          },
        });
        return true;
      };

      /** Shared decision for wheel / touch / keyboard. Returns true if handled. */
      const onGesture = (dir: 1 | -1): boolean => {
        if (busy()) return true; // handled: keep native input suppressed
        if (currentIndex() > NAV_LIMIT) return false; // native beyond section 2

        // Inside the hero: walk through the story panels first.
        if (currentIndex() === 0 && panels.length > 1) {
          if (dir === 1) {
            if (heroStep < panels.length - 1) {
              swapHeroPanel(heroStep, heroStep + 1, 1);
              heroStep++;
              return true;
            }
            return navigate(1); // story finished -> date section
          }
          if (heroStep > 0) {
            swapHeroPanel(heroStep, heroStep - 1, -1);
            heroStep--;
            return true;
          }
          return false; // already at the very beginning
        }

        // Returning to the hero from the date section: land on the last verse.
        if (currentIndex() === 1 && dir === -1 && panels.length > 1) {
          return navigate(-1, () => showHeroPanelInstantly(panels.length - 1));
        }

        if (!atLeadingEdge(dir)) return false; // free native scroll inside tall section
        return navigate(dir);
      };

      // Wheel: decide per tick; suppress only when we act or are animating.
      window.addEventListener(
        "wheel",
        (event) => {
          const dir: 1 | -1 = event.deltaY > 0 ? 1 : -1;
          if (onGesture(dir)) event.preventDefault();
        },
        { passive: false },
      );

      // Touch: the FIRST move decides. Mobile browsers ignore late
      // preventDefault calls (once native panning has started they commit to
      // the scroll), so ownership of the gesture is claimed as early as
      // possible inside the gesture-driven zone — otherwise native scroll
      // would run alongside the panel swaps.
      let touchStartY = 0;
      let touchActive = false;
      let touchOwnedByUs = false;

      window.addEventListener(
        "touchstart",
        (event) => {
          touchStartY = event.touches[0].clientY;
          touchActive = true;
          touchOwnedByUs = false;
        },
        { passive: true },
      );

      window.addEventListener(
        "touchend",
        () => {
          touchActive = false;
        },
        { passive: true },
      );

      window.addEventListener(
        "touchmove",
        (event) => {
          if (!touchActive) return;
          if (touchOwnedByUs) {
            event.preventDefault(); // we own this gesture already
            return;
          }

          const delta = touchStartY - event.touches[0].clientY;
          if (Math.abs(delta) < 8) return; // tiny drift: not an intent yet

          const dir: 1 | -1 = delta > 0 ? 1 : -1;
          touchOwnedByUs = onGesture(dir);
          if (touchOwnedByUs) event.preventDefault();
          // else: gesture belongs to native scrolling (tall sections / no-op)
        },
        { passive: false },
      );

      // Keyboard mirrors the same rules.
      window.addEventListener("keydown", (event) => {
        let dir: 1 | -1 | 0 = 0;
        if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") dir = 1;
        else if (event.key === "ArrowUp" || event.key === "PageUp") dir = -1;
        if (dir === 0) return;

        if (onGesture(dir)) event.preventDefault();
      });
    },
  );
}

