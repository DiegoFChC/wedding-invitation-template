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
      /* Section navigation                                                  */
      /*                                                                      */
      /* One gesture = one section, ONLY between the first two sections       */
      /* (names <-> date). From section 3 onward scrolling is fully native,   */
      /* so long sections stay freely reachable.                              */
      /* ------------------------------------------------------------------ */
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
      if (sections.length === 0) return;

      /** Last section index reachable through gesture snapping. */
      const NAV_LIMIT = 1;
      const OVERSIZE_MARGIN = 8;
      let animating = false;
      let cooldownUntil = 0;

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

      const navigate = (dir: 1 | -1) => {
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
          },
        });
        return true;
      };

      /** Shared decision for wheel / touch / keyboard. Returns true if handled. */
      const onGesture = (dir: 1 | -1): boolean => {
        if (busy()) return true; // handled: keep native input suppressed
        if (currentIndex() > NAV_LIMIT) return false; // native beyond section 2
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

      // Touch: one decision per gesture, after a small intent threshold.
      let touchStartY = 0;
      let gestureClaimed = false;

      window.addEventListener(
        "touchstart",
        (event) => {
          touchStartY = event.touches[0].clientY;
          gestureClaimed = false;
        },
        { passive: true },
      );

      window.addEventListener(
        "touchmove",
        (event) => {
          if (gestureClaimed) {
            event.preventDefault(); // we own this gesture already
            return;
          }

          const delta = touchStartY - event.touches[0].clientY;
          if (Math.abs(delta) < 24) return; // not enough intent yet

          gestureClaimed = true;
          const dir: 1 | -1 = delta > 0 ? 1 : -1;
          if (onGesture(dir)) event.preventDefault();
          // Otherwise: leave the pan to native scrolling (inside tall sections)
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

