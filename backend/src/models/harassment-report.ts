//Shape of the data stored in DB
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class HarassmentReport {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    userId: string

    @Column()
    location: string

    @Column('float')
    latitude: number

    @Column('float')
    longitude: number

    @Column({nullable:true})
    vehicleNumber: string

    @Column({nullable:true})
    vehicleType: string

    @Column({nullable:true})
    vehicleColor: string

    @Column({nullable:true})
    vehicleModel: string

    @Column({nullable:true})
    harassmentType: string

    @Column({nullable:true})
    extraInfo: string

    @Column('boolean')
    anonymous: boolean

    @Column({nullable:true})
    image: string

    @Column()
    createdAt: Date

    // @Column({ nullable: true })
    // message: string

}