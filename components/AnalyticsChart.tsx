import React, { useState, useMemo } from 'react';
import { Post } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsChartProps {
  allPosts: Post[];
}

type ChartPeriod = 'Diário' | 'Semanal' | 'Mensal' | 'Personalizado';

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ allPosts }) => {
  const today = new Date();
  const [period, setPeriod] = useState<ChartPeriod>('Semanal');
  const [startDate, setStartDate] = useState(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  
  const handlePeriodChange = (newPeriod: ChartPeriod) => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === 'Diário') {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        setStartDate(format(weekStart, 'yyyy-MM-dd'));
        setEndDate(format(weekEnd, 'yyyy-MM-dd'));
    } else if (newPeriod === 'Semanal') {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        setStartDate(format(monthStart, 'yyyy-MM-dd'));
        setEndDate(format(monthEnd, 'yyyy-MM-dd'));
    } else if (newPeriod === 'Mensal') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        setStartDate(format(yearStart, 'yyyy-MM-dd'));
        setEndDate(format(yearEnd, 'yyyy-MM-dd'));
    }
  };

  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if(start > end) return [];

    const postsInDateRange = allPosts.filter(post => {
        const postDate = parseISO(post.date);
        return postDate >= start && postDate <= end;
    });

    if (period === 'Diário') {
      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return {
          name: format(day, 'dd/MM'),
          Postagens: postsInDateRange.filter(p => format(parseISO(p.date), 'yyyy-MM-dd') === dayStr).length,
        };
      });
    }

    if (period === 'Semanal') {
      const data: { [key: string]: number } = {};
      for (const post of postsInDateRange) {
        const weekStart = startOfWeek(parseISO(post.date), { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'dd/MM/yy');
        if (!data[weekKey]) data[weekKey] = 0;
        data[weekKey]++;
      }
      return Object.entries(data).map(([name, count]) => ({ name, Postagens: count })).sort((a,b) => a.name.localeCompare(b.name));
    }

    if (period === 'Mensal') {
      const data: { [key: string]: number } = {};
      for (const post of postsInDateRange) {
        const monthKey = format(parseISO(post.date), 'MMM/yy', { locale: ptBR });
        if (!data[monthKey]) data[monthKey] = 0;
        data[monthKey]++;
      }
      return Object.entries(data).map(([name, count]) => ({ name, Postagens: count })).sort((a,b) => a.name.localeCompare(b.name, 'pt-BR'));
    }

    return [];
  }, [allPosts, period, startDate, endDate]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 sm:p-6 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Análise de Postagens</h2>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Visão</label>
            <select value={period} onChange={(e) => handlePeriodChange(e.target.value as ChartPeriod)} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500">
                <option>Diário</option>
                <option>Semanal</option>
                <option>Mensal</option>
                <option>Personalizado</option>
            </select>
        </div>
        {period === 'Personalizado' && (
            <>
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-400 mb-1">Data Início</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-400 mb-1">Data Fim</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500"/>
                </div>
            </>
        )}
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="name" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" allowDecimals={false}/>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A202C',
                borderColor: '#4A5568'
              }}
              labelStyle={{ color: '#E2E8F0' }}
            />
            <Legend wrapperStyle={{ color: '#E2E8F0' }} />
            <Line type="monotone" dataKey="Postagens" stroke="#22c55e" strokeWidth={2}>
                 <LabelList dataKey="Postagens" position="top" style={{ fill: '#e2e8f0', fontSize: '12px' }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;

// Import Recharts from a CDN in index.html, e.g.:
// <script src="https://unpkg.com/recharts/umd/Recharts.min.js"></script>
// For date-fns:
// <script src="https://unpkg.com/date-fns/umd/index.js"></script>
// <script src="https://unpkg.com/date-fns/locale/pt-BR/index.js"></script>
// Then access them via window.Recharts and window.dateFns
// This component assumes ESM imports for modern tooling.