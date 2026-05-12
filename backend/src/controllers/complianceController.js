import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// Helper function to calculate compliance score
const calculateComplianceScore = (completionRate, attendanceRate) => {
  return (completionRate * 50) + (attendanceRate * 50);
};

// Helper function to determine status
const getComplianceStatus = (score) => {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'At Risk';
};

export const getShipCompliance = async (req, res, next) => {
  try {
    const { shipId } = req.params;

    // Verify ship exists
    const ship = await prisma.ship.findUnique({
      where: { id: parseInt(shipId) }
    });

    if (!ship) {
      throw new AppError('Ship not found', 404);
    }

    // Get maintenance tasks for this ship
    const maintenanceTasks = await prisma.maintenanceTask.findMany({
      where: { shipId: parseInt(shipId) }
    });

    // Get safety drills for this ship
    const safetyDrills = await prisma.safetyDrill.findMany({
      where: { shipId: parseInt(shipId) },
      include: {
        attendance: true
      }
    });

    // Calculate maintenance completion rate
    let completionRate = 0;
    if (maintenanceTasks.length > 0) {
      const completedTasks = maintenanceTasks.filter(t => t.status === 'COMPLETED').length;
      completionRate = completedTasks / maintenanceTasks.length;
    }

    // Calculate drill attendance rate
    let attendanceRate = 0;
    let totalAttendanceRecords = 0;
    let attendedCount = 0;

    safetyDrills.forEach(drill => {
      drill.attendance.forEach(record => {
        totalAttendanceRecords++;
        if (record.attended) {
          attendedCount++;
        }
      });
    });

    if (totalAttendanceRecords > 0) {
      attendanceRate = attendedCount / totalAttendanceRecords;
    }

    // Calculate overall score
    const score = calculateComplianceScore(completionRate, attendanceRate);
    const status = getComplianceStatus(score);

    res.status(200).json({
      shipId: parseInt(shipId),
      shipName: ship.name,
      maintenanceMetrics: {
        total: maintenanceTasks.length,
        completed: maintenanceTasks.filter(t => t.status === 'COMPLETED').length,
        inProgress: maintenanceTasks.filter(t => t.status === 'IN_PROGRESS').length,
        pending: maintenanceTasks.filter(t => t.status === 'PENDING').length,
        completionRate: (completionRate * 100).toFixed(2) + '%'
      },
      drillMetrics: {
        totalDrills: safetyDrills.length,
        scheduledDrills: safetyDrills.filter(d => d.status === 'SCHEDULED').length,
        completedDrills: safetyDrills.filter(d => d.status === 'COMPLETED').length,
        cancelledDrills: safetyDrills.filter(d => d.status === 'CANCELLED').length,
        totalAttendanceRecords,
        attended: attendedCount,
        attendanceRate: (attendanceRate * 100).toFixed(2) + '%'
      },
      complianceScore: score.toFixed(2),
      complianceStatus: status
    });
  } catch (error) {
    next(error);
  }
};

export const getComplianceDashboard = async (req, res, next) => {
  try {
    // Get all ships
    const ships = await prisma.ship.findMany({
      include: {
        maintenanceTasks: true,
        safetyDrills: {
          include: {
            attendance: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const complianceData = ships.map(ship => {
      // Calculate maintenance completion rate
      let completionRate = 0;
      if (ship.maintenanceTasks.length > 0) {
        const completedTasks = ship.maintenanceTasks.filter(t => t.status === 'COMPLETED').length;
        completionRate = completedTasks / ship.maintenanceTasks.length;
      }

      // Calculate drill attendance rate
      let attendanceRate = 0;
      let totalAttendanceRecords = 0;
      let attendedCount = 0;

      ship.safetyDrills.forEach(drill => {
        drill.attendance.forEach(record => {
          totalAttendanceRecords++;
          if (record.attended) {
            attendedCount++;
          }
        });
      });

      if (totalAttendanceRecords > 0) {
        attendanceRate = attendedCount / totalAttendanceRecords;
      }

      // Calculate overall score
      const score = calculateComplianceScore(completionRate, attendanceRate);
      const status = getComplianceStatus(score);

      return {
        shipId: ship.id,
        shipName: ship.name,
        maintenanceMetrics: {
          total: ship.maintenanceTasks.length,
          completed: ship.maintenanceTasks.filter(t => t.status === 'COMPLETED').length,
          inProgress: ship.maintenanceTasks.filter(t => t.status === 'IN_PROGRESS').length,
          pending: ship.maintenanceTasks.filter(t => t.status === 'PENDING').length,
          completionRate: (completionRate * 100).toFixed(2) + '%'
        },
        drillMetrics: {
          totalDrills: ship.safetyDrills.length,
          scheduledDrills: ship.safetyDrills.filter(d => d.status === 'SCHEDULED').length,
          completedDrills: ship.safetyDrills.filter(d => d.status === 'COMPLETED').length,
          cancelledDrills: ship.safetyDrills.filter(d => d.status === 'CANCELLED').length,
          totalAttendanceRecords,
          attended: attendedCount,
          attendanceRate: (attendanceRate * 100).toFixed(2) + '%'
        },
        complianceScore: score.toFixed(2),
        complianceStatus: status
      };
    });

    // Sort by compliance score (at risk first)
    complianceData.sort((a, b) => parseFloat(a.complianceScore) - parseFloat(b.complianceScore));

    res.status(200).json({
      totalShips: ships.length,
      complianceData,
      summary: {
        goodCount: complianceData.filter(d => d.complianceStatus === 'Good').length,
        fairCount: complianceData.filter(d => d.complianceStatus === 'Fair').length,
        atRiskCount: complianceData.filter(d => d.complianceStatus === 'At Risk').length
      }
    });
  } catch (error) {
    next(error);
  }
};
