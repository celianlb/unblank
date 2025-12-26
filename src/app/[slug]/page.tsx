'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import FolderCard from '@/components/FolderCard';
import { useGroupBySlug, useGroupFolders } from '@/domain/folders/hooks/useFolders';
import { formatLastUpdate } from '@/utils/formatters';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const slug = params.slug as string;

  // ✅ Utilisation de React Query
  const { data: group, isLoading: loadingGroup } = useGroupBySlug(session?.user?.id, slug);
  const { data: folders = [], isLoading: loadingFolders } = useGroupFolders(session?.user?.id, group?.id);

  const loadingData = loadingGroup || loadingFolders;

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header />
        <main className="w-full px-[64px] py-[40px] flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb groupName={group?.name} isLoading={loadingGroup} />

        {/* Section Dossiers */}
        {!group && !loadingGroup ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Groupe introuvable</p>
          </div>
        ) : loadingFolders ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Chargement des dossiers...</p>
          </div>
        ) : folders.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Dossiers ({folders.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  id={folder.id}
                  title={folder.name}
                  slug={folder.slug}
                  itemCount={folder.link_count || 0}
                  lastUpdate={formatLastUpdate(folder.updated_at)}
                  groupSlug={slug}
                  isSystem={folder.is_system}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Aucun dossier dans ce groupe</p>
          </div>
        )}
      </main>
    </div>
  );
}
