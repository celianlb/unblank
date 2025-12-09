'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import FolderCard from '@/components/FolderCard';
import { FolderService, type Folder } from '@/domain/folders/services/FolderService';
import { supabase } from '@/infra/db/supabase';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const slug = params.slug as string;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [group, setGroup] = useState<Folder | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user?.id && slug) {
      loadGroupData();
    }
  }, [session?.user?.id, slug]);

  const loadGroupData = async () => {
    if (!session?.user?.id) return;

    setLoadingData(true);
    try {
      // Chercher le groupe par son slug
      const groupData = await FolderService.getGroupBySlug(session.user.id, slug);

      if (!groupData) {
        setGroup(null);
        setLoadingData(false);
        return;
      }

      setGroup(groupData);

      // Récupérer les dossiers du groupe
      const foldersData = await FolderService.getGroupFolders(groupData.id);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header />
        <main className="w-full px-[64px] py-[40px] flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header />
        <main className="w-full px-[64px] py-[40px] flex items-center justify-center">
          <p className="text-gray-500">Groupe introuvable</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb groupName={group.name} />

        {/* Section Dossiers */}
        {folders.length > 0 ? (
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
                  title={folder.name}
                  slug={folder.slug}
                  itemCount={folder.link_count || 0}
                  lastUpdate={FolderService.formatLastUpdate(folder.updated_at)}
                  groupSlug={slug}
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
