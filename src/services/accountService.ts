import { supabase } from '../lib/supabase';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const accountService = {
  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; error?: string }> {
    // Vérifier que les mots de passe correspondent
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'Les nouveaux mots de passe ne correspondent pas' };
    }

    // Vérifier que le nouveau mot de passe a au moins 6 caractères
    if (data.newPassword.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' };
    }

    try {
      // Changer le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Une erreur est survenue lors du changement de mot de passe' };
    }
  },

  /**
   * Supprime le compte utilisateur et toutes ses données associées
   */
  async deleteAccount(): Promise<DeleteAccountResult> {
    // Récupérer la session actuelle
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      console.log('Appel de la fonction delete-user...');
      
      // Appeler la Edge Function
      const { data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        return { success: false, error: error.message };
      }

      console.log('Réponse de la fonction:', data);

      if (!data.success) {
        return { success: false, error: data.error || 'Erreur lors de la suppression' };
      }

      // Déconnecter l'utilisateur
      await supabase.auth.signOut();

      return { 
        success: true, 
        message: data.message || 'Compte supprimé avec succès' 
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      return { success: false, error: 'Une erreur est survenue lors de la suppression du compte' };
    }
  }
};