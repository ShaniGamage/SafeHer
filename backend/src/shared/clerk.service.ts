// clerk.service.ts
import { Injectable } from "@nestjs/common";
import { clerkClient } from '@clerk/clerk-sdk-node'

@Injectable()
export class ClerkService {

    async verifyToken(token: string) {
        // Verify the token and get session claims
        const payload = await clerkClient.verifyToken(token);
        return payload;
    }

    async getUser(userId: string) {
        return clerkClient.users.getUser(userId);
    }
}