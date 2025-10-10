import { Post, Status, Period } from '../types';
import { startOfDay, endOfDay, isBefore, format, parseISO, subDays } from 'date-fns';
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
        case Period.Today:
            return { start: startOfDay(now), end: endOfDay(now) };
        case Period.Yesterday:
            const yesterday = subDays(now, 1);
            return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
        case Period.Last7Days:
            return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
        case Period.Last30Days:
            return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
        default:
            // Period.Custom is handled outside this function, so this is a fallback.
            return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
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