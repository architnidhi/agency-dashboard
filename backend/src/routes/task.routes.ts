import { Router } from 'express';
import { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  updateTaskStatus 
} from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('ADMIN', 'PROJECT_MANAGER'), createTask);
router.put('/:id', authorize('ADMIN', 'PROJECT_MANAGER'), updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', authorize('ADMIN'), deleteTask);

export default router;
