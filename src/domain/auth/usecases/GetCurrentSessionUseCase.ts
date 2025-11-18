import { AuthService } from '../services';
import { UserSession } from '../models';

/**
 * Use Case: Récupérer la session actuelle
 */
export class GetCurrentSessionUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(): Promise<UserSession | null> {
    return await this.authService.getCurrentSession();
  }
}

