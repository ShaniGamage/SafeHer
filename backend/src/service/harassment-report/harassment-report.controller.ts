import { Body, Controller, Delete, Get, Logger, Post, Put, Query, Req } from '@nestjs/common';
import { HarassmentReportDto } from 'src/dto/harassment-report.dto';
import { HarassmentReportService } from './harassment-report.service';

@Controller('report-harassment')
export class HarassmentReportController {
    private readonly logger = new Logger(HarassmentReportController.name)

    constructor(private harassmentReportService: HarassmentReportService) { }

    @Post('')
    async createHarassmentReport(@Body() body: HarassmentReportDto) {
        console.log('harassment report endpoint hit')
        this.logger.log('received payload:', JSON.stringify(body))

        try {
            const result = await this.harassmentReportService.saveHarassmentReport(body)
            console.log('Harassment report saved successfully')
            return result
        } catch (error) {
            console.error('report saving failed', error)
            throw error
        }
    }

    @Get()
    async getReports(@Query('vehicleNo') vehicleNo: string) {
        if (!vehicleNo) {
            return { message: "Vehicle number is required" }
        }

        const results = await this.harassmentReportService.getReports(vehicleNo)
        return results
    }

    @Get('user')
    async getReportsByUserId(@Query('userId') userId: string) {
        try {
            if (!userId) {
                return { message: "userId is required" }
            }
            const results = await this.harassmentReportService.getReportsByUserId(userId)
            return results
        } catch (err) {
            console.error('report saving failed', err)
            throw err
        }
    }

    @Put('')
    async editReport(@Body() body: HarassmentReportDto) {
        console.log('report editing endpoint hit')
        try {
           const result = await this.harassmentReportService.editReport(body)
           return result
        }catch(err){
             console.error('Error updating report',err)
             throw err  
        }
    }

    @Delete(':reportId/user/:userId')
    async deleteReport(
        @Req() req,
    ) {
        console.log('Delete report endipoint hit with params:', req.params)
        try {
            const reportId = parseInt(req.params.reportId);
            const userId = req.params.userId;
            const result = await this.harassmentReportService.deleteReport(reportId, userId);
            console.log('Delete report successfully:', result)
            return result;
        } catch (err) {
            throw err;
        }
    }
}
