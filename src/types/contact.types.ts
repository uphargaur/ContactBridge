export type LinkPrecedence = 'primary' | 'secondary';

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: LinkPrecedence;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface ConsolidatedContact {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface IdentifyResponse {
  contact: ConsolidatedContact;
}

export interface CreateContactData {
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: LinkPrecedence;
}

export interface UpdateContactData {
  linkedId?: number;
  linkPrecedence?: LinkPrecedence;
  updatedAt?: Date;
} 