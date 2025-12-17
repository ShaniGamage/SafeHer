import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sos } from 'src/models/sos';
import axios from 'axios'
import { SosDto } from 'src/dto/sos.dto';
import { Contacts } from 'src/models/contacts';
import { ContactsDto } from 'src/dto/contacts';
import { phoneNumbers } from '@clerk/clerk-sdk-node';
import e from 'express';

@Injectable()
export class SosService {
    private readonly logger = new Logger(SosService.name);

    constructor(
        @InjectRepository(Sos)
        private sosRepo: Repository<Sos>,
        @InjectRepository(Contacts)
        private contactRepo: Repository<Contacts>
    ) { }

    async handleSOS(data: SosDto) {
        try {
            const sos = this.sosRepo.create(data);
            await this.sosRepo.save(sos);

            await this.notifyContacts(data);
            return { success: true, message: 'SOS sent successfully' };
        } catch (error) {
            this.logger.error('SOS handling failed:', error);
            throw error;
        }
    }

    //     async notifyContacts(data: SosDto) {
    //         const API_KEY = '3633|K2xxEIbyxPhQRPKngCaouR0qjjoxmXmFCvcYov8c '; 
    //         const contacts = ['94759971197', '94754660533']; 

    //         for (const number of contacts) {
    //             try {
    //                 const message = `SOS ALERT !!
    // Location: ${data.address}
    // Google Maps: https://maps.google.com/?q=${data.latitude},${data.longitude}`;

    //                 const response = await axios.post(
    //                     'https://sms.send.lk/api/v3/',
    //                     {
    //                         recipient: number,
    //                         sender_id: 'SendLK',
    //                         message,
    //                     },
    //                     {
    //                         headers: {
    //                             Authorization: `Bearer ${API_KEY}`,
    //                             'Content-Type': 'application/json',
    //                         },
    //                     }
    //                 );

    //                 this.logger.log(`SMS Sent → ${number} Status: ${response.data.status}`);
    //             } catch (err) {
    //                 this.logger.error(`Failed for ${number} → ${err.message}`);
    //             }
    //         }
    //     }



    // Notify contacts via WhatsApp API
    async notifyContacts(data: SosDto) {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.PHONE_NUMBER_ID;

        const contacts = ['+94759971197','+94773451388'];

        const message = `🚨 SOS ALERT 🚨
Location: ${data.address}
Google Maps: https://maps.google.com/?q=${data.latitude},${data.longitude}`;

        for (const number of contacts) {
            try {
                await axios.post(
                    `https://graph.facebook.com/v17.0/${phoneId}/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: number,
                        type: "text",
                        text: { body: message }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                this.logger.log(`WhatsApp message sent to: ${number}`);
            } catch (err) {
                this.logger.error(`Failed for ${number} → ${err.message}`);
            }
        }
    }

    async addSosContact(data:ContactsDto){
        try{
            const existingContacts = await this.contactRepo.find({
                where: {userId: data.userId}
            })
            if(existingContacts.length > 5){
                console.log("Maximum 5 contacts allowed")
                return {success:false, message:"Maximum 5 contacts allowed"}
            }

            const result = await this.contactRepo.save(
                data.contacts.map(c => ({
                    name: c.name,
                    phoneNumber: c.phoneNumber,
                    userId:data.userId
                }))
            )

            return{success:true, message:"Contacts saved",data:result}
        }catch(err){
            console.error(err)
            return{ success:false, message:"Error saving contacts"}
        }
    }

    async getContactsByUserId(user_id:string){
        try{
            if(!user_id){
                throw new BadRequestException('UserId is required')
            }
            const contacts = await this.contactRepo.find({
                where:{
                    userId:user_id
                }
            })
            return contacts
        }catch(err){
            console.error(err)
            throw new InternalServerErrorException('something wnet wrong')
        }
    }

    async removeContact(contactId: number, userId: string) {
        try {
            const contact = await this.contactRepo.findOne({ where: { id: contactId ,userId:userId} });
            if (!contact) {
                return { success: false, message: 'Contact not found' };
            }
            await this.contactRepo.remove(contact);
            return { success: true, message: 'Contact removed successfully' };
        } catch (err) {
            console.error('Contact removing failed', err);
            throw err;
        }
    }

}