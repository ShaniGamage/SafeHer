export class HarassmentReportDto {
    id:number;
    userId?: string;
    location:string;
    latitude: number;
    longitude: number;
    vehicleNumber?: string;
    vehicleType?: string;
    vehicleColor?: string;
    vehicleModel?: string;
    harassmentType: string;
    extraInfo?: string;
    anonymous?: boolean;
    image?: string;
    createdAt:Date;
}
