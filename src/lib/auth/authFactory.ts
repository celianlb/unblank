import { supabase } from '@/infra/db/supabase';
import { SupabaseAuthRepository } from '@/infra/auth';
import { AuthService } from '@/domain/auth/services';
import {
  SignInUseCase,
  SignUpUseCase,
  SignInWithOAuthUseCase,
  SignOutUseCase,
  GetCurrentSessionUseCase,
  ResetPasswordUseCase,
  UpdatePasswordUseCase,
  UpdateProfileUseCase,
  DeleteAccountUseCase,
} from '@/domain/auth/usecases';
import { AvatarUrlService } from '@/application/auth/AvatarUrlService';
import { SupabaseAvatarStorageService } from '@/infra/storage/SupabaseAvatarStorageService';
import { UploadAvatarUseCase } from '@/application/auth/UploadAvatarUseCase';
import { AvatarStoragePort } from '@/application/auth/ports/AvatarStoragePort';

/**
 * Factory pour créer les instances d'authentification
 * Pattern: Dependency Injection + Factory
 */
class AuthFactory {
  private static authRepository: SupabaseAuthRepository | null = null;
  private static authService: AuthService | null = null;

  // Nouveaux services pour avatars (singletons)
  private static avatarUrlService: AvatarUrlService | null = null;
  private static avatarStorageService: AvatarStoragePort | null = null;

  /**
   * Récupère l'instance de AvatarUrlService (Singleton)
   */
  private static getAvatarUrlService(): AvatarUrlService {
    if (!this.avatarUrlService) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      this.avatarUrlService = new AvatarUrlService(supabaseUrl);
    }
    return this.avatarUrlService;
  }

  /**
   * Récupère l'instance de AvatarStorageService (Singleton)
   */
  private static getAvatarStorageService(): AvatarStoragePort {
    if (!this.avatarStorageService) {
      this.avatarStorageService = new SupabaseAvatarStorageService(supabase);
    }
    return this.avatarStorageService;
  }

  /**
   * Récupère l'instance du repository (Singleton)
   */
  static getAuthRepository(): SupabaseAuthRepository {
    if (!this.authRepository) {
      this.authRepository = new SupabaseAuthRepository(
        supabase,
        this.getAvatarUrlService()
      );
    }
    return this.authRepository;
  }

  /**
   * Récupère l'instance du service (Singleton)
   */
  static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService(this.getAuthRepository());
    }
    return this.authService;
  }

  /**
   * Crée une nouvelle instance du use case SignIn
   */
  static createSignInUseCase(): SignInUseCase {
    return new SignInUseCase(this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case SignUp
   */
  static createSignUpUseCase(): SignUpUseCase {
    return new SignUpUseCase(this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case SignInWithOAuth
   */
  static createSignInWithOAuthUseCase(): SignInWithOAuthUseCase {
    return new SignInWithOAuthUseCase(this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case SignOut
   */
  static createSignOutUseCase(): SignOutUseCase {
    return new SignOutUseCase(this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case GetCurrentSession
   */
  static createGetCurrentSessionUseCase(): GetCurrentSessionUseCase {
    return new GetCurrentSessionUseCase(this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case ResetPassword
   */
  static createResetPasswordUseCase(): ResetPasswordUseCase {
    return new ResetPasswordUseCase();
  }

  /**
   * Crée une nouvelle instance du use case UpdatePassword
   */
  static createUpdatePasswordUseCase(): UpdatePasswordUseCase {
    return new UpdatePasswordUseCase(this.getAuthRepository(), this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case UpdateProfile
   */
  static createUpdateProfileUseCase(): UpdateProfileUseCase {
    return new UpdateProfileUseCase(this.getAuthRepository());
  }

  /**
   * Crée une nouvelle instance du use case DeleteAccount
   */
  static createDeleteAccountUseCase(): DeleteAccountUseCase {
    return new DeleteAccountUseCase(this.getAuthService());
  }

  /**
   * Crée une nouvelle instance du use case UploadAvatar
   */
  static createUploadAvatarUseCase(): UploadAvatarUseCase {
    return new UploadAvatarUseCase(
      this.getAvatarStorageService(),
      this.getAvatarUrlService()
    );
  }
}

export default AuthFactory;

