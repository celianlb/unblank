"use client";

import { useState, useEffect, useCallback } from "react";

interface UseScrollHideOptions {
  threshold?: number; // Distance minimale avant de réagir au scroll
  hideOnScrollDown?: boolean; // Cacher au scroll vers le bas
}

/**
 * Hook pour cacher/afficher un élément basé sur la direction du scroll
 * @param options - Options de configuration
 * @returns isVisible - true si l'élément doit être visible
 */
export function useScrollHide(options: UseScrollHideOptions = {}) {
  const { threshold = 50, hideOnScrollDown = true } = options;

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Ne pas réagir si on est tout en haut
    if (currentScrollY < threshold) {
      setIsVisible(true);
      setLastScrollY(currentScrollY);
      return;
    }

    // Calculer la direction du scroll
    const scrollDiff = currentScrollY - lastScrollY;

    // Scroll vers le bas (positif) → cacher
    // Scroll vers le haut (négatif) → montrer
    if (hideOnScrollDown) {
      if (scrollDiff > 0 && currentScrollY > threshold) {
        // Scroll vers le bas
        setIsVisible(false);
      } else if (scrollDiff < 0) {
        // Scroll vers le haut
        setIsVisible(true);
      }
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY, threshold, hideOnScrollDown]);

  useEffect(() => {
    // Utiliser passive: true pour de meilleures performances
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return isVisible;
}
