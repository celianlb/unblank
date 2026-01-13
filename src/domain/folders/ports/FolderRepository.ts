import { Folder } from '../models/Folder';

/**
 * Port (interface) pour le repository de dossiers
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface FolderRepository {
  /**
   * Récupère un dossier par son ID
   */
  getFolderById(folderId: string): Promise<Folder | null>;

  /**
   * Récupère un dossier par son slug (nom normalisé)
   */
  getFolderBySlug(userId: string, slug: string): Promise<Folder | null>;

  /**
   * Récupère tous les dossiers top-level d'un utilisateur (sans parent)
   */
  getUserFolders(userId: string): Promise<Folder[]>;

  /**
   * Récupère les sous-dossiers d'un dossier parent
   */
  getSubFolders(userId: string, parentFolderId: string): Promise<Folder[]>;

  /**
   * Crée un nouveau dossier
   */
  createFolder(userId: string, name: string, parentFolderId?: string | null): Promise<Folder | null>;

  /**
   * Déplace un dossier vers un autre dossier parent
   */
  moveFolderToParent(folderId: string, parentFolderId: string | null): Promise<boolean>;

  /**
   * Renomme un dossier
   */
  renameFolder(folderId: string, newName: string): Promise<Folder | null>;

  /**
   * Supprime un ou plusieurs dossiers
   */
  deleteFolders(folderIds: string[]): Promise<boolean>;

  /**
   * Récupère la chaîne des dossiers ancêtres (du plus éloigné au plus proche)
   */
  getFolderAncestors(folderId: string): Promise<Folder[]>;
}
