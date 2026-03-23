import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', authorize('ADMIN'), getUserById);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
