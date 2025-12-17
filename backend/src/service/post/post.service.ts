import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import e from 'express';
import { PostDto } from 'src/dto/post.dto';
import { Post } from 'src/models/post';
import { Repository } from 'typeorm';
import { Likes } from 'src/models/likes';

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name)

    constructor(
        @InjectRepository(Post)
        private readonly postRepo: Repository<Post>,
        @InjectRepository(Likes)
        private readonly likesRepo: Repository<Likes>

    ) { }

    async createPost(data: PostDto) {
        try {
            if (data.anonymous) {
                data.userId = ''
            }

            data.createdAt = new Date()
            const post = this.postRepo.create(data)
            await this.postRepo.save(post)

            return { success: true, message: 'Post added successfully' }
        } catch (err) {
            this.logger.error('Post adding failed', err)
            throw err
        }
    }

    async getPosts() {
        try {
            const posts = await this.postRepo.find({
                order: { createdAt: 'DESC' },
            });

            return { success: true, data: posts };
        } catch (err) {
            console.error('error getting posts:', err);
            throw err;
        }
    }


    async toggleLike(postId: number, userId: string) {  // Changed to string
        try {
            console.log('Toggle like called with:', { postId, userId });

            if (!postId || !userId) {
                return {
                    success: false,
                    message: 'Invalid postId or userId'
                };
            }
            const post = await this.postRepo.findOne({
                where: { id: postId }
            });

            if (!post) {
                console.log('Post not found:', postId);
                return { success: false, message: 'Post not found' };
            }

            // Check if user already liked the post
            const existingLike = await this.likesRepo.findOne({
                where: {
                    postId: postId,
                    userId: userId  // Simple string comparison now
                }
            });
            console.log('Existing like:', existingLike);

            if (existingLike) {
                // Unlike: remove the like
                await this.likesRepo.remove(existingLike);
                post.likes = Math.max(0, post.likes - 1);
                await this.postRepo.save(post);

                return {
                    success: true,
                    liked: false,
                    likes: post.likes,
                    message: 'Post unliked'
                };
            } else {
                // Like: create new like
                const like = this.likesRepo.create({
                    postId: postId,
                    userId: userId  // Just pass the string directly
                });
                await this.likesRepo.save(like);

                post.likes = post.likes + 1;
                await this.postRepo.save(post);

                return {
                    success: true,
                    liked: true,
                    likes: post.likes,
                    message: 'Post liked'
                };
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            throw err;
        }
    }

    // Update this method too
    async hasUserLikedPost(postId: number, userId: string): Promise<boolean> {
        const like = await this.likesRepo.findOne({
            where: {
                postId: postId,
                userId: userId  // Simple string comparison
            }
        });
        return !!like;
    }

    async deletePost(postId: number, userId: string) {
        try {
            const post = await this.postRepo.findOne({ where: { id: postId ,userId:userId} });
            if (!post) {
                return { success: false, message: 'Post not found' };
            }
            await this.postRepo.remove(post);
            return { success: true, message: 'Post deleted successfully' };
        } catch (err) {
            this.logger.error('Post deletion failed', err);
            throw err;
        }
    }
}
