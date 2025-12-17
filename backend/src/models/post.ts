//Shape of the data stored in DB
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Likes } from './likes'

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    userId: string

    @Column()
    postType: string

    @Column({default:0})
    likes: number

    @Column()
    description: string

    @Column('boolean')
    anonymous: boolean

    @Column({nullable:true})
    image: string

    @Column()
    createdAt: Date

    @OneToMany(() => Likes, (like) => like.post)
    likesRelation: Likes[]

}