import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportActivity, ReportType, ReportFormat } from '../entities/report-activity.entity';
import { CreateReportActivityDto } from './dto/create-report-activity.dto';

@Injectable()
export class ReportActivityService {
  private readonly logger = new Logger(ReportActivityService.name);

  constructor(
    @InjectRepository(ReportActivity)
    private reportActivityRepository: Repository<ReportActivity>,
  ) {}

  async create(createReportActivityDto: CreateReportActivityDto): Promise<ReportActivity> {
    const data = {
      ...createReportActivityDto,
      parameters: createReportActivityDto.parameters ? JSON.stringify(createReportActivityDto.parameters) : null,
    };
    const reportActivity = this.reportActivityRepository.create(data);
    const saved = await this.reportActivityRepository.save(reportActivity);
    // Parse JSON back for response
    if (saved.parameters) {
      try {
        saved.parameters = JSON.parse(saved.parameters);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    return saved;
  }

  async findRecent(companyId?: string, limit: number = 10): Promise<ReportActivity[]> {
    const query = this.reportActivityRepository.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.company', 'company')
      .orderBy('activity.createdAt', 'DESC')
      .take(limit);

    if (companyId) {
      query.where('activity.companyId = :companyId', { companyId });
    }

    const results = await query.getMany();
    // Parse JSON parameters
    return results.map(r => {
      if (r.parameters) {
        try {
          r.parameters = JSON.parse(r.parameters);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      return r;
    });
  }

  async findByUser(userId: string, limit: number = 10): Promise<ReportActivity[]> {
    return this.reportActivityRepository.find({
      where: { generatedByUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['company'],
    });
  }

  async findByType(reportType: ReportType, companyId?: string, limit: number = 10): Promise<ReportActivity[]> {
    const where: any = { reportType };
    if (companyId) {
      where.companyId = companyId;
    }

    return this.reportActivityRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['company'],
    });
  }

  async getStatistics(companyId?: string) {
    const query = this.reportActivityRepository.createQueryBuilder('activity');
    
    if (companyId) {
      query.where('activity.companyId = :companyId', { companyId });
    }

    const [total, successful, failed] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('activity.success = :success', { success: true }).getCount(),
      query.clone().andWhere('activity.success = :success', { success: false }).getCount(),
    ]);

    // Get counts by type
    const byType = await query
      .select('activity.reportType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('activity.reportType')
      .getRawMany();

    // Get counts by format
    const byFormat = await query
      .select('activity.format', 'format')
      .addSelect('COUNT(*)', 'count')
      .groupBy('activity.format')
      .getRawMany();

    return {
      total,
      successful,
      failed,
      byType: byType.reduce((acc, curr) => {
        acc[curr.type] = parseInt(curr.count);
        return acc;
      }, {}),
      byFormat: byFormat.reduce((acc, curr) => {
        acc[curr.format] = parseInt(curr.count);
        return acc;
      }, {}),
    };
  }

  async logReportGeneration(
    reportType: ReportType,
    reportName: string,
    format: ReportFormat,
    generatedBy: string,
    generatedByEmail?: string,
    generatedByUserId?: string,
    companyId?: string,
    parameters?: any,
    filePath?: string,
    fileSize?: number,
    recordCount?: number,
  ): Promise<ReportActivity> {
    try {
      const activity = await this.create({
        reportType,
        reportName,
        format,
        generatedBy,
        generatedByEmail,
        generatedByUserId,
        companyId,
        parameters: parameters ? JSON.stringify(parameters) : null,
        filePath,
        fileSize: fileSize || 0,
        recordCount: recordCount || 0,
        success: true,
      });

      this.logger.log(`Report activity logged: ${reportName} (${format}) by ${generatedBy}`);
      return activity;
    } catch (error) {
      this.logger.error('Failed to log report activity', error);
      throw error;
    }
  }

  async logReportError(
    reportType: ReportType,
    reportName: string,
    format: ReportFormat,
    generatedBy: string,
    errorMessage: string,
    generatedByEmail?: string,
    generatedByUserId?: string,
    companyId?: string,
  ): Promise<ReportActivity> {
    try {
      const activity = await this.create({
        reportType,
        reportName,
        format,
        generatedBy,
        generatedByEmail,
        generatedByUserId,
        companyId,
        success: false,
        errorMessage,
      });

      this.logger.error(`Report generation failed: ${reportName} - ${errorMessage}`);
      return activity;
    } catch (error) {
      this.logger.error('Failed to log report error', error);
      throw error;
    }
  }

  async deleteOldActivities(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.reportActivityRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Deleted report activities older than ${daysToKeep} days`);
  }
}