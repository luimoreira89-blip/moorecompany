
import { Status, Format } from './types';

export const STATUS_COLORS: Record<Status, string> = {
    [Status.Pending]: 'bg-orange-900/50 text-orange-400 border border-orange-700/50',
    [Status.Posted]: 'bg-green-900/50 text-green-400 border border-green-700/50',
    [Status.Overdue]: 'bg-red-900/50 text-red-400 border border-red-700/50',
};

export const FORMAT_OPTIONS = [
    { value: Format.UGC, label: 'UGC' },
    { value: Format.QuestionBox, label: 'Caixa de Pergunta' },
    { value: Format.AI, label: 'IA' },
];
