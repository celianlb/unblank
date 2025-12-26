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
   * Récupère un dossier par son slug (nom normalisé)
   */
  async getFolderBySlug(userId: string, slug: string): Promise<Folder | null> {
    return this.folderRepository.getFolderBySlug(userId, slug);
  }

  /**
   * Récupère un groupe par son slug
   */
  async getGroupBySlug(userId: string, slug: string): Promise<Folder | null> {
    return this.folderRepository.getGroupBySlug(userId, slug);
  }

  /**
   * Récupère tous les dossiers d'un utilisateur (non-groupes)
   */
  async getUserFolders(userId: string): Promise<Folder[]> {
    return this.folderRepository.getUserFolders(userId);
  }

  /**
   * Récupère tous les groupes de dossiers d'un utilisateur
   */
  async getUserGroups(userId: string): Promise<Folder[]> {
    return this.folderRepository.getUserGroups(userId);
  }

  /**
   * Récupère les dossiers d'un groupe spécifique
   */
  async getGroupFolders(userId: string, groupId: string): Promise<Folder[]> {
    return this.folderRepository.getGroupFolders(userId, groupId);
  }

  /**
   * Crée un nouveau dossier
   * Contient la logique métier de validation si nécessaire
   */
  async createFolder(userId: string, name: string, parentFolderId?: string | null, isGroup?: boolean): Promise<Folder | null> {
    // Validation métier: le nom ne peut pas être vide
    if (!name || name.trim().length === 0) {
      console.error('Folder name cannot be empty');
      return null;
    }

    return this.folderRepository.createFolder(userId, name, parentFolderId, isGroup);
  }

  /**
   * Déplace un dossier dans un groupe
   */
  async moveFolderToGroup(folderId: string, groupId: string | null): Promise<boolean> {
    return this.folderRepository.moveFolderToGroup(folderId, groupId);
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
}
