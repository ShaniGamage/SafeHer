import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';

@Controller('reports')
export class ReportsController {
  
  // Test endpoint - no auth required
  @Get('test')
  async testEndpoint() {
    return { 
      message: 'Backend is working!',
      timestamp: new Date().toISOString()
    };
  }

  // Authenticated endpoint - any logged in user
  @UseGuards(AuthGuard)
  @Get('all')
  async getAllReports(@Req() req) {
    return {
      message: 'Available to all authenticated users',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  // Admin only endpoint
  @UseGuards(AuthGuard, new RolesGuard('admin'))
  @Get('mine')
  async getMyReports(@Req() req) {
    return {
      message: 'You are authenticated as admin',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
}