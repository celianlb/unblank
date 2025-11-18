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
} from '@/domain/auth/usecases';

/**
 * Factory pour créer les instances d'authentification
 * Pattern: Dependency Injection + Factory
 */
class AuthFactory {
  private static authRepository: SupabaseAuthRepository | null = null;
  private static authService: AuthService | null = null;

  /**
   * Récupère l'instance du repository (Singleton)
   */
  static getAuthRepository(): SupabaseAuthRepository {
    if (!this.authRepository) {
      this.authRepository = new SupabaseAuthRepository(supabase);
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
    return new ResetPasswordUseCase(this.getAuthService());
  }
}

export default AuthFactory;

