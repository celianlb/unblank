import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAITagService } from '@/infra/ai/OpenAITagService';
import { GenerateAITagsUseCase } from '@/application/tags/usecases/GenerateAITagsUseCase';
import TagFactory from '@/lib/tags/tagFactory';

/**
 * Factory pour créer les instances de services IA
 * Pattern: Dependency Injection + Factory
 *
 * Note: OpenAITagService est instancié à la demande (pas de singleton)
 * car il ne maintient pas d'état entre les appels
 */
class AIFactory {
  /**
   * Crée une instance du use case de génération de tags IA
   * Utilisé côté serveur (API routes) avec le client Supabase de l'utilisateur
   */
  static createGenerateAITagsUseCase(supabaseClient: SupabaseClient): GenerateAITagsUseCase {
    const aiService = new OpenAITagService();
    const tagService = TagFactory.createTagService(supabaseClient);

    return new GenerateAITagsUseCase(aiService, tagService, supabaseClient);
  }

  /**
   * Crée uniquement le service OpenAI (pour des cas d'usage avancés)
   */
  static createOpenAIService(): OpenAITagService {
    return new OpenAITagService();
  }
}

export default AIFactory;
