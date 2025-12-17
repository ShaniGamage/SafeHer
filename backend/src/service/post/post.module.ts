import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'src/models/post';
import { Likes } from 'src/models/likes';

@Module({
  imports: [TypeOrmModule.forFeature([Post,Likes])],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService]
})
export class PostModule {}
