import { IContactRepository } from '../repositories/contact.repository.interface';
import { Contact, IdentifyRequest, ConsolidatedContact, CreateContactData } from '../types/contact.types';
import { ContactModel } from '../models/contact.model';

export class ContactService {
  constructor(private contactRepository: IContactRepository) {}

  async identify(request: IdentifyRequest): Promise<ConsolidatedContact> {
    const { email, phoneNumber } = request;

    // Find existing contacts that match email or phone
    const existingContacts = await this.contactRepository.findByEmailOrPhone(email, phoneNumber);

    if (existingContacts.length === 0) {
      // No existing contacts found - create a new primary contact
      return this.createNewPrimaryContact(email, phoneNumber);
    }

    // Group contacts by their primary contact ID
    const contactGroups = await this.groupContactsByPrimary(existingContacts);

    if (contactGroups.length === 1) {
      // All contacts belong to the same group
      return this.handleSingleGroup(contactGroups[0], email, phoneNumber);
    } else if (contactGroups.length > 1) {
      // Multiple groups found - need to merge them
      return this.handleMultipleGroups(contactGroups, email, phoneNumber);
    }

    // This should never happen, but just in case
    return this.createNewPrimaryContact(email, phoneNumber);
  }

  private async createNewPrimaryContact(email?: string, phoneNumber?: string): Promise<ConsolidatedContact> {
    const contactData: CreateContactData = {
      linkPrecedence: 'primary',
      ...(email && { email }),
      ...(phoneNumber && { phoneNumber })
    };

    const newContact = await this.contactRepository.create(contactData);
    
    return ContactModel.consolidateContacts([newContact]);
  }

  private async groupContactsByPrimary(contacts: Contact[]): Promise<Contact[][]> {
    const groups = new Map<number, Contact[]>();

    for (const contact of contacts) {
      let primaryId: number;

      if (contact.linkPrecedence === 'primary') {
        primaryId = contact.id;
      } else if (contact.linkedId) {
        primaryId = contact.linkedId;
      } else {
        // This shouldn't happen in a well-formed database
        continue;
      }

      if (!groups.has(primaryId)) {
        // Get all contacts in this group
        const allGroupContacts = await this.contactRepository.findLinkedContacts(primaryId);
        groups.set(primaryId, allGroupContacts);
      }
    }

    return Array.from(groups.values());
  }

  private async handleSingleGroup(groupContacts: Contact[], email?: string, phoneNumber?: string): Promise<ConsolidatedContact> {
    // Check if we need to create a new secondary contact
    const needsNewSecondary = this.shouldCreateNewSecondary(groupContacts, email, phoneNumber);

    if (needsNewSecondary) {
      const primaryContact = groupContacts.find(c => c.linkPrecedence === 'primary')!;
      
      const newSecondaryData: CreateContactData = {
        linkedId: primaryContact.id,
        linkPrecedence: 'secondary',
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber })
      };

      const newSecondary = await this.contactRepository.create(newSecondaryData);
      groupContacts.push(newSecondary);
    }

    return ContactModel.consolidateContacts(groupContacts);
  }

  private async handleMultipleGroups(contactGroups: Contact[][], email?: string, phoneNumber?: string): Promise<ConsolidatedContact> {
    // Find the oldest primary contact to become the master primary
    const primaryContacts = contactGroups.map(group => 
      group.find(c => c.linkPrecedence === 'primary')!
    );

    const masterPrimary = primaryContacts.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    )[0];

    // Merge all groups under the master primary
    const allContacts: Contact[] = [];
    const contactsToUpdate: Array<{ id: number; data: any }> = [];

    for (const group of contactGroups) {
      const groupPrimary = group.find(c => c.linkPrecedence === 'primary')!;
      
      if (groupPrimary.id === masterPrimary.id) {
        // This is the master group, add all contacts as-is
        allContacts.push(...group);
      } else {
        // Convert this group's primary to secondary and link to master
        contactsToUpdate.push({
          id: groupPrimary.id,
          data: {
            linkedId: masterPrimary.id,
            linkPrecedence: 'secondary',
            updatedAt: new Date()
          }
        });

        // Add the updated primary as secondary
        allContacts.push({
          ...groupPrimary,
          linkedId: masterPrimary.id,
          linkPrecedence: 'secondary' as const,
          updatedAt: new Date()
        });

        // Add all other contacts from this group (they're already secondaries)
        const otherContacts = group.filter(c => c.id !== groupPrimary.id);
        allContacts.push(...otherContacts);
      }
    }

    // Perform batch update for converted primaries
    if (contactsToUpdate.length > 0) {
      await this.contactRepository.batchUpdate(contactsToUpdate);
    }

    // Check if we need to create a new secondary contact for the new information
    const needsNewSecondary = this.shouldCreateNewSecondary(allContacts, email, phoneNumber);

    if (needsNewSecondary) {
      const newSecondaryData: CreateContactData = {
        linkedId: masterPrimary.id,
        linkPrecedence: 'secondary',
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber })
      };

      const newSecondary = await this.contactRepository.create(newSecondaryData);
      allContacts.push(newSecondary);
    }

    return ContactModel.consolidateContacts(allContacts);
  }

  private shouldCreateNewSecondary(contacts: Contact[], email?: string, phoneNumber?: string): boolean {
    // Don't create if no new information is provided
    if (!email && !phoneNumber) {
      return false;
    }

    // Check if exact combination already exists
    const exactMatch = contacts.some(contact => 
      contact.email === (email || null) && 
      contact.phoneNumber === (phoneNumber || null)
    );

    if (exactMatch) {
      return false;
    }

    // Check if we have new information (either new email or new phone)
    const hasNewEmail = !!(email && !contacts.some(c => c.email === email));
    const hasNewPhone = !!(phoneNumber && !contacts.some(c => c.phoneNumber === phoneNumber));

    return hasNewEmail || hasNewPhone;
  }

  async getContactById(id: number): Promise<Contact | null> {
    return this.contactRepository.findById(id);
  }

  async getContactChain(contactId: number): Promise<ConsolidatedContact | null> {
    const contacts = await this.contactRepository.getContactChain(contactId);
    
    if (contacts.length === 0) {
      return null;
    }

    return ContactModel.consolidateContacts(contacts);
  }
} 