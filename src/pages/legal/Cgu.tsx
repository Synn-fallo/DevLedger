import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Cgu() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Conditions Générales d'Utilisation</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Dernière mise à jour : 03 avril 2026</p>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptation des conditions</h2>
              <p>En accédant et en utilisant DevLedger, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description du service</h2>
              <p>DevLedger est un OS de productivité centré projet pour développeurs tech, permettant de structurer, mesurer, valoriser, analyser et capitaliser l'ensemble du travail de développement d'applications.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Compte utilisateur</h2>
              <p>Pour utiliser DevLedger, vous devez créer un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte. Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Abonnements et paiements</h2>
              <p>DevLedger propose un plan Freemium gratuit et un plan Pro payant. Les paiements sont traités par Stripe et les services Mobile Money partenaires. Les abonnements sont automatiquement renouvelés sauf annulation avant la date d'échéance.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Propriété intellectuelle</h2>
              <p>Tous les contenus de DevLedger (textes, logos, icônes, code) sont protégés par les lois sur la propriété intellectuelle. Vous conservez la propriété de vos données, mais nous accordez une licence pour les héberger et les traiter.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Responsabilité</h2>
              <p>DevLedger est fourni "en l'état". Nous ne garantissons pas que le service sera ininterrompu ou sans erreur. Notre responsabilité ne pourra excéder le montant que vous avez payé pour le service au cours des 12 mois précédents.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Résiliation</h2>
              <p>Vous pouvez résilier votre compte à tout moment. Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation de ces conditions.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Modification des conditions</h2>
              <p>Nous pouvons modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication. Votre utilisation continue du service vaut acceptation des conditions modifiées.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Loi applicable</h2>
              <p>Les présentes conditions sont régies par le droit béninois. Tout litige sera soumis aux tribunaux compétents de Cotonou, Bénin.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Contact</h2>
              <p>Pour toute question concernant ces conditions, contactez-nous à : <a href="mailto:legal@devledger.com" className="text-blue-600 hover:underline">legal@devledger.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}