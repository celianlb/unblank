import { AuthService } from '../services';

/**
 * Use Case: Suppression du compte utilisateur
 */
export class DeleteAccountUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(): Promise<void> {
    return await this.authService.deleteAccount();
  }
}
