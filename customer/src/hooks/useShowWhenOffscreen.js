import { useEffect, useState } from 'react';

/** True only after the named button has left the screen, so a sticky copy does not sit on top of it. */
export default function useShowWhenOffscreen(id) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let observer;
    const watch = (el) => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => setShow(!entry.isIntersecting),
        { threshold: 0.4 },
      );
      observer.observe(el);
    };
    const existing = document.getElementById(id);
    let mutations;
    if (existing) watch(existing);
    else {
      mutations = new MutationObserver(() => {
        const el = document.getElementById(id);
        if (!el) return;
        watch(el);
        mutations.disconnect();
      });
      mutations.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [id]);

  return show;
}
