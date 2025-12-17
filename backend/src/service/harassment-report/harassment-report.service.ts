import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HarassmentReportDto } from 'src/dto/harassment-report.dto';
import { HarassmentReport } from 'src/models/harassment-report';
import { Repository } from 'typeorm';

@Injectable()
export class HarassmentReportService {
    private readonly logger = new Logger(HarassmentReportService.name)

    constructor(
        @InjectRepository(HarassmentReport)
        private readonly harassmentReportRepo: Repository<HarassmentReport>
    ) { }

    async saveHarassmentReport(data: HarassmentReportDto) {
        try {
            // if anonymous then no userId
            if (data.anonymous) {
                data.userId = ''
            }
            data.createdAt = new Date()
            const harassmentReport = this.harassmentReportRepo.create(data);
            await this.harassmentReportRepo.save(harassmentReport)

            return { success: true, message: 'Report saved successfully' }

        } catch (error) {
            this.logger.error('Harassment report saving failed', error)
            throw error
        }
    }

    async getReports(vehicleNo: string) {
        try {
            if (!vehicleNo) {
                throw new BadRequestException('Vehicle no is required')
            }

            const reports = await this.harassmentReportRepo.find({
                where: {
                    vehicleNumber: vehicleNo
                }
            })
            return reports

        } catch (e) {
            console.error(e)
            throw new InternalServerErrorException('Something went wrong')
        }
    }

    async getReportsByUserId(user_id: string) {
        try {
            if (!user_id) {
                throw new BadRequestException('userId is required')
            }
            const reports = await this.harassmentReportRepo.find({
                where: {
                    userId: user_id
                }
            })
            return reports

        } catch (e) {
            console.error(e)
            throw new InternalServerErrorException('Something went wrong')
        }
    }

    async editReport(data: HarassmentReportDto){
        try{
            const report = await this.harassmentReportRepo.findOne({
                where:
                {
                    id: data.id,
                    userId: data.userId
                }
            })
            if(!report){
                return { success: true, message:'report not found'}
            }
            Object.assign(report,data)
            await this.harassmentReportRepo.save(report)
            return {success: true, message:'report updated successfully'}
        } catch(err){
            console.log(err)
            return{ success:false, message: 'something went wrong'}
        }
    }

    async deleteReport(reportId: number, userId: string) {
        try {
            const report = await this.harassmentReportRepo.findOne({ where: { id: reportId, userId: userId } });
            if (!report) {
                return { success: false, message: 'report not found' };
            }
            await this.harassmentReportRepo.remove(report);
            return { success: true, message: 'Report deleted successfully' };
        } catch (err) {
            this.logger.error('Report deletion failed', err);
            throw err;
        }
    }
}
