import { FolderRepository } from '../ports/FolderRepository';
import { Folder } from '../models/Folder';

/**
 * Service du domaine pour les opérations métier sur les dossiers
 * Délègue l'accès aux données au repository (inversion de dépendance)
 */
export class FolderService {
  constructor(private readonly folderRepository: FolderRepository) {}

  /**
   * Génère un slug à partir d'un nom de dossier
   * Logique métier pure (pas d'accès à la DB)
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
  }

  /**
   * Récupère un dossier par son ID
   */
  async getFolderById(folderId: string): Promise<Folder | null> {
    return this.folderRepository.getFolderById(folderId);
  }

  /**
   * Récupère un dossier par son slug (nom normalisé)
   */
  async getFolderBySlug(userId: string, slug: string): Promise<Folder | null> {
    return this.folderRepository.getFolderBySlug(userId, slug);
  }

  /**
   * Récupère tous les dossiers top-level d'un utilisateur (sans parent)
   */
  async getUserFolders(userId: string): Promise<Folder[]> {
    return this.folderRepository.getUserFolders(userId);
  }

  /**
   * Récupère les sous-dossiers d'un dossier parent
   */
  async getSubFolders(userId: string, parentFolderId: string): Promise<Folder[]> {
    return this.folderRepository.getSubFolders(userId, parentFolderId);
  }

  /**
   * Crée un nouveau dossier
   * Contient la logique métier de validation si nécessaire
   */
  async createFolder(userId: string, name: string, parentFolderId?: string | null): Promise<Folder | null> {
    // Validation métier: le nom ne peut pas être vide
    if (!name || name.trim().length === 0) {
      console.error('Folder name cannot be empty');
      return null;
    }

    return this.folderRepository.createFolder(userId, name, parentFolderId);
  }

  /**
   * Déplace un dossier vers un autre dossier parent
   */
  async moveFolderToParent(folderId: string, parentFolderId: string | null): Promise<boolean> {
    return this.folderRepository.moveFolderToParent(folderId, parentFolderId);
  }

  /**
   * Renomme un dossier
   */
  async renameFolder(folderId: string, newName: string): Promise<Folder | null> {
    // Validation métier: le nom ne peut pas être vide
    if (!newName || newName.trim().length === 0) {
      console.error('Folder name cannot be empty');
      return null;
    }

    return this.folderRepository.renameFolder(folderId, newName);
  }

  /**
   * Supprime un ou plusieurs dossiers
   */
  async deleteFolders(folderIds: string[]): Promise<boolean> {
    // Validation métier: il faut au moins un ID
    if (!folderIds || folderIds.length === 0) {
      console.error('No folder IDs provided');
      return false;
    }

    return this.folderRepository.deleteFolders(folderIds);
  }

  /**
   * Récupère les IDs des sous-dossiers d'un dossier
   * Utilisé pour gérer les partages lors de la sortie d'un dossier parent
   */
  async getSubFolderIds(userId: string, folderId: string): Promise<string[]> {
    const folders = await this.folderRepository.getSubFolders(userId, folderId);
    return folders.map(f => f.id);
  }

  /**
   * Récupère la chaîne des dossiers ancêtres (du plus éloigné au plus proche)
   */
  async getFolderAncestors(folderId: string): Promise<Folder[]> {
    return this.folderRepository.getFolderAncestors(folderId);
  }
}
