/**
 * Date and file size formatting utilities
 */

/**
 * Formats a date string to French locale format (DD/MM/YYYY)
 */
export function formatDateAdded(createdAt: string): string {
  const date = new Date(createdAt);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats file size in bytes to human-readable format (KB/MB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A';

  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${kb.toFixed(1)} KB`;
}

/**
 * Formats the last update date relative to now or as absolute date
 */
export function formatLastUpdate(updatedAt: string): string {
  const date = new Date(updatedAt);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Aujourd'hui";
  } else if (diffInDays === 1) {
    return 'Hier';
  } else if (diffInDays < 7) {
    return `Il y a ${diffInDays} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
