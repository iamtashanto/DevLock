import { ProjectModel, LicenseModel } from '@devlock/database';
import mongoose from 'mongoose';

export class AnalyticsService {
  async getOverview(orgId: string) {
    const totalProjects = await ProjectModel.countDocuments({ tenantId: orgId });
    
    // Aggregation for licenses
    const licenseStats = await LicenseModel.aggregate([
      { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
      {
        $group: {
          _id: null,
          totalLicenses: { $sum: 1 },
          activeLicenses: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          expiredLicenses: { 
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } 
          },
          suspendedLicenses: { 
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } 
          },
          totalValidations: { $sum: '$totalValidations' },
          activeDevices: { $sum: { $size: { $ifNull: ['$activations', []] } } }
        }
      }
    ]);

    const stats = licenseStats[0] || {
      totalLicenses: 0,
      activeLicenses: 0,
      expiredLicenses: 0,
      suspendedLicenses: 0,
      totalValidations: 0,
      activeDevices: 0
    };

    // Note: To calculate validationsToday we'd need a separate timeseries or audit log.
    // For now, returning 0 as a placeholder since validations are just a counter on the license.
    return {
      totalProjects,
      totalLicenses: stats.totalLicenses,
      activeLicenses: stats.activeLicenses,
      expiredLicenses: stats.expiredLicenses,
      suspendedLicenses: stats.suspendedLicenses,
      totalValidations: stats.totalValidations,
      validationsToday: 0,
      activeDevices: stats.activeDevices,
    };
  }

  async getLicenseStats(orgId: string, projectId?: string) {
    const matchQuery: any = { orgId: new mongoose.Types.ObjectId(orgId) };
    if (projectId) {
      matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const [statusStats, typeStats] = await Promise.all([
      LicenseModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      LicenseModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const byStatus: Record<string, number> = {};
    for (const stat of statusStats) {
      byStatus[stat._id || 'unknown'] = stat.count;
    }

    const byType: Record<string, number> = {};
    for (const stat of typeStats) {
      byType[stat._id || 'unknown'] = stat.count;
    }

    // Getting licenses expiring this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const expiringThisMonth = await LicenseModel.countDocuments({
      ...matchQuery,
      expiresAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    return {
      byStatus,
      byType,
      createdOverTime: [], // Time series mock since it's complex to map cleanly from purely Mongo without timeseries
      expiringThisMonth,
    };
  }
}
