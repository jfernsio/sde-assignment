import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

export const createMaintenanceTask = async (req, res, next) => {
  try {
    const { shipId, title, description, dueDate } = req.body;

    // Validation
    if (!shipId || !title || !description || !dueDate) {
      throw new AppError('shipId, title, description, and dueDate are required', 400);
    }

    // Verify ship exists
    const ship = await prisma.ship.findUnique({
      where: { id: parseInt(shipId) }
    });

    if (!ship) {
      throw new AppError('Ship not found', 404);
    }

    // Validate due date is in future
    const dueDateObj = new Date(dueDate);
    if (dueDateObj < new Date()) {
      throw new AppError('Due date must be in the future', 400);
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        shipId: parseInt(shipId),
        title,
        description,
        dueDate: dueDateObj,
        createdBy: req.user.id
      },
      include: {
        ship: true,
        creator: {
          select: { id: true, email: true }
        }
      }
    });

    res.status(201).json({
      message: 'Maintenance task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceTasks = async (req, res, next) => {
  try {
    const { shipId, status } = req.query;
    const where = {};

    if (shipId) {
      where.shipId = parseInt(shipId);
    }

    if (status) {
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new AppError('Invalid status. Must be PENDING, IN_PROGRESS, or COMPLETED', 400);
      }
      where.status = status.toUpperCase();
    }

    const tasks = await prisma.maintenanceTask.findMany({
      where,
      include: {
        ship: true,
        creator: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      total: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.maintenanceTask.findUnique({
      where: { id: parseInt(id) },
      include: {
        ship: true,
        creator: {
          select: { id: true, email: true }
        }
      }
    });

    if (!task) {
      throw new AppError('Maintenance task not found', 404);
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new AppError('Invalid status. Must be PENDING, IN_PROGRESS, or COMPLETED', 400);
    }

    // Verify task exists
    const existingTask = await prisma.maintenanceTask.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTask) {
      throw new AppError('Maintenance task not found', 404);
    }

    const updateData = {
      status: status.toUpperCase()
    };

    // Set completedDate if status is COMPLETED
    if (status.toUpperCase() === 'COMPLETED') {
      updateData.completedDate = new Date();
    } else {
      updateData.completedDate = null;
    }

    const task = await prisma.maintenanceTask.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        ship: true,
        creator: {
          select: { id: true, email: true }
        }
      }
    });

    res.status(200).json({
      message: 'Maintenance task updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMaintenanceTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify task exists
    const existingTask = await prisma.maintenanceTask.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTask) {
      throw new AppError('Maintenance task not found', 404);
    }

    await prisma.maintenanceTask.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: 'Maintenance task deleted successfully',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};
