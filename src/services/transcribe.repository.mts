import admin from "firebase-admin";
import { ConfigService } from "./config.service.mjs";

export interface Repository<TModel> {
    create(model: TModel): Promise<void>;
}

export interface User {
    id: number;
    name: string;
    displayName: string;
}

export interface TranscribeModel {
    user: User;
    duration: number;
}

export class TranscribeRepository implements Repository<TranscribeModel> {
    private readonly database: admin.firestore.Firestore;

    public constructor(configService: ConfigService) {
        const credential = configService.get("firebase");
        admin.initializeApp({
            credential: admin.credential.cert(credential as admin.ServiceAccount)
        });
        this.database = admin.firestore();
    }

    public async create(model: TranscribeModel): Promise<void> {
        await this.database.collection("transcribes").add({
            ...model,
            createdAt: admin.firestore.Timestamp.fromDate(new Date())
        });
    }
}
