import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject 
} from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('ADMIN', 'PROJECT_MANAGER'), createProject);
router.put('/:id', authorize('ADMIN', 'PROJECT_MANAGER'), updateProject);
router.delete('/:id', authorize('ADMIN'), deleteProject);

export default router;
