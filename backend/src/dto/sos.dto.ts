export class SosDto {
    userId: string;
    latitude: number;
    longitude: number;
    address?: string;
    createdAt: Date;

}

// Defines what the API expects from the user
// Prevents bad data entering the system
// Shape of incoming data