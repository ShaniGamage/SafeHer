import { Post } from "src/models/post";
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, Column, JoinColumn } from "typeorm";

@Entity('likes')
@Unique(['userId', 'postId']) // This ensures one like per user per post
export class Likes {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()  // Store userId as a string (from Clerk)
    userId: string;  // Changed from ManyToOne to Column


    @Column()
    postId: number;
    
    @ManyToOne(() => Post, post => post.likesRelation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Post;

    @CreateDateColumn()
    createdAt: Date;
}