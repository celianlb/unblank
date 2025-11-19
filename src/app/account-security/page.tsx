'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { User } from '@/domain/auth/models';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import DeleteAccountModal from '@/components/DeleteAccountModal';

export default function AccountSecurityPage() {
  const router = useRouter();
  const { getCurrentSession, updatePassword, deleteAccount, isLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Show password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true);
      const currentSession = await getCurrentSession();

      if (!currentSession) {
        router.push('/login');
      } else {
        setUser(currentSession.user);
      }
      setLoadingSession(false);
    };

    fetchSession();
  }, [getCurrentSession, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setIsChangingPassword(true);

    try {
      const success = await updatePassword(newPassword);

      if (success) {
        setPasswordSuccess('Mot de passe mis à jour avec succès !');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          setPasswordSuccess('');
        }, 3000);
      } else {
        setPasswordError('Erreur lors de la mise à jour du mot de passe');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setPasswordError('Une erreur est survenue');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      const success = await deleteAccount();
      
      if (success) {
        setShowDeleteModal(false);
      }
      // Si succès, la redirection est gérée par le hook useAuth
      return success;
    } catch (error) {
      console.error('Erreur:', error);
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loadingSession || !user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#FEF8EE] p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="pb-6 sm:pb-8 md:pb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D0D0D]">
            Compte et sécurité
          </h1>
        </div>

        {/* Change Password Section */}
        <div className="bg-white border-2 md:border-3 lg:border-4 border-black rounded-2xl md:rounded-[20px] lg:rounded-[24px] p-4 sm:p-6 md:p-7 lg:p-8 shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] md:shadow-[5px_5px_0px_#000000] lg:shadow-[6px_6px_0px_#000000] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-[#0D0D0D]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D0D0D]">
              Changer le mot de passe
            </h2>
          </div>

          {/* Success Message */}
          {passwordSuccess && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg md:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
              <p className="text-green-700 font-medium text-sm sm:text-base">{passwordSuccess}</p>
            </div>
          )}

          {/* Error Message */}
          {passwordError && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg md:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
              <p className="text-red-700 font-medium text-sm sm:text-base">{passwordError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-base sm:text-lg font-bold text-[#0D0D0D] mb-2 sm:mb-3">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="***********"
                  className="w-full h-12 sm:h-13 md:h-14 px-3 sm:px-4 pr-12 rounded-lg sm:rounded-xl border-2 border-black bg-white text-[#0D0D0D] placeholder-[#636363] focus:outline-none focus:ring-2 focus:ring-[#202AED] text-base sm:text-lg"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#636363] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                  disabled={isChangingPassword}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-base sm:text-lg font-bold text-[#0D0D0D] mb-2 sm:mb-3">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="***********"
                  className="w-full h-12 sm:h-13 md:h-14 px-3 sm:px-4 pr-12 rounded-lg sm:rounded-xl border-2 border-black bg-white text-[#0D0D0D] placeholder-[#636363] focus:outline-none focus:ring-2 focus:ring-[#202AED] text-base sm:text-lg"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#636363] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                  disabled={isChangingPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#636363] mt-2">
                Minimum 8 caractères
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-base sm:text-lg font-bold text-[#0D0D0D] mb-2 sm:mb-3">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="***********"
                  className="w-full h-12 sm:h-13 md:h-14 px-3 sm:px-4 pr-12 rounded-lg sm:rounded-xl border-2 border-black bg-white text-[#0D0D0D] placeholder-[#636363] focus:outline-none focus:ring-2 focus:ring-[#202AED] text-base sm:text-lg"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#636363] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                  disabled={isChangingPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 !mt-6">
              <button
                type="submit"
                disabled={isChangingPassword || isLoading}
                className="flex-1 h-12 sm:h-13 md:h-14 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-sm sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Modification en cours...</span>
                  </>
                ) : (
                  'Modifier le mot de passe'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/app')}
                className="flex-1 h-12 sm:h-13 md:h-14 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl bg-[#FEF8EE] hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-sm sm:text-base md:text-lg cursor-pointer"
              >
                Retour
              </button>
            </div>
          </form>
        </div>

        {/* Delete Account Section */}
        <div className="flex flex-col items-center gap-4 !mt-8">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="h-12 sm:h-13 md:h-14 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-sm sm:text-base md:text-lg cursor-pointer"
          >
            Supprimer mon compte
          </button>
          <p className="text-sm sm:text-base text-[#636363] text-center max-w-md">
            Une fois votre compte supprimé, vous perdrez tous vos liens, dossiers, groupes et données personnelles. Cette action est irréversible.
          </p>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </div>
  );
}
