export type Contact = {
    id: number;
    userId: string | null;
    name: string,
    phoneNumber: string
};

export type DeviceContact = {
    id: string;
    name: string;
    phoneNumbers?: { number?: string }[];
};