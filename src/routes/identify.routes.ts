import { Router } from 'express';
import { IdentifyController } from '../controllers/identify.controller';
import { ContactService } from '../services/contact.service';
import { ContactRepository } from '../repositories/contact.repository';
import DatabaseConnection from '../config/database';

const router = Router();

// Initialize dependencies
const dbConnection = DatabaseConnection.getInstance();
const prismaClient = dbConnection.getClient();
const contactRepository = new ContactRepository(prismaClient);
const contactService = new ContactService(contactRepository);
const identifyController = new IdentifyController(contactService);

// Routes
router.post('/identify', identifyController.identify);
router.get('/health', identifyController.health);
router.get('/contacts/:id/chain', identifyController.getContactChain);

export default router; 