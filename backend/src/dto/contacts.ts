export class ContactsDto {
    userId: string;
    contacts: {
        name: string;
        phoneNumber: string;
    }[];

}
