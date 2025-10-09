
export enum Status {
    Pending = 'Pendente',
    Posted = 'Postado',
    Overdue = 'Atrasado'
}

export enum Format {
    UGC = 'UGC',
    QuestionBox = 'Caixa de pergunta',
    AI = 'IA'
}

export enum Period {
    Daily = 'Diário',
    Weekly = 'Semanal',
    Monthly = 'Mensal'
}

export interface Post {
    id: string;
    account: string;
    date: string; // ISO 8601 format string
    info: string;
    product: string;
    format: Format;
    isPosted: boolean;
    postedAt?: string; // ISO 8601 format string
    driveLink?: string;
}

export interface User {
    username: string;
    password?: string;
}
