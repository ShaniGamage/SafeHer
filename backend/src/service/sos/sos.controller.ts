import { Body, Controller, Post, UseGuards, Logger, Query, Get, Delete, Req } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { SosDto } from 'src/dto/sos.dto';
import { SosService } from './sos.service';
import { ContactsDto } from 'src/dto/contacts';

@Controller('sos')
export class SosController {
    private readonly logger = new Logger(SosController.name);

    constructor(private sosService: SosService) { }

    @Post('')
    async createSOS(@Body() body: SosDto) {
        console.log('SOS endpoint hit');
        this.logger.log('Received payload:', JSON.stringify(body));

        try {
            const result = await this.sosService.handleSOS(body);
            this.logger.log('SOS handled successfully');
            return result;
        } catch (error) {
            this.logger.error('SOS handling failed:', error);
            throw error;
        }
    }

    @Post('contacts')
    async addSosContacts(@Body() body: ContactsDto) {
        console.log('contact adding endpoint hit')
        try {
            const result = await this.sosService.addSosContact(body)
            return result
        } catch (error) {
            throw error
        }

    }

    @Get('contacts')
    async getContacts(@Query('userId') user_id: string) {
        if (!user_id) {
            return { message: "userId is required" }
        }

        const results = await this.sosService.getContactsByUserId(user_id)
        return results
    }

    @Delete('contacts/:contactId/user/:userId')
        async deletePost(
            @Req() req,
        ) {
    
            console.log('Remove contact endipoint hit with params:',req.params)
            try {
                const contactId = parseInt(req.params.contactId);
                const userId = req.params.userId;
                const result = await this.sosService.removeContact(contactId, userId);
                console.log('Remove contact successfully:',result)
                return result;
            } catch (err) {
                throw err;
            }
        }
}
