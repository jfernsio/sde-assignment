import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

export const createDrill = async (req, res, next) => {
  try {
    const { shipId, title, description, scheduledDate } = req.body;

    // Validation
    if (!shipId || !title || !description || !scheduledDate) {
      throw new AppError('shipId, title, description, and scheduledDate are required', 400);
    }

    // Verify ship exists
    const ship = await prisma.ship.findUnique({
      where: { id: parseInt(shipId) }
    });

    if (!ship) {
      throw new AppError('Ship not found', 404);
    }

    const drill = await prisma.safetyDrill.create({
      data: {
        shipId: parseInt(shipId),
        title,
        description,
        scheduledDate: new Date(scheduledDate),
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
      message: 'Safety drill created successfully',
      drill
    });
  } catch (error) {
    next(error);
  }
};

export const getDrills = async (req, res, next) => {
  try {
    const { shipId, status } = req.query;
    const where = {};

    if (shipId) {
      where.shipId = parseInt(shipId);
    }

    if (status) {
      const validStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new AppError('Invalid status. Must be SCHEDULED, COMPLETED, or CANCELLED', 400);
      }
      where.status = status.toUpperCase();
    }

    const drills = await prisma.safetyDrill.findMany({
      where,
      include: {
        ship: true,
        creator: {
          select: { id: true, email: true }
        },
        _count: {
          select: { attendance: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      total: drills.length,
      drills
    });
  } catch (error) {
    next(error);
  }
};

export const getDrill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const drill = await prisma.safetyDrill.findUnique({
      where: { id: parseInt(id) },
      include: {
        ship: true,
        creator: {
          select: { id: true, email: true }
        },
        attendance: {
          include: {
            crew: {
              select: { id: true, email: true }
            }
          }
        }
      }
    });

    if (!drill) {
      throw new AppError('Safety drill not found', 404);
    }

    res.status(200).json(drill);
  } catch (error) {
    next(error);
  }
};

export const recordAttendance = async (req, res, next) => {
  try {
    const { drillId } = req.params;
    //get crew id from user token
    const  crewId  =  req.user.id;
    const { attended } = req.body;

    if (!crewId || attended === undefined) {
      throw new AppError('crewId and attended are required', 400);
    }

    // Verify drill exists
    const drill = await prisma.safetyDrill.findUnique({
      where: { id: parseInt(drillId) }
    });

    if (!drill) {
      throw new AppError('Safety drill not found', 404);
    }

    // Verify crew exists
    const crew = await prisma.user.findUnique({
      where: { id: parseInt(crewId) }
    });

    if (!crew) {
      throw new AppError('Crew member not found', 404);
    }

    // Check if attendance already exists
    const existingAttendance = await prisma.drillAttendance.findUnique({
      where: {
        drillId_crewId: {
          drillId: parseInt(drillId),
          crewId: parseInt(crewId)
        }
      }
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance
      attendance = await prisma.drillAttendance.update({
        where: {
          drillId_crewId: {
            drillId: parseInt(drillId),
            crewId: parseInt(crewId)
          }
        },
        data: { attended: Boolean(attended) },
        include: {
          crew: {
            select: { id: true, email: true }
          },
          drill: {
            select: { id: true, title: true }
          }
        }
      });
    } else {
      // Create new attendance
      attendance = await prisma.drillAttendance.create({
        data: {
          drillId: parseInt(drillId),
          crewId: parseInt(crewId),
          attended: Boolean(attended)
        },
        include: {
          crew: {
            select: { id: true, email: true }
          },
          drill: {
            select: { id: true, title: true }
          }
        }
      });
    }

    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req, res, next) => {
  try {
    const { drillId } = req.params;

    // Verify drill exists
    const drill = await prisma.safetyDrill.findUnique({
      where: { id: parseInt(drillId) }
    });

    if (!drill) {
      throw new AppError('Safety drill not found', 404);
    }

    const attendance = await prisma.drillAttendance.findMany({
      where: { drillId: parseInt(drillId) },
      include: {
        crew: {
          select: { id: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attended = attendance.filter(a => a.attended).length;
    const total = attendance.length;

    res.status(200).json({
      drillId: parseInt(drillId),
      total,
      attended,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDrill = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify drill exists
    const existingDrill = await prisma.safetyDrill.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDrill) {
      throw new AppError('Safety drill not found', 404);
    }

    // Delete attendance records first (cascade)
    await prisma.drillAttendance.deleteMany({
      where: { drillId: parseInt(id) }
    });

    await prisma.safetyDrill.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: 'Safety drill deleted successfully',
      id: parseInt(id)
    });
  } catch (error) {
    next(error);
  }
};
