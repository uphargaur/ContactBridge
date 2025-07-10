import { ContactService } from '../../src/services/contact.service';
import { IContactRepository } from '../../src/repositories/contact.repository.interface';
import { IdentifyRequest } from '../../src/types/contact.types';
import { createMockContact, createMockSecondaryContact } from '../setup';

describe('ContactService', () => {
  let contactService: ContactService;
  let mockContactRepository: jest.Mocked<IContactRepository>;

  beforeEach(() => {
    mockContactRepository = {
      findByEmailOrPhone: jest.fn(),
      findLinkedContacts: jest.fn(),
      findRelatedContacts: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findPotentialPrimaryContacts: jest.fn(),
      getContactChain: jest.fn(),
      batchUpdate: jest.fn(),
    };

    contactService = new ContactService(mockContactRepository);
  });

  describe('identify', () => {
    describe('when no existing contacts are found', () => {
      it('should create a new primary contact', async () => {
        const request: IdentifyRequest = {
          email: 'new@example.com',
          phoneNumber: '1234567890'
        };

        const newContact = createMockContact({
          email: 'new@example.com',
          phoneNumber: '1234567890'
        });

        mockContactRepository.findByEmailOrPhone.mockResolvedValue([]);
        mockContactRepository.create.mockResolvedValue(newContact);

        const result = await contactService.identify(request);

        expect(mockContactRepository.create).toHaveBeenCalledWith({
          email: 'new@example.com',
          phoneNumber: '1234567890',
          linkPrecedence: 'primary'
        });

        expect(result).toEqual({
          primaryContactId: 1,
          emails: ['new@example.com'],
          phoneNumbers: ['1234567890'],
          secondaryContactIds: []
        });
      });
    });

    describe('when existing contacts are found in single group', () => {
      it('should return consolidated contact without creating new secondary if exact match exists', async () => {
        const request: IdentifyRequest = {
          email: 'test@example.com',
          phoneNumber: '1234567890'
        };

        const primaryContact = createMockContact();
        const existingContacts = [primaryContact];

        mockContactRepository.findByEmailOrPhone.mockResolvedValue(existingContacts);
        mockContactRepository.findLinkedContacts.mockResolvedValue(existingContacts);

        const result = await contactService.identify(request);

        expect(mockContactRepository.create).not.toHaveBeenCalled();
        expect(result).toEqual({
          primaryContactId: 1,
          emails: ['test@example.com'],
          phoneNumbers: ['1234567890'],
          secondaryContactIds: []
        });
      });

      it('should create new secondary contact if new information is provided', async () => {
        const request: IdentifyRequest = {
          email: 'new@example.com',
          phoneNumber: '1234567890'
        };

        const primaryContact = createMockContact({
          email: 'existing@example.com',
          phoneNumber: '1234567890'
        });
        const existingContacts = [primaryContact];

        const newSecondary = createMockSecondaryContact(1, {
          email: 'new@example.com',
          phoneNumber: '1234567890'
        });

        mockContactRepository.findByEmailOrPhone.mockResolvedValue(existingContacts);
        mockContactRepository.findLinkedContacts.mockResolvedValue(existingContacts);
        mockContactRepository.create.mockResolvedValue(newSecondary);

        const result = await contactService.identify(request);

        expect(mockContactRepository.create).toHaveBeenCalledWith({
          email: 'new@example.com',
          phoneNumber: '1234567890',
          linkedId: 1,
          linkPrecedence: 'secondary'
        });

        expect(result).toEqual({
          primaryContactId: 1,
          emails: ['existing@example.com', 'new@example.com'],
          phoneNumbers: ['1234567890'],
          secondaryContactIds: [2]
        });
      });
    });

    describe('when existing contacts are found in multiple groups', () => {
      it('should merge groups and convert newer primary to secondary', async () => {
        const request: IdentifyRequest = {
          email: 'george@hillvalley.edu',
          phoneNumber: '717171'
        };

        // Two separate primary contacts that will be linked
        const primary1 = createMockContact({
          id: 11,
          email: 'george@hillvalley.edu',
          phoneNumber: '919191',
          createdAt: new Date('2023-04-11T00:00:00Z')
        });

        const primary2 = createMockContact({
          id: 27,
          email: 'biffsucks@hillvalley.edu',
          phoneNumber: '717171',
          createdAt: new Date('2023-04-21T00:00:00Z')
        });

        const existingContacts = [primary1, primary2];

        // Mock the grouping behavior
        mockContactRepository.findByEmailOrPhone.mockResolvedValue(existingContacts);
        mockContactRepository.findLinkedContacts
          .mockResolvedValueOnce([primary1]) // First group
          .mockResolvedValueOnce([primary2]); // Second group

        mockContactRepository.batchUpdate.mockResolvedValue([{
          ...primary2,
          linkedId: 11,
          linkPrecedence: 'secondary' as const,
          updatedAt: new Date()
        }]);

        const result = await contactService.identify(request);

        expect(mockContactRepository.batchUpdate).toHaveBeenCalledWith([{
          id: 27,
          data: {
            linkedId: 11,
            linkPrecedence: 'secondary',
            updatedAt: expect.any(Date)
          }
        }]);

        expect(result).toEqual({
          primaryContactId: 11,
          emails: ['george@hillvalley.edu', 'biffsucks@hillvalley.edu'],
          phoneNumbers: ['919191', '717171'],
          secondaryContactIds: [27]
        });
      });
    });

    describe('edge cases', () => {
      it('should handle only email provided', async () => {
        const request: IdentifyRequest = {
          email: 'test@example.com'
        };

        const primaryContact = createMockContact({
          phoneNumber: null
        });

        mockContactRepository.findByEmailOrPhone.mockResolvedValue([primaryContact]);
        mockContactRepository.findLinkedContacts.mockResolvedValue([primaryContact]);

        const result = await contactService.identify(request);

        expect(result).toEqual({
          primaryContactId: 1,
          emails: ['test@example.com'],
          phoneNumbers: [],
          secondaryContactIds: []
        });
      });

      it('should handle only phone number provided', async () => {
        const request: IdentifyRequest = {
          phoneNumber: '1234567890'
        };

        const primaryContact = createMockContact({
          email: null
        });

        mockContactRepository.findByEmailOrPhone.mockResolvedValue([primaryContact]);
        mockContactRepository.findLinkedContacts.mockResolvedValue([primaryContact]);

        const result = await contactService.identify(request);

        expect(result).toEqual({
          primaryContactId: 1,
          emails: [],
          phoneNumbers: ['1234567890'],
          secondaryContactIds: []
        });
      });
    });
  });

  describe('getContactById', () => {
    it('should return contact if found', async () => {
      const contact = createMockContact();
      mockContactRepository.findById.mockResolvedValue(contact);

      const result = await contactService.getContactById(1);

      expect(mockContactRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(contact);
    });

    it('should return null if contact not found', async () => {
      mockContactRepository.findById.mockResolvedValue(null);

      const result = await contactService.getContactById(999);

      expect(result).toBeNull();
    });
  });

  describe('getContactChain', () => {
    it('should return consolidated contact chain', async () => {
      const primaryContact = createMockContact();
      const secondaryContact = createMockSecondaryContact(1);
      const contacts = [primaryContact, secondaryContact];

      mockContactRepository.getContactChain.mockResolvedValue(contacts);

      const result = await contactService.getContactChain(1);

      expect(result).toEqual({
        primaryContactId: 1,
        emails: ['test@example.com', 'secondary@example.com'],
        phoneNumbers: ['1234567890', '0987654321'],
        secondaryContactIds: [2]
      });
    });

    it('should return null if no contacts found', async () => {
      mockContactRepository.getContactChain.mockResolvedValue([]);

      const result = await contactService.getContactChain(999);

      expect(result).toBeNull();
    });
  });

  describe('shouldCreateNewSecondary (private method behavior)', () => {
    it('should not create secondary when no new information provided', async () => {
      const request: IdentifyRequest = {
        email: 'test@example.com',
        phoneNumber: '1234567890'
      };

      const existingContact = createMockContact();
      mockContactRepository.findByEmailOrPhone.mockResolvedValue([existingContact]);
      mockContactRepository.findLinkedContacts.mockResolvedValue([existingContact]);

      const result = await contactService.identify(request);

      expect(mockContactRepository.create).not.toHaveBeenCalled();
      expect(result.secondaryContactIds).toEqual([]);
    });

    it('should create secondary when new email is provided', async () => {
      const request: IdentifyRequest = {
        email: 'newemail@example.com',
        phoneNumber: '1234567890'
      };

      const existingContact = createMockContact({
        email: 'oldemail@example.com'
      });
      const newSecondary = createMockSecondaryContact(1, {
        email: 'newemail@example.com'
      });

      mockContactRepository.findByEmailOrPhone.mockResolvedValue([existingContact]);
      mockContactRepository.findLinkedContacts.mockResolvedValue([existingContact]);
      mockContactRepository.create.mockResolvedValue(newSecondary);

      const result = await contactService.identify(request);

      expect(mockContactRepository.create).toHaveBeenCalled();
      expect(result.secondaryContactIds).toContain(2);
    });
  });
}); 