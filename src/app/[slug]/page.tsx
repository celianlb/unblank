'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import FolderCard from '@/components/FolderCard';
import { useGroupBySlug, useGroupFolders } from '@/hooks/useFolders';
import { formatLastUpdate } from '@/utils/formatters';
import { useFolderShares } from '@/hooks/useShares';

// Helper component to render FolderCard with permission checking for each folder
function GroupFolderCard({ folder, groupSlug, currentUserEmail, isGroupShared, groupId }: { folder: any; groupSlug: string; currentUserEmail: string | undefined; isGroupShared: boolean; groupId: string | undefined }) {
  const { data: shares = [], isLoading: isLoadingShares } = useFolderShares(folder.id);

  const currentUserShare = shares.find((share: any) =>
    share.user?.email === currentUserEmail
  );

  // Logique de permission pour chaque dossier individuel
  const canDelete = !isLoadingShares && (shares.length === 0 || currentUserShare?.permission === 'edit' || currentUserShare?.permission === 'owner');

  return (
    <FolderCard
      id={folder.id}
      title={folder.name}
      slug={folder.slug}
      itemCount={folder.link_count || 0}
      lastUpdate={formatLastUpdate(folder.updated_at)}
      groupSlug={groupSlug}
      isSystem={folder.is_system}
      previewImages={folder.preview_images}
      canDelete={canDelete}
      isShared={isGroupShared}
      sharedGroupId={isGroupShared ? groupId : undefined}
    />
  );
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const slug = params.slug as string;

  // ✅ Utilisation de React Query
  const { data: group, isLoading: loadingGroup } = useGroupBySlug(session?.user?.id, slug);
  const { data: folders = [], isLoading: loadingFolders } = useGroupFolders(session?.user?.id, group?.id);

  // Récupérer les permissions du groupe actuel
  const { data: groupShares = [], isLoading: isLoadingGroupShares } = useFolderShares(group?.id || null);

  // Vérifier si l'utilisateur a la permission d'éditer dans le groupe (pour supprimer des dossiers)
  const currentUserGroupShare = groupShares.find((share: any) =>
    share.user?.email === session?.user?.email
  );

  // Logique de permission :
  // - Si pas de groupe (group?.id null/undefined) : peut éditer
  // - Si groupe existe mais les shares sont en cours de chargement : on attend
  // - Si groupe existe mais pas de partages : l'utilisateur est propriétaire, peut éditer
  // - Si groupe partagé : vérifier la permission (edit ou owner)
  const canCreateFolder = !group?.id || (!isLoadingGroupShares && (groupShares.length === 0 || currentUserGroupShare?.permission === 'edit' || currentUserGroupShare?.permission === 'owner'));

  // Vérifier si le groupe est partagé (l'utilisateur n'est pas le propriétaire)
  const isGroupShared = !isLoadingGroupShares && groupShares.length > 0 && currentUserGroupShare?.permission !== 'owner';

  const loadingData = loadingGroup || loadingFolders;

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header currentGroupId={group?.id} isInGroup={true} isLoading={true} />
        <main className="w-full px-[64px] py-[40px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header currentGroupId={group?.id} isInGroup={true} isLoading={loadingData} />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb groupName={group?.name} isLoading={loadingGroup} />

        {/* Section Dossiers */}
        {!group && !loadingGroup ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Groupe introuvable</p>
          </div>
        ) : loadingFolders ? null : folders.length > 0 ? (
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
                <GroupFolderCard
                  key={folder.id}
                  folder={folder}
                  groupSlug={slug}
                  currentUserEmail={session?.user?.email}
                  isGroupShared={isGroupShared}
                  groupId={group?.id}
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
