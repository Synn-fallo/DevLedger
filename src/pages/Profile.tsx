import { useState } from 'react';
import { User, Mail, Calendar, Shield, Key, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';

export function Profile() {
  const { user } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    createdAt: '',
    lastSignInAt: ''
  });

  // Mettre à jour les données utilisateur quand user change
  useState(() => {
    if (user) {
      setUserData({
        email: user.email || '',
        createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '',
        lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : ''
      });
    }
  }, [user]);

  return (
    <>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Informations de votre compte</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mon Compte</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos informations personnelles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse email
                </label>
              </div>
              <p className="text-gray-900 dark:text-white ml-8">{userData.email}</p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compte créé le
                </label>
              </div>
              <p className="text-gray-900 dark:text-white ml-8">{userData.createdAt}</p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dernière connexion
                </label>
              </div>
              <p className="text-gray-900 dark:text-white ml-8">{userData.lastSignInAt || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Section Sécurité */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Sécurité</h3>
              <p className="text-sm text-blue-800 dark:text-blue-400 mb-4">
                Votre compte est protégé par une authentification sécurisée. Votre mot de passe est chiffré et stocké de manière sécurisée.
              </p>
            </div>
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Key className="w-4 h-4" />
            Changer le mot de passe
          </button>
        </div>

        {/* Zone de danger */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Zone de danger</h3>
              <p className="text-sm text-amber-800 dark:text-amber-400 mb-4">
                Supprimer votre compte est une action irréversible qui supprimera tous vos données.
              </p>
            </div>
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <button
            onClick={() => setIsDeleteAccountOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
      />
    </>
  );
}