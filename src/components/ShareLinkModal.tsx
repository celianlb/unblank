'use client';

import { X, Copy } from 'lucide-react';
import { useState } from 'react';
import { useCreatePublicShare, useInviteByEmail } from '@/hooks/useShares';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
}

export default function ShareLinkModal({
  isOpen,
  onClose,
  folderId
}: ShareLinkModalProps) {
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);

  const createPublicShare = useCreatePublicShare();
  const inviteByEmailMutation = useInviteByEmail();

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (generatedShareUrl) {
      navigator.clipboard.writeText(generatedShareUrl);
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await createPublicShare.mutateAsync({
        folderId,
        permission: selectedPermission,
      });
      setGeneratedShareUrl(result.shareUrl);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Erreur lors de la génération du lien de partage');
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await inviteByEmailMutation.mutateAsync({
        folderId,
        email: inviteEmail,
        permission: invitePermission,
      });

      // Reset form
      setInviteEmail('');
      setInvitePermission('view');
      alert('Invitation envoyée avec succès !');
    } catch (error) {
      console.error('Error inviting by email:', error);
      alert('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto flex flex-col p-8 gap-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-8 top-8 w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-9 h-9 hover:text-[#FF5070] transition-colors" strokeWidth={2} />
          </button>

          {/* Frame 61 */}
          <div className="flex flex-col items-start gap-6 w-full">
            {/* Title */}
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] w-full"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Partager
            </h2>

            {/* Tabs */}
            <div className="flex flex-row gap-2 w-full border-b-2 border-black">
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 pb-3 text-[18px] font-bold font-[Heebo] transition-colors ${
                  activeTab === 'link'
                    ? 'text-[#0D0D0D] border-b-4 border-[#0D0D0D] -mb-[2px]'
                    : 'text-[#A8A8A8] hover:text-[#0D0D0D]'
                }`}
              >
                Lien de partage
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 pb-3 text-[18px] font-bold font-[Heebo] transition-colors ${
                  activeTab === 'email'
                    ? 'text-[#0D0D0D] border-b-4 border-[#0D0D0D] -mb-[2px]'
                    : 'text-[#A8A8A8] hover:text-[#0D0D0D]'
                }`}
              >
                Inviter par email
              </button>
            </div>

            {/* Tab Content - Link */}
            {activeTab === 'link' && (
              <div className="flex flex-col items-start gap-4 w-full">
                <p className="text-[16px] text-[#A8A8A8] font-[Heebo]">
                  Créez un lien que vous pouvez partager avec n&apos;importe qui
                </p>

                {/* Radio Buttons */}
                <div className="flex flex-col items-start gap-2 w-full">
                  {/* Lecture seule */}
                  <div className="flex flex-row items-center gap-2 w-full">
                    <div
                      onClick={() => setSelectedPermission('view')}
                      className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                    >
                      <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                        {selectedPermission === 'view' && (
                          <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                        )}
                      </div>
                    </div>
                    <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                      Lecture seule
                    </span>
                  </div>

                  {/* Lecture et édition */}
                  <div className="flex flex-row items-center gap-2 w-full">
                    <div
                      onClick={() => setSelectedPermission('edit')}
                      className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                    >
                      <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                        {selectedPermission === 'edit' && (
                          <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                        )}
                      </div>
                    </div>
                    <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                      Lecture et édition
                    </span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  className="w-full h-[46px] bg-[#0D0D0D] hover:bg-[#2D2D2D] border-2 border-black rounded-xl text-white text-[18px] font-bold font-[Heebo] transition-colors"
                >
                  Générer un lien
                </button>

                {/* Share Link Display (shown if URL exists) */}
                {generatedShareUrl && (
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-[14px] font-medium text-[#0D0D0D] font-[Heebo]">
                      Lien généré
                    </span>
                    <div className="flex flex-row items-center justify-center px-2.5 gap-2.5 w-full h-[46px] bg-[#FEF8EE] border-2 border-black rounded-xl">
                      <span className="flex-1 text-[16px] leading-[24px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] truncate">
                        {generatedShareUrl}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
                      >
                        <Copy className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {createPublicShare.isPending && (
                  <p className="text-[14px] text-[#A8A8A8] font-[Heebo]">
                    Génération du lien en cours...
                  </p>
                )}
              </div>
            )}

            {/* Tab Content - Email */}
            {activeTab === 'email' && (
              <div className="flex flex-col items-start gap-4 w-full">
                <p className="text-[16px] text-[#A8A8A8] font-[Heebo]">
                  Invitez une personne spécifique par son adresse email
                </p>

                {/* Email Input */}
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-[14px] font-medium text-[#0D0D0D] font-[Heebo]">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    placeholder="exemple@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-[44px] px-3 bg-white border-2 border-black rounded-xl text-base leading-[23px] tracking-[-0.03em] font-normal text-[#0D0D0D] placeholder-[#A8A8A8] focus:outline-none focus:border-[#FF5070] transition-colors font-[Heebo]"
                  />
                </div>

                {/* Permission Selection for Email Invite */}
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-[14px] font-medium text-[#0D0D0D] font-[Heebo]">
                    Niveau d&apos;accès
                  </label>
                  <div className="flex flex-col items-start gap-2 w-full">
                    {/* Lecture seule */}
                    <div className="flex flex-row items-center gap-2 w-full">
                      <div
                        onClick={() => setInvitePermission('view')}
                        className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                      >
                        <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                          {invitePermission === 'view' && (
                            <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                          )}
                        </div>
                      </div>
                      <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                        Lecture seule
                      </span>
                    </div>

                    {/* Lecture et édition */}
                    <div className="flex flex-row items-center gap-2 w-full">
                      <div
                        onClick={() => setInvitePermission('edit')}
                        className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                      >
                        <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                          {invitePermission === 'edit' && (
                            <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                          )}
                        </div>
                      </div>
                      <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                        Lecture et édition
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invite Button */}
                <button
                  onClick={handleInviteByEmail}
                  disabled={!inviteEmail.trim() || inviteByEmailMutation.isPending}
                  className="w-full h-[46px] bg-[#0D0D0D] hover:bg-[#2D2D2D] disabled:bg-[#A8A8A8] disabled:cursor-not-allowed border-2 border-black rounded-xl text-white text-[18px] font-bold font-[Heebo] transition-colors"
                >
                  {inviteByEmailMutation.isPending ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
