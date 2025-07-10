import { z } from 'zod';
import { Contact, ConsolidatedContact, LinkPrecedence } from '../types/contact.types';

export const IdentifyRequestSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().min(1).optional()
}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: "Either email or phoneNumber must be provided",
    path: ["email", "phoneNumber"]
  }
);

export const CreateContactSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().min(1).optional(),
  linkedId: z.number().int().positive().optional(),
  linkPrecedence: z.enum(['primary', 'secondary'])
});

export class ContactModel {
  constructor(private contact: Contact) {}

  get id(): number {
    return this.contact.id;
  }

  get email(): string | null {
    return this.contact.email;
  }

  get phoneNumber(): string | null {
    return this.contact.phoneNumber;
  }

  get linkedId(): number | null {
    return this.contact.linkedId;
  }

  get linkPrecedence(): LinkPrecedence {
    return this.contact.linkPrecedence;
  }

  get createdAt(): Date {
    return this.contact.createdAt;
  }

  get updatedAt(): Date {
    return this.contact.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.contact.deletedAt;
  }

  isPrimary(): boolean {
    return this.contact.linkPrecedence === 'primary';
  }

  isSecondary(): boolean {
    return this.contact.linkPrecedence === 'secondary';
  }

  isLinked(): boolean {
    return this.contact.linkedId !== null;
  }

  hasEmail(): boolean {
    return this.contact.email !== null;
  }

  hasPhoneNumber(): boolean {
    return this.contact.phoneNumber !== null;
  }

  matchesEmail(email: string): boolean {
    return this.contact.email === email;
  }

  matchesPhoneNumber(phoneNumber: string): boolean {
    return this.contact.phoneNumber === phoneNumber;
  }

  static consolidateContacts(contacts: Contact[]): ConsolidatedContact {
    if (contacts.length === 0) {
      throw new Error('Cannot consolidate empty contact list');
    }

    // Find primary contact (oldest one or explicitly marked as primary)
    const primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || 
                          contacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

    const secondaryContacts = contacts.filter(c => c.id !== primaryContact.id);

    // Collect unique emails and phone numbers
    const emails = Array.from(new Set(
      contacts
        .map(c => c.email)
        .filter((email): email is string => email !== null)
    ));

    const phoneNumbers = Array.from(new Set(
      contacts
        .map(c => c.phoneNumber)
        .filter((phone): phone is string => phone !== null)
    ));

    // Ensure primary contact's email and phone are first
    if (primaryContact.email && !emails.includes(primaryContact.email)) {
      emails.unshift(primaryContact.email);
    } else if (primaryContact.email) {
      // Move primary email to front
      const index = emails.indexOf(primaryContact.email);
      if (index > 0) {
        emails.splice(index, 1);
        emails.unshift(primaryContact.email);
      }
    }

    if (primaryContact.phoneNumber && !phoneNumbers.includes(primaryContact.phoneNumber)) {
      phoneNumbers.unshift(primaryContact.phoneNumber);
    } else if (primaryContact.phoneNumber) {
      // Move primary phone to front
      const index = phoneNumbers.indexOf(primaryContact.phoneNumber);
      if (index > 0) {
        phoneNumbers.splice(index, 1);
        phoneNumbers.unshift(primaryContact.phoneNumber);
      }
    }

    return {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryContacts.map(c => c.id)
    };
  }

  toJSON(): Contact {
    return { ...this.contact };
  }
} 