"use client";

import { useState } from "react";
import { useLenis } from "lenis/react";
import styles from "./ScrollToTop.module.scss";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const lenis = useLenis((instance) => {
    setVisible(instance.scroll > 480);
  });

  function handleClick() {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.15 });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      className={[styles.btn, visible ? styles.visible : ""].join(" ")}
      onClick={handleClick}
      aria-label="Scroll to top"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        aria-hidden
      >
        <path
          d="M12 5v14M5 12l7-7 7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
