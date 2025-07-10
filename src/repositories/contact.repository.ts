import { PrismaClient } from '@prisma/client';
import { Contact, CreateContactData, UpdateContactData } from '../types/contact.types';
import { IContactRepository } from './contact.repository.interface';
import { DatabaseError } from '../types/common.types';

export class ContactRepository implements IContactRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    try {
      const whereConditions = [];
      
      if (email) {
        whereConditions.push({ email });
      }
      
      if (phoneNumber) {
        whereConditions.push({ phoneNumber });
      }

      if (whereConditions.length === 0) {
        return [];
      }

      const contacts = await this.prisma.contact.findMany({
        where: {
          OR: whereConditions,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return contacts.map(this.mapPrismaContactToContact);
    } catch (error) {
      throw this.handleDatabaseError(error, 'findByEmailOrPhone');
    }
  }

  async findLinkedContacts(primaryContactId: number): Promise<Contact[]> {
    try {
      const contacts = await this.prisma.contact.findMany({
        where: {
          OR: [
            { id: primaryContactId },
            { linkedId: primaryContactId }
          ],
          deletedAt: null
        },
        orderBy: [
          { linkPrecedence: 'asc' }, // primary first
          { createdAt: 'asc' }
        ]
      });

      return contacts.map(this.mapPrismaContactToContact);
    } catch (error) {
      throw this.handleDatabaseError(error, 'findLinkedContacts');
    }
  }

  async findRelatedContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    try {
      return this.findByEmailOrPhone(email, phoneNumber);
    } catch (error) {
      throw this.handleDatabaseError(error, 'findRelatedContacts');
    }
  }

  async create(contactData: CreateContactData): Promise<Contact> {
    try {
      const contact = await this.prisma.contact.create({
        data: {
          email: contactData.email || null,
          phoneNumber: contactData.phoneNumber || null,
          linkedId: contactData.linkedId || null,
          linkPrecedence: contactData.linkPrecedence
        }
      });

      return this.mapPrismaContactToContact(contact);
    } catch (error) {
      throw this.handleDatabaseError(error, 'create');
    }
  }

  async update(id: number, updateData: UpdateContactData): Promise<Contact> {
    try {
      const contact = await this.prisma.contact.update({
        where: { id },
        data: {
          linkedId: updateData.linkedId,
          linkPrecedence: updateData.linkPrecedence,
          updatedAt: updateData.updatedAt || new Date()
        }
      });

      return this.mapPrismaContactToContact(contact);
    } catch (error) {
      throw this.handleDatabaseError(error, 'update');
    }
  }

  async findById(id: number): Promise<Contact | null> {
    try {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id,
          deletedAt: null
        }
      });

      return contact ? this.mapPrismaContactToContact(contact) : null;
    } catch (error) {
      throw this.handleDatabaseError(error, 'findById');
    }
  }

  async findPotentialPrimaryContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    try {
      const whereConditions = [];
      
      if (email) {
        whereConditions.push({ email });
      }
      
      if (phoneNumber) {
        whereConditions.push({ phoneNumber });
      }

      if (whereConditions.length === 0) {
        return [];
      }

      // Find contacts that match email or phone, then get their primary contacts
      const matchingContacts = await this.prisma.contact.findMany({
        where: {
          OR: whereConditions,
          deletedAt: null
        },
        include: {
          linkedContact: true
        }
      });

      // Get primary contact IDs
      const primaryContactIds = new Set<number>();
      
      matchingContacts.forEach(contact => {
        if (contact.linkPrecedence === 'primary') {
          primaryContactIds.add(contact.id);
        } else if (contact.linkedId) {
          primaryContactIds.add(contact.linkedId);
        }
      });

      // Fetch all primary contacts
      const primaryContacts = await this.prisma.contact.findMany({
        where: {
          id: {
            in: Array.from(primaryContactIds)
          },
          deletedAt: null
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return primaryContacts.map(this.mapPrismaContactToContact);
    } catch (error) {
      throw this.handleDatabaseError(error, 'findPotentialPrimaryContacts');
    }
  }

  async getContactChain(contactId: number): Promise<Contact[]> {
    try {
      // First, find if this contact is primary or secondary
      const contact = await this.findById(contactId);
      if (!contact) {
        return [];
      }

      let primaryContactId: number;
      
      if (contact.linkPrecedence === 'primary') {
        primaryContactId = contact.id;
      } else if (contact.linkedId) {
        primaryContactId = contact.linkedId;
      } else {
        // This shouldn't happen in a well-formed database
        return [contact];
      }

      return this.findLinkedContacts(primaryContactId);
    } catch (error) {
      throw this.handleDatabaseError(error, 'getContactChain');
    }
  }

  async batchUpdate(updates: Array<{ id: number; data: UpdateContactData }>): Promise<Contact[]> {
    try {
      const updatedContacts: Contact[] = [];

      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        for (const update of updates) {
          const contact = await tx.contact.update({
            where: { id: update.id },
            data: {
              linkedId: update.data.linkedId,
              linkPrecedence: update.data.linkPrecedence,
              updatedAt: update.data.updatedAt || new Date()
            }
          });
          updatedContacts.push(this.mapPrismaContactToContact(contact));
        }
      });

      return updatedContacts;
    } catch (error) {
      throw this.handleDatabaseError(error, 'batchUpdate');
    }
  }

  private mapPrismaContactToContact(prismaContact: any): Contact {
    return {
      id: prismaContact.id,
      phoneNumber: prismaContact.phoneNumber,
      email: prismaContact.email,
      linkedId: prismaContact.linkedId,
      linkPrecedence: prismaContact.linkPrecedence as 'primary' | 'secondary',
      createdAt: prismaContact.createdAt,
      updatedAt: prismaContact.updatedAt,
      deletedAt: prismaContact.deletedAt
    };
  }

  private handleDatabaseError(error: any, operation: string): DatabaseError {
    const message = `Database error in ${operation}: ${error.message}`;
    return {
      message,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: operation,
      code: error.code
    };
  }
} 