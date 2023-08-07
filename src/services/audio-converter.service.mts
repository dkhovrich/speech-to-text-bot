import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";

export interface AudioConverterService {
    oggToMp3(input: string, output: string): Promise<void>;
}

export class AudioConverterServiceImpl implements AudioConverterService {
    private static mp3FileSizeLimit = 20 * 1024 * 1024;

    public constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    public oggToMp3(oggPath: string, mp3Path: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            ffmpeg(oggPath)
                .outputOption(`-fs ${AudioConverterServiceImpl.mp3FileSizeLimit}`)
                .output(mp3Path)
                .on("end", () => resolve())
                .on("error", err => reject(err.message))
                .run();
        });
    }
}
