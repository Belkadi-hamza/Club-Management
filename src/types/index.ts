export interface Club {
  id: string;
  name: string;
  phone: string;
  email: string;
  imageUrl?: string;
  created_at: string;
  sports: Record<string, Sport>;
  athletes: Record<string, Athlete>;
}

export interface Sport {
  id: string;
  name: string;
}

export interface Athlete {
  id: string;
  nom: string;
  date_naissance: string;
  telephone: string;
  sexe: 'Homme' | 'Femme';
  status: 'active' | 'inactive';
  date_deactivated?: string;
  reason_deactivated?: string;
  notes?: string;
  sports: Record<string, AthleteSport>;
}

export interface AthleteSport {
  sportId: string;
  sportName: string;
  montant: number;
  date_debut: string;
  paiements: Record<string, Payment>;
}

export interface Payment {
  id: string;
  mois: string;
  montant: number;
  date_paiement: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  clubId: string;
}