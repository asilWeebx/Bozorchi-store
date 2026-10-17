/** Opt-in vibration on "add to cart", set on the account page. */
export const HAPTICS_KEY = "kb_haptics";
export const HAPTICS_EVENT = "kb-haptics";

/**
 * Purely visual feedback; cart state always updates synchronously first. A
 * small yellow dot arcs from the button into the cart icon, which bounces.
 */
export function cartFeedback(from: HTMLElement | null) {
  try {
    if (localStorage.getItem(HAPTICS_KEY) === "1") navigator.vibrate?.(20);
  } catch {
    // Storage may be disabled; haptics are a nicety.
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")]
    .reverse()
    .find((el) => el.getBoundingClientRect().width > 0);
  if (!target) return;
  target.animate([{ transform: "scale(1)" }, { transform: "scale(1.22) rotate(-6deg)" }, { transform: "scale(1)" }], { duration: 420, delay: 380 });
  if (!from) return;

  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const dot = document.createElement("span");
  Object.assign(dot.style, {
    position: "fixed",
    zIndex: "150",
    top: `${start.top + start.height / 2}px`,
    left: `${start.left + start.width / 2}px`,
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "var(--color-accent)",
    boxShadow: "0 0 0 4px rgb(201 169 127 / 35%)",
    pointerEvents: "none",
  });
  document.body.appendChild(dot);
  const dx = end.left + end.width / 2 - start.left - start.width / 2;
  const dy = end.top + end.height / 2 - start.top - start.height / 2;
  const animation = dot.animate(
    [
      { transform: "translate(-50%, -50%) scale(1.1)", opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 70}px)) scale(1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35)`, opacity: 0.4 },
    ],
    { duration: 600, easing: "cubic-bezier(.3,.6,.3,1)" },
  );
  void animation.finished.then(
    () => dot.remove(),
    () => dot.remove(),
  );
}
