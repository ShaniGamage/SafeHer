// app/components/data/police-stations.ts
export interface PoliceStation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    phone: string;
}

export const policeStations: PoliceStation[] = [
    {
        id: "1",
        name: "Colombo Central Police Station",
        lat: 6.9271,
        lng: 79.8612,
        phone: "+94112421111"
    },
    {
        id: "1",
        name: "Colombo Central Police Station",
        lat: 6.9271,
        lng: 79.8612,
        phone: "+94112421111"
    },
    {
        id: "2",
        name: "Kottawa",
        lat: 6.841332,
        lng: 79.963553,
        phone: "0112782760"
    },
    {
        id: "SLP123",
        name: "Borella",
        lat: 6.913448810577393,
        lng: 79.8777084350586,
        phone: "0112421111"
    }
];