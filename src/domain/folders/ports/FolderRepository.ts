import { Folder } from '../models/Folder';

/**
 * Port (interface) pour le repository de dossiers
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface FolderRepository {
  /**
   * Récupère un dossier par son slug (nom normalisé)
   */
  getFolderBySlug(userId: string, slug: string): Promise<Folder | null>;

  /**
   * Récupère un groupe par son slug
   */
  getGroupBySlug(userId: string, slug: string): Promise<Folder | null>;

  /**
   * Récupère tous les dossiers d'un utilisateur (non-groupes)
   */
  getUserFolders(userId: string): Promise<Folder[]>;

  /**
   * Récupère tous les groupes de dossiers d'un utilisateur
   */
  getUserGroups(userId: string): Promise<Folder[]>;

  /**
   * Récupère les dossiers d'un groupe spécifique
   */
  getGroupFolders(userId: string, groupId: string): Promise<Folder[]>;

  /**
   * Crée un nouveau dossier
   */
  createFolder(userId: string, name: string, parentFolderId?: string | null, isGroup?: boolean): Promise<Folder | null>;

  /**
   * Déplace un dossier dans un groupe
   */
  moveFolderToGroup(folderId: string, groupId: string | null): Promise<boolean>;

  /**
   * Renomme un dossier
   */
  renameFolder(folderId: string, newName: string): Promise<Folder | null>;

  /**
   * Supprime un ou plusieurs dossiers
   */
  deleteFolders(folderIds: string[]): Promise<boolean>;

  /**
   * Récupère les informations de propriété d'un dossier (pour vérification de permissions)
   */
  getFolderOwnership(folderId: string): Promise<{ userId: string } | null>;

  /**
   * Récupère les informations de propriété de plusieurs dossiers (pour vérification de permissions)
   */
  getFoldersOwnership(folderIds: string[]): Promise<Array<{ id: string; userId: string }>>;
}
