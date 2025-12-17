import { Body, Controller, Delete, Get, Post, Put, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { PostDto } from 'src/dto/post.dto';

@Controller('post')
export class PostController {
    constructor(private postService: PostService) { }

    @Post('')
    async createPost(@Body() body: PostDto) {
        console.log('post creating endpoint hit')
        try {
            const result = await this.postService.createPost(body)
            return result
        } catch (error) {
            throw error
        }

    }

    @Get()
    async getHeapCodeStatistics() {
        try {
            const result = await this.postService.getPosts()
            return result
        } catch (err) {
            throw err
        }
    }

    @Post('like')
    async toggleLike(
        @Body() body: { postId: number, userId: string },
    ) {
        console.log('Toggle like endpoint hit with body:', body);
        try {
            if (!body.postId || !body.userId) {
                return {
                    success: false,
                    message: 'postId and userId are required'
                };
            }

            const result = await this.postService.toggleLike(body.postId, body.userId);
            return result;
        } catch (err) {
            console.error('Error in toggleLike controller:', err);
            return {
                success: false,
                message: 'Internal server error',
                error: err.message
            };
        }
    }

    @Delete(':postId/user/:userId')
    async deletePost(
        @Req() req,
    ) {

        console.log('Delete post endipoint hit with params:',req.params)
        try {
            const postId = parseInt(req.params.postId);
            const userId = req.params.userId;
            const result = await this.postService.deletePost(postId, userId);
            console.log('Delete post successfully:',result)
            return result;
        } catch (err) {
            throw err;
        }
    }
}
