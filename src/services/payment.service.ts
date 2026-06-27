interface CardPaymentData {
  amount: number;
  plan: 'pro' | 'enterprise';
  cardNumber: string;
  expiry: string;
  cvc: string;
}

interface MobileMoneyPaymentData {
  amount: number;
  plan: 'pro' | 'enterprise';
  phoneNumber: string;
  provider: 'mtn' | 'moov' | 'orange';
}

interface PaymentResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}

class PaymentService {
  // Simulation de paiement par carte (à remplacer par Stripe)
  async processCardPayment(data: CardPaymentData): Promise<PaymentResult> {
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validation simple
    if (!data.cardNumber || data.cardNumber.replace(/\s/g, '').length < 16) {
      return { success: false, error: 'Numéro de carte invalide' };
    }
    if (!data.expiry) {
      return { success: false, error: 'Date d\'expiration invalide' };
    }
    if (!data.cvc || data.cvc.length < 3) {
      return { success: false, error: 'CVC invalide' };
    }

    // Simuler un succès
    return {
      success: true,
      transactionId: `tx_card_${Date.now()}`
    };
  }

  // Simulation de paiement par Mobile Money (à remplacer par API réelle)
  async processMobileMoneyPayment(data: MobileMoneyPaymentData): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!data.phoneNumber || data.phoneNumber.length < 8) {
      return { success: false, error: 'Numéro de téléphone invalide' };
    }

    return {
      success: true,
      transactionId: `tx_mm_${Date.now()}`
    };
  }

  // Vérifier le statut d'un paiement
  async checkPaymentStatus(transactionId: string): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      transactionId
    };
  }
}

export const paymentService = new PaymentService();