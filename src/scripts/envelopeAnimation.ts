/**
 * Envelope opening choreography (GSAP).
 *
 * Flow: tap the wax seal -> flap swings open -> card slides out of the
 * pocket -> the letter expands gently toward the viewer while the physical
 * envelope dissolves (backdrop still opaque), then the whole overlay clears
 * handing off mid-fade so the hero intro picks up seamlessly.
 *
 * Broadcasts "envelope:opened" so other modules can react (hero intro).
 */
import gsap from "gsap";

/** Slide-up distance once the card leaves the pocket (% of card height). */
const SLIDE_UP_PERCENT = -82;

/** Query helper for data-attribute hooks. */
const hook = (name: string, scope: ParentNode = document) =>
  scope.querySelector<HTMLElement>(`[data-${name}]`);

export function initEnvelope(): void {
  const scene = hook("envelope-scene");
  const wrap = hook("envelope-wrap");
  const seal = hook("seal");
  const flap = hook("flap");
  const card = hook("card");
  const hint = hook("hint");
  const back = hook("back");
  const pocket = hook("pocket");
  const glow = hook("glow");

  if (!scene || !wrap || !seal || !flap || !card || !hint || !back || !pocket || !glow) {
    return;
  }

  let opened = false;

  /** The page cannot scroll while the envelope overlay is up. */
  const lockScroll = () => {
    document.body.style.overflow = "hidden";
  };

  /** Hand control to the page: restore scrolling and announce the reveal. */
  const releasePage = () => {
    document.body.style.overflow = "";
    window.dispatchEvent(new CustomEvent("envelope:opened"));
  };

  /** Fully retire the overlay once it is invisible. */
  const hideScene = () => {
    scene.classList.add("is-open");
    gsap.set(scene, { visibility: "hidden" });
  };

  /** Reduced-motion path: jump straight to the final composition. */
  const openInstantly = () => {
    gsap.set(seal, { autoAlpha: 0 });
    gsap.set(hint, { autoAlpha: 0 });
    gsap.set(flap, { rotationX: 180 });
    gsap.set([back, pocket, glow, card], { autoAlpha: 0 });
    hideScene();
    releasePage();
  };

  /** Full choreography as a single sequenced timeline. */
  const playOpen = () => {
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: hideScene,
    });

    tl.addLabel("tap")
      // Seal reaction: quick press, then melt away
      .to(seal, { scale: 0.9, duration: 0.12, ease: "power1.in" }, "tap")
      .to(hint, { autoAlpha: 0, duration: 0.3 }, "tap")
      .to(seal, { autoAlpha: 0, scale: 1.5, duration: 0.4 }, "tap+=0.12")
      // Flap swings open around its top edge...
      .add(() => gsap.set(flap, { zIndex: 5 }), "tap+=0.62") // ...slipping behind the card past 90deg
      .to(flap, { rotationX: 180, duration: 0.95 }, "tap+=0.3")
      // Card rises out of the pocket
      .to(
        card,
        { yPercent: SLIDE_UP_PERCENT, duration: 0.9, ease: "power3.inOut" },
        ">-0.25",
      )
      .addLabel("reveal", ">-0.05")
      // The letter gently expands toward the viewer...
      .to(
        card,
        {
          yPercent: SLIDE_UP_PERCENT - 6,
          scale: 1.06,
          duration: 0.9,
          ease: "power2.out",
        },
        "reveal",
      )
      // ...the envelope dissolves completely while the backdrop is still
      // opaque, so nothing ever floats over the page beneath...
      .to([back, pocket, flap, glow], { autoAlpha: 0, duration: 0.55 }, "reveal+=0.05")
      .to(card, { autoAlpha: 0, duration: 0.45, ease: "power1.in" }, "reveal+=0.35")
      // ...and only then the overlay itself clears, handing off mid-fade so
      // the hero intro picks up seamlessly.
      .add(releasePage, "reveal+=1.0")
      .to(scene, { autoAlpha: 0, duration: 0.7, ease: "power1.inOut" }, "reveal+=0.75");

    return tl;
  };

  // Responsive + reduced-motion handling.
  const mm = gsap.matchMedia();
  let reduceMotion = false;

  mm.add(
    {
      reduce: "(prefers-reduced-motion: reduce)",
      full: "(prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      reduceMotion = Boolean(ctx.conditions?.reduce);

      if (!reduceMotion) {
        lockScroll();

        // Gentle entrance for the sealed envelope
        gsap.from(wrap, {
          y: 28,
          autoAlpha: 0,
          duration: 1,
          ease: "power2.out",
          delay: 0.15,
        });
      }
    },
  );

  seal.addEventListener("click", () => {
    if (opened) return;
    opened = true;
    seal.disabled = true;
    if (reduceMotion) openInstantly();
    else playOpen();
  });
}

