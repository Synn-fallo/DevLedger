import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Confidentialite() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Politique de confidentialité</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Dernière mise à jour : 03 avril 2026</p>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Collecte des données</h2>
              <p>Nous collectons les informations suivantes :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Informations d'identification (email, nom)</li>
                <li>Données de projet (noms, descriptions, sessions, bugs)</li>
                <li>Données d'utilisation (temps passé, tokens consommés)</li>
                <li>Informations de paiement (traitées par nos partenaires, nous ne stockons pas les données bancaires)</li>
                <li>Données techniques (adresse IP, navigateur, appareil)</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Utilisation des données</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Fournir et maintenir le service</li>
                <li>Calculer la valeur de votre travail (temps × taux horaire)</li>
                <li>Améliorer nos services et analyser l'utilisation</li>
                <li>Vous contacter concernant votre compte ou nos services</li>
                <li>Traiter vos paiements</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Partage des données</h2>
              <p>Nous ne vendons pas vos données personnelles. Vos données peuvent être partagées avec :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Nos partenaires de paiement (Stripe, Mobile Money) pour traiter vos transactions</li>
                <li>Les autorités légales si requis par la loi</li>
                <li>Les collaborateurs que vous invitez sur vos projets (selon vos paramètres de partage)</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Stockage et sécurité</h2>
              <p>Vos données sont hébergées sur les serveurs de Supabase (Europe). Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Durée de conservation</h2>
              <p>Nous conservons vos données tant que votre compte est actif. Après suppression de votre compte, vos données sont définitivement supprimées dans un délai de 30 jours.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Vos droits (RGPD)</h2>
              <p>Vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement ("droit à l'oubli")</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité des données</li>
                <li>Droit d'opposition</li>
              </ul>
              <p className="mt-2">Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@devledger.com" className="text-blue-600 hover:underline">privacy@devledger.com</a></p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Cookies</h2>
              <p>Nous utilisons des cookies pour assurer le bon fonctionnement de l'application (authentification, préférences de thème). Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais certaines fonctionnalités pourraient ne plus fonctionner correctement.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Modifications</h2>
              <p>Nous pouvons modifier cette politique de confidentialité. En cas de modification importante, nous vous en informerons par email ou via l'application.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Contact</h2>
              <p>Pour toute question relative à la confidentialité : <a href="mailto:privacy@devledger.com" className="text-blue-600 hover:underline">privacy@devledger.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}