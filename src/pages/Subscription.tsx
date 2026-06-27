import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PlanCard } from '../components/subscription/PlanCard';
import { FeatureList } from '../components/subscription/FeatureList';
import { PaymentModal } from '../components/subscription/PaymentModal';
import { Crown, Check, Zap, Building } from 'lucide-react';

export function Subscription() {
  const { user } = useAuth();
  const { plan, isPro, isEnterprise, refreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = [
    {
      id: 'free' as const,
      name: 'Freemium',
      price: 0,
      priceLabel: 'Gratuit',
      icon: Crown,
      features: [
        'Jusqu\'à 10 projets actifs',
        'Jusqu\'à 2 collaborateurs par projet',
        'Sessions et bugs illimités',
        'Plan de développement',
        'Export PDF',
        'Thème clair/sombre'
      ],
      buttonLabel: 'Actuel',
      buttonVariant: 'secondary' as const
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: 5000,
      priceLabel: '5 000 CFA / mois',
      icon: Zap,
      features: [
        'Projets illimités',
        'Collaborateurs illimités',
        'Tout ce qui est dans Freemium',
        'Mode Avancé',
        'Export CSV et Excel',
        'Pièces jointes (jusqu\'à 10 Mo)',
        'Historique du plan',
        'Support email'
      ],
      buttonLabel: isPro ? 'Actuel' : 'Passer à Pro',
      buttonVariant: isPro ? 'secondary' : 'primary' as const
    },
    {
      id: 'enterprise' as const,
      name: 'Entreprise',
      price: null,
      priceLabel: 'Sur devis',
      icon: Building,
      features: [
        'Tout ce qui est dans Pro',
        'API dédiée',
        'Support prioritaire',
        'Hébergement dédié (optionnel)',
        'SSO (optionnel)',
        'Audit logs',
        'SLA personnalisé'
      ],
      buttonLabel: isEnterprise ? 'Actuel' : 'Nous contacter',
      buttonVariant: isEnterprise ? 'secondary' : 'outline' as const
    }
  ];

  const handleUpgrade = (planId: 'pro' | 'enterprise') => {
    if (planId === 'pro' && !isPro) {
      setSelectedPlan('pro');
      setShowPaymentModal(true);
    } else if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@devledger.com?subject=Devis%20Entreprise%20DevLedger';
    }
  };

  const handlePaymentSuccess = async () => {
    await refreshSubscription();
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  return (
    <div className="p-6 space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Abonnements
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choisissez le plan qui correspond à vos besoins
        </p>
      </div>

      {/* Plan actuel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Plan actuel : {plan === 'free' ? 'Freemium' : plan === 'pro' ? 'Pro' : 'Entreprise'}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              {plan === 'free' && 'Passez à Pro pour débloquer toutes les fonctionnalités'}
              {plan === 'pro' && 'Profitez pleinement de toutes les fonctionnalités Pro'}
              {plan === 'enterprise' && 'Vous bénéficiez du plan Entreprise'}
            </p>
          </div>
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((planOption) => (
          <PlanCard
            key={planOption.id}
            name={planOption.name}
            price={planOption.price}
            priceLabel={planOption.priceLabel}
            icon={planOption.icon}
            features={planOption.features}
            buttonLabel={planOption.buttonLabel}
            buttonVariant={planOption.buttonVariant}
            onAction={() => {
              if (planOption.id === 'free') return;
              handleUpgrade(planOption.id);
            }}
            isCurrent={
              (planOption.id === 'free' && plan === 'free') ||
              (planOption.id === 'pro' && plan === 'pro') ||
              (planOption.id === 'enterprise' && plan === 'enterprise')
            }
          />
        ))}
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          💳 Moyens de paiement acceptés
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Carte bancaire (Visa, Mastercard) • Mobile Money (MTN, Moov, Orange Money)
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Tous les prix sont en CFA (XOF). Les paiements sont sécurisés et traités par Stripe et nos partenaires Mobile Money.
        </p>
      </div>

      {/* Modale de paiement */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          amount={selectedPlan === 'pro' ? 5000 : 0}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}