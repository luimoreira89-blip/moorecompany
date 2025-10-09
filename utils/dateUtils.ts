
import { Post, Status, Period } from '../types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getStatus = (post: Post): Status => {
    if (post.isPosted) {
        return Status.Posted;
    }
    const postDate = startOfDay(parseISO(post.date));
    const today = startOfDay(new Date());
    
    if (isBefore(postDate, today)) {
        return Status.Overdue;
    }

    return Status.Pending;
};

export const getPeriodRange = (period: Period): { start: Date; end: Date } => {
    const now = new Date();
    switch (period) {
        case Period.Daily:
            return { start: startOfDay(now), end: endOfDay(now) };
        case Period.Weekly:
            return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
        case Period.Monthly:
            return { start: startOfMonth(now), end: endOfMonth(now) };
        default:
            return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    }
};

export const formatPostDate = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
        return "Data inválida";
    }
};

export const formatTimestamp = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
        return "Horário inválido";
    }
};
