import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { socketService } from '../server';

const prisma = new PrismaClient();

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    let where = {};

    if (req.user?.role === 'DEVELOPER') {
      where = { assignedToId: req.user.id };
    } else if (req.user?.role === 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: { managerId: req.user.id },
        select: { id: true },
      });
      where = { projectId: { in: projects.map(p => p.id) } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        assignedTo: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignedTo: true,
        updates: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, projectId, assignedToId, priority, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assignedToId,
        priority,
        dueDate: new Date(dueDate),
        createdById: req.user!.id,
      },
      include: {
        project: true,
        assignedTo: true,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        projectId,
        taskId: task.id,
        action: 'created task',
        details: { taskTitle: title },
      },
    });

    // Create notification for assigned developer
    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned: ${title}`,
          data: { taskId: task.id },
        },
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { title, description, priority, dueDate: dueDate ? new Date(dueDate) : undefined },
    });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = task.status;

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
      include: { assignedTo: true },
    });

    // Create task update record
    await prisma.taskUpdate.create({
      data: {
        taskId: id,
        userId: req.user!.id,
        oldStatus,
        newStatus: status,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        projectId: task.projectId,
        taskId: id,
        action: `changed status from ${oldStatus} to ${status}`,
        details: { oldStatus, newStatus: status },
      },
    });

    // Notify via WebSocket
    if (socketService) {
      socketService.emitTaskUpdate(updated, task.projectId, oldStatus);
    }

    // Create notification if task is in review
    if (status === 'IN_REVIEW') {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { manager: true },
      });

      if (project?.manager) {
        await prisma.notification.create({
          data: {
            userId: project.manager.id,
            type: 'TASK_IN_REVIEW',
            title: 'Task In Review',
            message: `Task "${task.title}" is ready for review`,
            data: { taskId: id },
          },
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
