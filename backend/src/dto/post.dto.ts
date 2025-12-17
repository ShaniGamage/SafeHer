export class PostDto {
    userId?: string;
    postType:string;
    likes?: number;
    description:string;
    anonymous?: boolean;
    image?: string;
    createdAt:Date;

}
