import { ContactModel, IdentifyRequestSchema, CreateContactSchema } from '../../src/models/contact.model';
import { Contact } from '../../src/types/contact.types';
import { createMockContact, createMockSecondaryContact } from '../setup';

describe('ContactModel', () => {
  describe('ContactModel class', () => {
    let contact: Contact;
    let contactModel: ContactModel;

    beforeEach(() => {
      contact = createMockContact();
      contactModel = new ContactModel(contact);
    });

    describe('getters', () => {
      it('should return correct contact properties', () => {
        expect(contactModel.id).toBe(1);
        expect(contactModel.email).toBe('test@example.com');
        expect(contactModel.phoneNumber).toBe('1234567890');
        expect(contactModel.linkedId).toBeNull();
        expect(contactModel.linkPrecedence).toBe('primary');
        expect(contactModel.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
        expect(contactModel.updatedAt).toEqual(new Date('2023-01-01T00:00:00Z'));
        expect(contactModel.deletedAt).toBeNull();
      });
    });

    describe('helper methods', () => {
      it('should correctly identify primary contact', () => {
        expect(contactModel.isPrimary()).toBe(true);
        expect(contactModel.isSecondary()).toBe(false);
      });

      it('should correctly identify secondary contact', () => {
        const secondaryContact = createMockSecondaryContact(1);
        const secondaryModel = new ContactModel(secondaryContact);

        expect(secondaryModel.isPrimary()).toBe(false);
        expect(secondaryModel.isSecondary()).toBe(true);
      });

      it('should correctly identify linked contact', () => {
        expect(contactModel.isLinked()).toBe(false);

        const linkedContact = createMockSecondaryContact(1);
        const linkedModel = new ContactModel(linkedContact);
        expect(linkedModel.isLinked()).toBe(true);
      });

      it('should correctly check for email presence', () => {
        expect(contactModel.hasEmail()).toBe(true);

        const noEmailContact = createMockContact({ email: null });
        const noEmailModel = new ContactModel(noEmailContact);
        expect(noEmailModel.hasEmail()).toBe(false);
      });

      it('should correctly check for phone number presence', () => {
        expect(contactModel.hasPhoneNumber()).toBe(true);

        const noPhoneContact = createMockContact({ phoneNumber: null });
        const noPhoneModel = new ContactModel(noPhoneContact);
        expect(noPhoneModel.hasPhoneNumber()).toBe(false);
      });

      it('should correctly match email', () => {
        expect(contactModel.matchesEmail('test@example.com')).toBe(true);
        expect(contactModel.matchesEmail('other@example.com')).toBe(false);
      });

      it('should correctly match phone number', () => {
        expect(contactModel.matchesPhoneNumber('1234567890')).toBe(true);
        expect(contactModel.matchesPhoneNumber('0987654321')).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return contact object', () => {
        const json = contactModel.toJSON();
        expect(json).toEqual(contact);
        expect(json).not.toBe(contact); // Should be a copy
      });
    });
  });

  describe('consolidateContacts', () => {
    it('should throw error for empty contact list', () => {
      expect(() => ContactModel.consolidateContacts([])).toThrow('Cannot consolidate empty contact list');
    });

    it('should consolidate single primary contact', () => {
      const primaryContact = createMockContact();
      const result = ContactModel.consolidateContacts([primaryContact]);

      expect(result).toEqual({
        primaryContactId: 1,
        emails: ['test@example.com'],
        phoneNumbers: ['1234567890'],
        secondaryContactIds: []
      });
    });

    it('should consolidate primary with secondary contacts', () => {
      const primaryContact = createMockContact({
        id: 1,
        email: 'primary@example.com',
        phoneNumber: '1111111111'
      });

      const secondaryContact1 = createMockSecondaryContact(1, {
        id: 2,
        email: 'secondary1@example.com',
        phoneNumber: '2222222222'
      });

      const secondaryContact2 = createMockSecondaryContact(1, {
        id: 3,
        email: 'secondary2@example.com',
        phoneNumber: '3333333333'
      });

      const contacts = [primaryContact, secondaryContact1, secondaryContact2];
      const result = ContactModel.consolidateContacts(contacts);

      expect(result).toEqual({
        primaryContactId: 1,
        emails: ['primary@example.com', 'secondary1@example.com', 'secondary2@example.com'],
        phoneNumbers: ['1111111111', '2222222222', '3333333333'],
        secondaryContactIds: [2, 3]
      });
    });

    it('should handle contacts with null email or phone', () => {
      const primaryContact = createMockContact({
        id: 1,
        email: 'primary@example.com',
        phoneNumber: null
      });

      const secondaryContact = createMockSecondaryContact(1, {
        id: 2,
        email: null,
        phoneNumber: '2222222222'
      });

      const contacts = [primaryContact, secondaryContact];
      const result = ContactModel.consolidateContacts(contacts);

      expect(result).toEqual({
        primaryContactId: 1,
        emails: ['primary@example.com'],
        phoneNumbers: ['2222222222'],
        secondaryContactIds: [2]
      });
    });

    it('should deduplicate emails and phone numbers', () => {
      const primaryContact = createMockContact({
        id: 1,
        email: 'same@example.com',
        phoneNumber: '1111111111'
      });

      const secondaryContact = createMockSecondaryContact(1, {
        id: 2,
        email: 'same@example.com',
        phoneNumber: '1111111111'
      });

      const contacts = [primaryContact, secondaryContact];
      const result = ContactModel.consolidateContacts(contacts);

      expect(result).toEqual({
        primaryContactId: 1,
        emails: ['same@example.com'],
        phoneNumbers: ['1111111111'],
        secondaryContactIds: [2]
      });
    });

    it('should prioritize primary contact email and phone in ordering', () => {
      const primaryContact = createMockContact({
        id: 1,
        email: 'primary@example.com',
        phoneNumber: '1111111111'
      });

      const secondaryContact = createMockSecondaryContact(1, {
        id: 2,
        email: 'aaaa@example.com', // Alphabetically first
        phoneNumber: '0000000000' // Numerically first
      });

      const contacts = [secondaryContact, primaryContact]; // Different order
      const result = ContactModel.consolidateContacts(contacts);

      expect(result.emails[0]).toBe('primary@example.com');
      expect(result.phoneNumbers[0]).toBe('1111111111');
    });
  });

  describe('validation schemas', () => {
    describe('IdentifyRequestSchema', () => {
      it('should validate valid request with both email and phone', () => {
        const validRequest = {
          email: 'test@example.com',
          phoneNumber: '1234567890'
        };

        const result = IdentifyRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it('should validate request with only email', () => {
        const validRequest = {
          email: 'test@example.com'
        };

        const result = IdentifyRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it('should validate request with only phone', () => {
        const validRequest = {
          phoneNumber: '1234567890'
        };

        const result = IdentifyRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it('should reject request with neither email nor phone', () => {
        const invalidRequest = {};

        const result = IdentifyRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });

      it('should reject request with invalid email', () => {
        const invalidRequest = {
          email: 'invalid-email'
        };

        const result = IdentifyRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });

      it('should reject request with empty phone number', () => {
        const invalidRequest = {
          phoneNumber: ''
        };

        const result = IdentifyRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });
    });

    describe('CreateContactSchema', () => {
      it('should validate valid contact creation data', () => {
        const validData = {
          email: 'test@example.com',
          phoneNumber: '1234567890',
          linkedId: 1,
          linkPrecedence: 'secondary' as const
        };

        const result = CreateContactSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate contact with minimal data', () => {
        const validData = {
          linkPrecedence: 'primary' as const
        };

        const result = CreateContactSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid link precedence', () => {
        const invalidData = {
          linkPrecedence: 'invalid'
        };

        const result = CreateContactSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });
}); 