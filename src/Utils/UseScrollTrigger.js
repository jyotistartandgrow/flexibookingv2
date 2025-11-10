import { useEffect } from "react";

const useScrollTrigger = (callback, threshold = 100, isEnabled = true) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      if (scrollPosition > threshold) {
        callback(); // Trigger the callback
        window.removeEventListener("scroll", handleScroll); // Remove listener after triggering
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [callback, threshold, isEnabled]);
};

export default useScrollTrigger;
