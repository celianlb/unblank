'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { User } from '@/domain/auth/models';
import { Camera, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { getCurrentSession, updateProfile, isLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [initialAvatarUrl, setInitialAvatarUrl] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vérifier si des modifications ont été faites
  const hasChanges = username !== initialUsername || avatarUrl !== initialAvatarUrl;

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true);
      const currentSession = await getCurrentSession();
      
      if (!currentSession) {
        router.push('/login');
      } else {
        setUser(currentSession.user);
        const currentUsername = currentSession.user.username || '';
        const currentAvatarUrl = currentSession.user.avatarUrl || '';
        setUsername(currentUsername);
        setAvatarUrl(currentAvatarUrl);
        setInitialUsername(currentUsername);
        setInitialAvatarUrl(currentAvatarUrl);
      }
      setLoadingSession(false);
    };

    fetchSession();
  }, [getCurrentSession, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Pour l'instant, on utilise un URL local
      // Dans une vraie implémentation, il faudrait uploader le fichier vers un service de stockage
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const updatedUser = await updateProfile({
        username: username.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      if (updatedUser) {
        setUser(updatedUser);
        // Mettre à jour les valeurs initiales après sauvegarde
        setInitialUsername(updatedUser.username || '');
        setInitialAvatarUrl(updatedUser.avatarUrl || '');
        setSuccessMessage('Profil mis à jour avec succès !');
        
        // Effacer le message après 3 secondes
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrorMessage('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      // Annuler : réinitialiser aux valeurs d'origine
      setUsername(initialUsername);
      setAvatarUrl(initialAvatarUrl);
      setSuccessMessage('');
      setErrorMessage('');
    } else {
      // Retour : retourner à l'application
      router.push('/app');
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
            Profil
          </h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg md:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
            <p className="text-green-700 font-medium text-sm sm:text-base">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg md:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
            <p className="text-red-700 font-medium text-sm sm:text-base">{errorMessage}</p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white border-2 md:border-3 lg:border-4 border-black rounded-2xl md:rounded-[20px] lg:rounded-[24px] p-4 sm:p-6 md:p-7 lg:p-8 shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] md:shadow-[5px_5px_0px_#000000] lg:shadow-[6px_6px_0px_#000000]">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 md:space-y-8">
            {/* Avatar Section */}
            <div className="pb-2 sm:pb-3 md:pb-4">
              <label className="block text-base sm:text-lg font-bold text-[#0D0D0D] mb-3 sm:mb-4">
                Photo de profil
              </label>
              <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-3 md:border-4 border-black overflow-hidden bg-gradient-to-br from-gray-300 to-gray-400">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl sm:text-3xl md:text-4xl font-bold text-white">
                        {username.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-[#202AED] rounded-full border-2 border-black flex items-center justify-center hover:bg-[#1820BD] transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Username Section */}
            <div>
              <label htmlFor="username" className="block text-base sm:text-lg font-bold text-[#0D0D0D] mb-2 sm:mb-3">
                Pseudo
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nouveau pseudo"
                className="w-full h-12 sm:h-13 md:h-14 px-3 sm:px-4 rounded-lg sm:rounded-xl border-2 border-black bg-white text-[#0D0D0D] placeholder-[#636363] focus:outline-none focus:ring-2 focus:ring-[#202AED] text-base sm:text-lg"
              />
              <p className="text-xs sm:text-sm text-[#636363] mt-2 sm:mt-3 pb-2 sm:pb-3 md:pb-4">
                Ce nom sera visible par les autres utilisateurs
              </p>
            </div>

            {/* Email (non modifiable) */}
            <div>
              <label className="block text-base sm:text-lg font-bold text-[#0D0D0D] mb-2 sm:mb-3">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full h-12 sm:h-13 md:h-14 px-3 sm:px-4 rounded-lg sm:rounded-xl border-2 border-black bg-gray-100 text-[#636363] text-base sm:text-lg cursor-not-allowed"
              />
              <p className="text-xs sm:text-sm text-[#636363] mt-2 sm:mt-3">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-3 md:pt-4">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="h-12 sm:h-13 md:h-14 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-sm sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="hidden sm:inline">Enregistrement...</span>
                    <span className="sm:hidden">Enregistrer...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Enregistrer les modifications</span>
                    <span className="sm:hidden">Enregistrer</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="h-12 sm:h-13 md:h-14 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl bg-[#FEF8EE] hover:bg-[#FFEFD9] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-sm sm:text-base md:text-lg cursor-pointer"
              >
                {hasChanges ? 'Annuler' : 'Retour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

