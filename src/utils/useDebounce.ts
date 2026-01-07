import { useState, useEffect } from 'react';

/**
 * Hook pour débouncer une valeur
 * Retarde la mise à jour de la valeur jusqu'à ce que l'utilisateur arrête de la modifier
 *
 * @param value - Valeur à débouncer
 * @param delay - Délai en millisecondes (défaut: 300ms)
 * @returns Valeur débouncée
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * // debouncedQuery sera mis à jour 300ms après que l'utilisateur arrête de taper
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
