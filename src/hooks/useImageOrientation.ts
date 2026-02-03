import { useState, useCallback } from "react";

type ImageOrientation = "portrait" | "landscape" | "square" | "unknown";

interface UseImageOrientationResult {
  orientation: ImageOrientation;
  isLandscape: boolean;
  isLoaded: boolean;
  onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Hook pour détecter l'orientation d'une image au chargement
 * Retourne si l'image est en paysage (largeur > hauteur) pour appliquer une rotation
 */
export function useImageOrientation(): UseImageOrientationResult {
  const [orientation, setOrientation] = useState<ImageOrientation>("unknown");
  const [isLoaded, setIsLoaded] = useState(false);

  const onImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      const { naturalWidth, naturalHeight } = img;

      if (naturalWidth > naturalHeight) {
        setOrientation("landscape");
      } else if (naturalHeight > naturalWidth) {
        setOrientation("portrait");
      } else {
        setOrientation("square");
      }
      setIsLoaded(true);
    },
    []
  );

  return {
    orientation,
    isLandscape: orientation === "landscape",
    isLoaded,
    onImageLoad,
  };
}
