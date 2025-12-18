//Shape of the data stored in DB
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Contacts } from './contacts'
// import { Contacts } from './contacts'

@Entity('sos')
export class Sos {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userId: string

    @Column('float')
    latitude: number

    @Column('float')
    longitude: number

    @Column({ nullable: true })
    address: string

    // @Column({ nullable: true })
    // message: string

    @Column()
    createdAt: Date;

}