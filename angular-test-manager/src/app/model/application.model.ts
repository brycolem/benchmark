import { Note } from "./note.model";

export class Application {
    id?: number;
    title!: string;
    employer!: string;
    companyId?: string;
    link?: string;
    notes!: Array<Note>;
}