import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mentions légales</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Dernière mise à jour : 03 avril 2026</p>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Éditeur du site</h2>
              <p><strong>DevLedger</strong> est une application éditée par :</p>
              <p className="mt-2">
                <strong>Nom :</strong> ISKF Entreprises<br />
                <strong>Forme juridique :</strong> Entreprise individuelle<br />
                <strong>Adresse :</strong> Cotonou, Bénin<br />
                <strong>Email :</strong> <a href="mailto:contact@devledger.com" className="text-blue-600 hover:underline">contact@devledger.com</a><br />
                <strong>Téléphone :</strong> +229 90 00 00 00<br />
                <strong>RCCM :</strong> RB/COT/2025/B/0001<br />
                <strong>NIF :</strong> 3202500001234
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Directeur de publication</h2>
              <p>Modeste GANDO, Fondateur d'ISKF Entreprises</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Hébergement</h2>
              <p>
                <strong>Nom :</strong> Supabase<br />
                <strong>Adresse :</strong> 970 Toa Payoh North, #07-04, Singapore 318992<br />
                <strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://supabase.com</a>
              </p>
              <p className="mt-2">
                <strong>Nom :</strong> Netlify<br />
                <strong>Adresse :</strong> 44 Montgomery Street, Suite 300, San Francisco, CA 94104, USA<br />
                <strong>Site web :</strong> <a href="https://netlify.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://netlify.com</a>
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Prestataires de paiement</h2>
              <p>
                <strong>Stripe :</strong> 510 Townsend St, San Francisco, CA 94103, USA<br />
                <strong>Mobile Money :</strong> Partenariat avec MTN Bénin, Moov Bénin, Orange Money
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Propriété intellectuelle</h2>
              <p>L'ensemble des éléments composant DevLedger (interface, logos, icônes, code source) est protégé par le droit d'auteur. Toute reproduction, modification ou distribution sans autorisation préalable est interdite.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Limitation de responsabilité</h2>
              <p>DevLedger s'efforce d'assurer l'exactitude des informations, mais ne peut garantir l'absence d'erreurs. L'utilisation du service se fait sous votre propre responsabilité.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Contact</h2>
              <p>Pour toute question relative aux mentions légales : <a href="mailto:legal@devledger.com" className="text-blue-600 hover:underline">legal@devledger.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}