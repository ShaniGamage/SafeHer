import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";

@Entity('contacts')
export class Contacts {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string

    @Column()
    name: string;

    @Column()
    phoneNumber: string;
}