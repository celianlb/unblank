'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import DetailedLinkCard from '@/components/DetailedLinkCard';
import ImageCard from '@/components/ImageCard';
import { LinkService, type Link } from '@/domain/links/services/LinkService';
import { FolderService, type Folder } from '@/domain/folders/services/FolderService';
import { supabase } from '@/infra/db/supabase';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const folderId = params.folderId as string;
  const [selectedCount, setSelectedCount] = useState(0);
  const [links, setLinks] = useState<Link[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user?.id && folderId) {
      loadFolderData();
    }
  }, [session?.user?.id, folderId]);

  const loadFolderData = async () => {
    if (!session?.user?.id) return;

    setLoadingData(true);
    try {
      // Chercher le dossier par son slug
      const folderData = await FolderService.getFolderBySlug(session.user.id, folderId);

      if (!folderData) {
        setFolder(null);
        setLoadingData(false);
        return;
      }

      setFolder(folderData);

      // Récupérer les liens du dossier
      const linksData = await LinkService.getFolderLinks(folderData.id);
      setLinks(linksData);
    } catch (error) {
      console.error('Error loading folder data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCheckChange = (checked: boolean) => {
    setSelectedCount(prev => checked ? prev + 1 : prev - 1);
  };

  const isSelectionMode = selectedCount > 0;

  const handleDeleteSelected = () => {
    // TODO: Implement delete logic
    console.log('Deleting', selectedCount, 'items');
    setSelectedCount(0);
  };

  // Séparer les liens en images et liens classiques
  const imageLinks = links.filter(link => LinkService.getContentType(link) === 'image');
  const regularLinks = links.filter(link => LinkService.getContentType(link) === 'link');

  if (loading || loadingData) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />
        <main className="w-full px-[64px] py-[40px] flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </main>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />
        <main className="w-full px-[64px] py-[40px] flex items-center justify-center">
          <p className="text-gray-500">Dossier introuvable</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb folderName={folder.name} />

        {/* Section Images */}
        {imageLinks.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Images ({imageLinks.length})
            </h1>

            {/* Contenu des cartes images */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {imageLinks.map((link) => (
                <ImageCard
                  key={link.id}
                  imageUrl={link.original_image_url || link.screenshot_url || ''}
                  link={link.url}
                  fileType={link.image_format?.toUpperCase() || 'IMG'}
                  dimensions="N/A"
                  fileSize="N/A"
                  dateAdded={LinkService.formatDateAdded(link.created_at)}
                  folder={folder.name}
                  tags={link.tags?.map(t => t.name) || []}
                  isSelectionMode={isSelectionMode}
                  onCheckChange={handleCheckChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section Liens */}
        {regularLinks.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Liens ({regularLinks.length})
            </h1>

            {/* Contenu des cartes liens */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {regularLinks.map((link) => {
                // Extraire le nom du site depuis l'URL
                const url = new URL(link.url);
                const siteName = link.title || url.hostname.replace('www.', '');
                const siteUrl = url.hostname;

                return (
                  <DetailedLinkCard
                    key={link.id}
                    siteName={siteName}
                    siteUrl={siteUrl}
                    description={link.description || ''}
                    link={link.url}
                    tags={link.tags?.map(t => t.name) || []}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Message si aucun lien */}
        {links.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Aucun lien dans ce dossier</p>
          </div>
        )}
      </main>
    </div>
  );
}
