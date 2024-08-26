import { Repository, TranscribeModel } from "./transcribe.repository.mjs";

export class TranscribeRepositoryStub implements Repository<TranscribeModel> {
    public create(): Promise<void> {
        return Promise.resolve();
    }
}
