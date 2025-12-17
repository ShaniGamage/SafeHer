import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class AuthGuard implements CanActivate {
  private clerkClient: ReturnType<typeof createClerkClient>;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not defined');
    }
    
    this.clerkClient = createClerkClient({ secretKey });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Just pass the token - secretKey is already configured in clerkClient
      const verifiedToken = await this.clerkClient.verifyToken(token);
      const user = await this.clerkClient.users.getUser(verifiedToken.sub);
      
      request.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.publicMetadata?.role || 'user',
        metadata: user.publicMetadata,
      };

      console.log('User authenticated:', request.user.email, 'Role:', request.user.role);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// // canActivate is called to determine if a request should be allowed
// ExecutionContext – Provides access to the incoming request/response objects.
// UnauthorizedException – Exception thrown when authentication fails.
// ConfigService – Used to get environment variables 
// createClerkClient – Initializes a Clerk client for API calls.