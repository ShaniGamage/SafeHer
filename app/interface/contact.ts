export interface Contact  {
    id: number;
    userId: string | null;
    name: string,
    phoneNumber: string
};

export interface DeviceContact  {
    id: string;
    name: string;
    phoneNumbers?: { number?: string }[];
};

export interface CreateContactDto {
  name: string;
  phoneNumber: string;
}