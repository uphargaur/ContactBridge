import { Contact, CreateContactData, UpdateContactData } from '../types/contact.types';

export interface IContactRepository {
  /**
   * Find contacts by email or phone number
   */
  findByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]>;

  /**
   * Find all contacts linked to a primary contact (including the primary itself)
   */
  findLinkedContacts(primaryContactId: number): Promise<Contact[]>;

  /**
   * Find contacts that share email or phone with the given contact
   */
  findRelatedContacts(email?: string, phoneNumber?: string): Promise<Contact[]>;

  /**
   * Create a new contact
   */
  create(contactData: CreateContactData): Promise<Contact>;

  /**
   * Update an existing contact
   */
  update(id: number, updateData: UpdateContactData): Promise<Contact>;

  /**
   * Find contact by ID
   */
  findById(id: number): Promise<Contact | null>;

  /**
   * Find all primary contacts that could be linked by the given email/phone
   */
  findPotentialPrimaryContacts(email?: string, phoneNumber?: string): Promise<Contact[]>;

  /**
   * Get all contacts in a contact chain (primary + all secondaries)
   */
  getContactChain(contactId: number): Promise<Contact[]>;

  /**
   * Batch update multiple contacts
   */
  batchUpdate(updates: Array<{ id: number; data: UpdateContactData }>): Promise<Contact[]>;
} 