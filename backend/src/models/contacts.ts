import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Sos } from "./sos";

@Entity()
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