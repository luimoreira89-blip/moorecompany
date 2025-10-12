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
    All = 'Todo o período',
    Today = 'Hoje',
    Yesterday = 'Ontem',
    Last7Days = 'Últimos 7 dias',
    Last15Days = 'Últimos 15 dias',
    Last30Days = 'Últimos 30 dias',
    Custom = 'Personalizado'
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
    copyLink?: string;
    gmv?: number;
    sales?: number;
    clicks?: number;
    views?: number;
}

export interface User {
    username: string;
    password?: string;
    uid?: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
}

// Fix: Add missing FlowSession interface.
export interface FlowSession {
    duration: number; // in minutes
    completedAt: string; // ISO 8601 format string
}
