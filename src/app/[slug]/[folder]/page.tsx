'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import DetailedLinkCard from '@/components/DetailedLinkCard';
import ImageCard from '@/components/ImageCard';
import { getContentType } from '@/utils/linkUtils';
import { useFolderBySlug, useGroupBySlug } from '@/hooks/useFolders';
import { useFolderLinks } from '@/hooks/useLinks';
import { formatDateAdded } from '@/utils/formatters';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const groupSlug = params.slug as string;
  const folderSlug = params.folder as string;
  const [selectedCount, setSelectedCount] = useState(0);

  // ✅ Utilisation de React Query
  const { data: group } = useGroupBySlug(session?.user?.id, groupSlug);
  const { data: folder, isLoading: loadingFolder } = useFolderBySlug(session?.user?.id, folderSlug);
  const { data: links = [], isLoading: loadingLinks } = useFolderLinks(folder?.id);

  const loadingData = loadingFolder || loadingLinks;

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

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
  const imageLinks = links.filter(link => getContentType(link) === 'image');
  const regularLinks = links.filter(link => getContentType(link) === 'link');

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />
        <main className="w-full px-[64px] py-[40px] flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          groupName={group?.name}
          folderName={folder?.name}
          groupSlug={groupSlug}
          isLoading={loadingData}
        />

        {!folder && !loadingData && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Dossier introuvable</p>
          </div>
        )}

        {loadingData && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Chargement...</p>
          </div>
        )}

        {folder && !loadingData && (
          <>

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
                  dateAdded={formatDateAdded(link.created_at)}
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
        </>
        )}
      </main>
    </div>
  );
}
