export type Dofus3Data = {
    bonus: {
        type: {
            name: string;
            id: string;
        };
        description: string;
    };
    date: string;
    tribute: {
        item: {
            name: string;
            image_urls: {
                sd: string;
                hd: string;
            };
            subtype: string;
            ankama_id: number;
        };
        quantity: number;
    };
    reward_kamas: number;
    reward_xp: number;
}