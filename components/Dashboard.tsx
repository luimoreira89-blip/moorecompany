
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Post, User, Status, Period, Format } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getPeriodRange, getStatus } from '../utils/dateUtils';
import PostTable from './PostTable';
import PostFormModal from './PostFormModal';
import AnalyticsChart from './AnalyticsChart';
import { isValidDriveLink } from '../utils/postUtils';
import { parseISO, startOfDay, endOfDay, subDays, format, eachDayOfInterval, subHours } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';


// --- SUB-COMPONENTS --- //

const Sidebar: React.FC<{ currentPage: string; setCurrentPage: (page: string) => void; }> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'metrics', label: 'Análise de Métricas' },
    { id: 'posts', label: 'Performance de Conteúdo' },
  ];

  return (
    <div className="w-60 bg-gray-800 p-4 flex-col hidden sm:flex border-r border-gray-700">
      <div className="mb-10 text-center h-24 flex items-center justify-center">
         <img src="https://iili.io/Kw8h2El.png" alt="Utmify Logo" className="h-20 w-auto" />
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`px-4 py-2.5 text-left rounded-md text-sm font-medium transition-colors ${
              currentPage === item.id
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-lg">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
);

interface DailyMetric {
    id: string;
    createdAt: string;
    date: string; // YYYY-MM-DD
    account: string;
    gmv: number;
    sales: number;
    views: number;
    clicks: number;
    lucro: number;
}

const DailyMetricFormModal: React.FC<{
    onSave: (metric: Omit<DailyMetric, 'createdAt'> & { id?: string }) => void;
    onClose: () => void;
    accounts: string[];
    metricToEdit: DailyMetric | null;
}> = ({ onSave, onClose, accounts, metricToEdit }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        account: '',
        gmv: 0,
        sales: 0,
        views: 0,
        clicks: 0,
        lucro: 0,
    });

    useEffect(() => {
        if (metricToEdit) {
            setFormData({
                date: metricToEdit.date,
                account: metricToEdit.account,
                gmv: metricToEdit.gmv,
                sales: metricToEdit.sales,
                views: metricToEdit.views,
                clicks: metricToEdit.clicks,
                lucro: metricToEdit.lucro,
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                account: '',
                gmv: 0,
                sales: 0,
                views: 0,
                clicks: 0,
                lucro: 0,
            });
        }
    }, [metricToEdit]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'date' || name === 'account') {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: metricToEdit?.id });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-primary-800 max-h-full overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">{metricToEdit ? 'Editar Registro' : 'Adicionar Registro Diário'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-300">Data *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                            <label htmlFor="account-metric" className="block text-sm font-medium text-gray-300">Conta *</label>
                            <input type="text" name="account" id="account-metric" list="accounts-list-metric" value={formData.account} onChange={handleChange} required placeholder="@nome_da_conta" className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                            <datalist id="accounts-list-metric">
                                {accounts.map(acc => <option key={acc} value={acc} />)}
                            </datalist>
                        </div>
                         <div>
                           <label htmlFor="gmv" className="block text-sm font-medium text-gray-300">GMV (R$)</label>
                           <input type="number" step="0.01" name="gmv" value={formData.gmv} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                         <div>
                           <label htmlFor="lucro" className="block text-sm font-medium text-gray-300">Lucro (R$)</label>
                           <input type="number" step="0.01" name="lucro" value={formData.lucro} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                           <label htmlFor="sales" className="block text-sm font-medium text-gray-300">Itens Vendidos</label>
                           <input type="number" name="sales" value={formData.sales} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                           <label htmlFor="views" className="block text-sm font-medium text-gray-300">Views</label>
                           <input type="number" name="views" value={formData.views} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                         <div>
                           <label htmlFor="clicks" className="block text-sm font-medium text-gray-300">Cliques</label>
                           <input type="number" name="clicks" value={formData.clicks} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MetricsDashboard: React.FC<{ user: User; logout: () => void; posts: Post[]; }> = ({ user, logout, posts }) => {
    const [dailyMetrics, setDailyMetrics] = useLocalStorage<DailyMetric[]>(`metrics_${user.username}`, []);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [editingMetric, setEditingMetric] = useState<DailyMetric | null>(null);
    const [period, setPeriod] = useState<Period>(Period.Last7Days);
    const todayStr = new Date().toISOString().split('T')[0];
    const [customStartDate, setCustomStartDate] = useState(todayStr);
    const [customEndDate, setCustomEndDate] = useState(todayStr);
    const [accountFilter, setAccountFilter] = useState<string>('Todos');

    // State for the new chart
    const [chartMetric, setChartMetric] = useState<'gmv' | 'lucro' | 'views'>('gmv');
    type ChartPeriodOption = 'Últimos 7 dias' | 'Últimos 15 dias' | 'Últimos 30 dias' | 'Personalizado';
    const [chartPeriod, setChartPeriod] = useState<ChartPeriodOption>('Últimos 7 dias');
    const [chartStartDate, setChartStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
    const [chartEndDate, setChartEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));


    const uniqueAccounts = useMemo(() => [...new Set(dailyMetrics.map(m => m.account).filter(Boolean))].sort(), [dailyMetrics]);

    const dateRange = useMemo(() => {
        if (period === Period.Custom) {
            try {
                return { start: startOfDay(parseISO(customStartDate)), end: endOfDay(parseISO(customEndDate)) };
            } catch {
                const now = new Date();
                return { start: startOfDay(now), end: endOfDay(now) };
            }
        }
        return getPeriodRange(period);
    }, [period, customStartDate, customEndDate]);
    
    const filteredMetrics = useMemo(() => {
        return dailyMetrics.filter(m => {
            const [year, month, day] = m.date.split('-').map(Number);
            const metricDate = new Date(year, month - 1, day);
            
            const inDateRange = metricDate >= dateRange.start && metricDate <= dateRange.end;
            const matchesAccount = accountFilter === 'Todos' || m.account === accountFilter;
            return inDateRange && matchesAccount;
        });
    }, [dailyMetrics, dateRange, accountFilter]);

    const videosPostados = useMemo(() => {
        return posts.filter(p => {
            if (!p.isPosted) return false;
            const postDate = parseISO(p.date);
            const inDateRange = postDate >= dateRange.start && postDate <= dateRange.end;
            const matchesAccount = accountFilter === 'Todos' || p.account === accountFilter;
            return inDateRange && matchesAccount;
        }).length;
    }, [posts, dateRange, accountFilter]);

    const metrics = useMemo(() => {
        const gmv = filteredMetrics.reduce((sum, m) => sum + m.gmv, 0);
        const itensVendidos = filteredMetrics.reduce((sum, m) => sum + m.sales, 0);
        const cliques = filteredMetrics.reduce((sum, m) => sum + m.clicks, 0);
        const views = filteredMetrics.reduce((sum, m) => sum + m.views, 0);
        const lucro = filteredMetrics.reduce((sum, m) => sum + m.lucro, 0);
        const rpp = videosPostados > 0 ? gmv / videosPostados : 0;
        return { gmv, videosPostados, itensVendidos, cliques, views, lucro, rpp };
    }, [filteredMetrics, videosPostados]);
    
    const gmvGoal = 250000;
    const gmvProgress = Math.min((metrics.gmv / gmvGoal) * 100, 100);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSaveMetric = (metricData: Omit<DailyMetric, 'createdAt'> & { id?: string }) => {
        if (metricData.id) { // Editing
            setDailyMetrics(prev => prev.map(m => m.id === metricData.id ? { ...m, ...metricData } as DailyMetric : m));
        } else { // Creating
            const newMetric: DailyMetric = {
                ...(metricData as Omit<DailyMetric, 'id' | 'createdAt'>),
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            setDailyMetrics(prev => [...prev, newMetric]);
        }
        setIsMetricModalOpen(false);
        setEditingMetric(null);
    };
    
    const handleEditMetric = (metric: DailyMetric) => {
        setEditingMetric(metric);
        setIsMetricModalOpen(true);
    };

    const handleDeleteMetric = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro? A ação é irreversível.')) {
            setDailyMetrics(prev => prev.filter(m => m.id !== id));
        }
    };
    
    const handleOpenAddModal = () => {
        setEditingMetric(null);
        setIsMetricModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsMetricModalOpen(false);
        setEditingMetric(null);
    };

    const recentMetrics = useMemo(() => {
        const twentyFourHoursAgo = subHours(new Date(), 24);
        return dailyMetrics
            .filter(m => m.createdAt && parseISO(m.createdAt) >= twentyFourHoursAgo)
            .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
    }, [dailyMetrics]);


    // Effect to update chart dates when period changes
    useEffect(() => {
        const now = new Date();
        let start;
        if (chartPeriod === 'Últimos 7 dias') {
            start = subDays(now, 6);
        } else if (chartPeriod === 'Últimos 15 dias') {
            start = subDays(now, 14);
        } else if (chartPeriod === 'Últimos 30 dias') {
            start = subDays(now, 29);
        } else {
            return; // For 'Personalizado', don't auto-update
        }
        setChartStartDate(format(start, 'yyyy-MM-dd'));
        setChartEndDate(format(now, 'yyyy-MM-dd'));
    }, [chartPeriod]);

    const barChartData = useMemo(() => {
        try {
            if (!chartStartDate || !chartEndDate) return [];
            
            const start = startOfDay(parseISO(chartStartDate));
            const end = endOfDay(parseISO(chartEndDate));
            if (start > end) return [];

            const metricsInDateRange = dailyMetrics.filter(m => {
                const [year, month, day] = m.date.split('-').map(Number);
                const metricDate = new Date(year, month - 1, day);
                return metricDate >= start && metricDate <= end;
            });

            const groupedByDay = metricsInDateRange.reduce((acc, metric) => {
                const [year, month, day] = metric.date.split('-').map(Number);
                const metricDate = new Date(year, month - 1, day);
                const dayStr = format(metricDate, 'dd/MM');
                
                if (!acc[dayStr]) {
                    acc[dayStr] = { gmv: 0, lucro: 0, views: 0 };
                }
                acc[dayStr].gmv += metric.gmv || 0;
                acc[dayStr].lucro += metric.lucro || 0;
                acc[dayStr].views += metric.views || 0;
                return acc;
            }, {} as Record<string, { gmv: number; lucro: number; views: number }>);

            const allDays = eachDayOfInterval({ start, end });
            const finalData = allDays.map(day => {
                const dayStr = format(day, 'dd/MM');
                const metricValue = groupedByDay[dayStr]?.[chartMetric] || 0;
                return {
                    name: dayStr,
                    [chartMetric]: metricValue
                };
            });

            return finalData;
        } catch (error) {
            console.error("Error processing chart data:", error);
            return [];
        }
    }, [dailyMetrics, chartMetric, chartStartDate, chartEndDate]);


    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Análise de Métricas</h1>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400">🏆</span>
                        <span className="text-sm text-gray-300 hidden md:inline italic">SEJA RARE</span>
                        <div className="w-32 sm:w-48 bg-gray-700 rounded-full h-2.5">
                            <div className="progress-bar-neon h-2.5 rounded-full" style={{ width: `${gmvProgress}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold text-white">{formatCurrency(metrics.gmv)} / {formatCurrency(gmvGoal)}</span>
                    </div>
                     <div className="text-right">
                        <p className="text-white font-medium text-sm">{user.username}</p>
                         <button onClick={logout} className="text-xs text-primary-400 hover:text-primary-300">Sair</button>
                    </div>
                </div>
            </header>

             <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-4">
                    {/* Filter Group - Centered */}
                    <div className="flex flex-wrap gap-4 items-end justify-center p-3 bg-gray-900/50 border border-gray-700 rounded-xl shadow-md">
                        <div>
                            <label htmlFor="period-metrics" className="block text-sm font-medium text-gray-400 mb-1">Período</label>
                            <select id="period-metrics" value={period} onChange={e => setPeriod(e.target.value as Period)} className="bg-gray-700/50 border-gray-600 rounded-md px-3 py-2 text-white">
                                {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         {period === Period.Custom && (
                            <>
                                <div>
                                    <label htmlFor="start-date-metrics" className="block text-sm font-medium text-gray-400 mb-1">Início</label>
                                    <input type="date" id="start-date-metrics" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                                </div>
                                <div>
                                    <label htmlFor="end-date-metrics" className="block text-sm font-medium text-gray-400 mb-1">Fim</label>
                                    <input type="date" id="end-date-metrics" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                                </div>
                            </>
                        )}
                        <div>
                            <label htmlFor="account-filter-metrics" className="block text-sm text-gray-400 mb-1">Conta</label>
                            <select id="account-filter-metrics" value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="bg-gray-700/50 border-gray-600 rounded-md px-3 py-2 text-white">
                                <option value="Todos">Todas</option>
                                {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-auto md:absolute md:right-0">
                        <button 
                            onClick={handleOpenAddModal} 
                            className="w-full md:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                        >
                            Adicionar Registro Diário
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="GMV" value={formatCurrency(metrics.gmv)} />
                <KpiCard title="ITENS VENDIDOS" value={metrics.itensVendidos.toLocaleString('pt-BR')} />
                <KpiCard title="LUCRO" value={formatCurrency(metrics.lucro)} />
                <KpiCard title="VÍDEOS POSTADOS" value={metrics.videosPostados.toLocaleString('pt-BR')} />
                <KpiCard title="RPP (RECEITA POR POST)" value={formatCurrency(metrics.rpp)} />
                <KpiCard title="CLIQUES" value={metrics.cliques.toLocaleString('pt-BR')} />
                <KpiCard title="VIEWS" value={metrics.views.toLocaleString('pt-BR')} />
            </div>

            {/* --- HISTÓRICO DE REGISTROS --- */}
            <div className="bg-gray-800/50 border border-gray-700 p-4 sm:p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Histórico de Registros (Últimas 24h)</h2>
                {recentMetrics.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Conta</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">GMV</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lucro</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliques</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {recentMetrics.map(metric => (
                                    <tr key={metric.id} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{format(parseISO(metric.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{metric.account}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(metric.gmv)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(metric.lucro)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{metric.sales.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{metric.views.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{metric.clicks.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-4">
                                                <button onClick={() => handleEditMetric(metric)} className="text-primary-400 hover:text-primary-300">Editar</button>
                                                <button onClick={() => handleDeleteMetric(metric.id)} className="text-red-400 hover:text-red-300">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">Nenhum registro nas últimas 24 horas.</p>
                )}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Análise Gráfica de Métricas</h2>
                <div className="flex flex-wrap gap-4 mb-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Métrica</label>
                        <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value as any)} className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-primary-500 focus:border-primary-500">
                            <option value="gmv">GMV Total</option>
                            <option value="lucro">Lucro</option>
                            <option value="views">Views</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Período</label>
                        <select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value as any)} className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-primary-500 focus:border-primary-500">
                            <option>Últimos 7 dias</option>
                            <option>Últimos 15 dias</option>
                            <option>Últimos 30 dias</option>
                            <option>Personalizado</option>
                        </select>
                    </div>
                    {chartPeriod === 'Personalizado' && (
                        <>
                            <div>
                                <label htmlFor="chart-start-date" className="block text-sm font-medium text-gray-600 mb-1">Início</label>
                                <input type="date" id="chart-start-date" value={chartStartDate} onChange={e => setChartStartDate(e.target.value)} className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-primary-500 focus:border-primary-500"/>
                            </div>
                            <div>
                                <label htmlFor="chart-end-date" className="block text-sm font-medium text-gray-600 mb-1">Fim</label>
                                <input type="date" id="chart-end-date" value={chartEndDate} onChange={e => setChartEndDate(e.target.value)} className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-primary-500 focus:border-primary-500"/>
                            </div>
                        </>
                    )}
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" tickFormatter={(value) => chartMetric !== 'views' ? `R$${(value/1000).toFixed(0)}k` : new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value) } />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#333', borderColor: '#555', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                                formatter={(value: number, name: string) => [
                                    chartMetric !== 'views' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value.toLocaleString('pt-BR'),
                                    name === 'gmv' ? 'GMV' : name.charAt(0).toUpperCase() + name.slice(1)
                                ]}
                            />
                            <Bar dataKey={chartMetric} fill="#4338ca" maxBarSize={30}>
                                <LabelList dataKey={chartMetric} position="top" style={{ fill: '#333', fontSize: '12px' }} formatter={(value: number) => value > 0 ? (chartMetric !== 'views' ? `R$${(value/1000).toFixed(1)}k` : new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value)) : ''} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

             {isMetricModalOpen && <DailyMetricFormModal onSave={handleSaveMetric} onClose={handleCloseModal} accounts={uniqueAccounts} metricToEdit={editingMetric} />}
        </div>
    );
};


const PostControl: React.FC<{ user: User; logout: () => void; posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>> }> = ({ user, logout, posts, setPosts }) => {
    const [period, setPeriod] = useState<Period>(Period.Last7Days);
    const todayStr = new Date().toISOString().split('T')[0];
    const [customStartDate, setCustomStartDate] = useState(todayStr);
    const [customEndDate, setCustomEndDate] = useState(todayStr);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | 'Todos'>('Todos');
    const [accountFilter, setAccountFilter] = useState<string>('Todos');
    const [productFilter, setProductFilter] = useState<string>('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [groupByAccount, setGroupByAccount] = useState(false);
    const [sortBy, setSortBy] = useState<keyof Pick<Post, 'date' | 'account' | 'product' | 'format'>>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleAddPost = () => { setEditingPost(null); setIsModalOpen(true); };
    const handleEditPost = (post: Post) => { setEditingPost(post); setIsModalOpen(true); };
    const handleDeletePost = (id: string) => { if (window.confirm('Tem certeza?')) { setPosts(posts.filter(p => p.id !== id)); } };
    const handleSavePost = (post: Post) => {
        if (post.id) { setPosts(posts.map(p => p.id === post.id ? post : p)); } 
        else { setPosts([...posts, { ...post, id: Date.now().toString() }]); }
        setIsModalOpen(false); setEditingPost(null);
    };
    const setPostedState = (id: string, isPosted: boolean) => { setPosts(posts.map(p => p.id === id ? { ...p, isPosted, postedAt: isPosted ? new Date().toISOString() : undefined } : p)); };
    
    const dateRange = useMemo(() => {
        if (period === Period.Custom) {
            try {
                return { start: startOfDay(parseISO(customStartDate)), end: endOfDay(parseISO(customEndDate)) };
            } catch {
                const now = new Date();
                return { start: startOfDay(now), end: endOfDay(now) };
            }
        }
        return getPeriodRange(period);
    }, [period, customStartDate, customEndDate]);
    
    const uniqueAccounts = useMemo(() => [...new Set(posts.map(p => p.account).filter(Boolean))].sort(), [posts]);
    const uniqueProducts = useMemo(() => [...new Set(posts.map(p => p.product).filter(Boolean))].sort(), [posts]);

    const filteredPosts = useMemo(() => {
        return posts
            .map(p => ({ ...p, derivedStatus: getStatus(p) }))
            .filter(p => {
                const [year, month, day] = p.date.split('-').map(Number);
                const postDate = new Date(year, month - 1, day);

                const inDateRange = postDate >= dateRange.start && postDate <= dateRange.end;
                const matchesSearch = [p.account, p.info, p.product].some(term => term.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesStatus = statusFilter === 'Todos' || p.derivedStatus === statusFilter;
                const matchesAccount = accountFilter === 'Todos' || p.account === accountFilter;
                const matchesProduct = productFilter === 'Todos' || p.product === productFilter;
                return inDateRange && matchesSearch && matchesStatus && matchesAccount && matchesProduct;
            })
            .sort((a, b) => {
                const aVal = a[sortBy], bVal = b[sortBy];
                if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
    }, [posts, dateRange, searchTerm, statusFilter, accountFilter, productFilter, sortBy, sortDir]);

    const kpis = useMemo(() => {
        const postsInPeriod = posts.map(p => ({ ...p, derivedStatus: getStatus(p) })).filter(p => {
            const [year, month, day] = p.date.split('-').map(Number);
            const postDate = new Date(year, month - 1, day);
            return postDate >= dateRange.start && postDate <= dateRange.end
        });
        return {
            total: postsInPeriod.length,
            posted: postsInPeriod.filter(p => p.derivedStatus === Status.Posted).length,
            pending: postsInPeriod.filter(p => p.derivedStatus === Status.Pending).length,
            overdue: postsInPeriod.filter(p => p.derivedStatus === Status.Overdue).length,
        };
    }, [posts, dateRange]);

    return (
        <div className="space-y-6">
             <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Performance de Conteúdo</h1>
                <div className="text-right">
                    <p className="text-white text-sm">{user.username}</p>
                    <button onClick={logout} className="text-xs font-medium text-primary-400 hover:text-primary-300">Sair</button>
                </div>
            </header>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-lg border bg-blue-900/50 border-blue-500">
                    <h3 className="text-sm font-medium text-blue-300">Total no Período</h3>
                    <p className="text-3xl font-bold text-white mt-2">{kpis.total.toString()}</p>
                </div>
                <div className="p-5 rounded-lg border bg-green-900/50 border-green-500">
                    <h3 className="text-sm font-medium text-green-300">Postados</h3>
                    <p className="text-3xl font-bold text-white mt-2">{kpis.posted.toString()}</p>
                </div>
                <div className="p-5 rounded-lg border bg-orange-900/50 border-orange-500">
                    <h3 className="text-sm font-medium text-orange-300">Pendentes</h3>
                    <p className="text-3xl font-bold text-white mt-2">{kpis.pending.toString()}</p>
                </div>
                <div className="p-5 rounded-lg border bg-red-900/50 border-red-500">
                    <h3 className="text-sm font-medium text-red-300">Atrasados</h3>
                    <p className="text-3xl font-bold text-white mt-2">{kpis.overdue.toString()}</p>
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg space-y-4">
                 <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-grow min-w-[150px]">
                        <label htmlFor="search" className="block text-sm text-gray-400 mb-1">Buscar</label>
                        <input type="text" id="search" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border-gray-600 rounded-md px-3 py-2 text-white"/>
                    </div>
                    <div>
                        <label htmlFor="period-posts" className="block text-sm text-gray-400 mb-1">Período</label>
                        <select id="period-posts" value={period} onChange={e => setPeriod(e.target.value as Period)} className="bg-gray-900 border-gray-600 rounded-md px-3 py-2 text-white">
                            {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {period === Period.Custom && (
                        <>
                            <div>
                                <label htmlFor="start-date-posts" className="block text-sm font-medium text-gray-400 mb-1">Início</label>
                                <input type="date" id="start-date-posts" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                            </div>
                            <div>
                                <label htmlFor="end-date-posts" className="block text-sm font-medium text-gray-400 mb-1">Fim</label>
                                <input type="date" id="end-date-posts" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                            </div>
                        </>
                    )}
                    <div>
                        <label htmlFor="status" className="block text-sm text-gray-400 mb-1">Status</label>
                        <select id="status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as (Status | 'Todos'))} className="bg-gray-900 border-gray-600 rounded-md px-3 py-2 text-white">
                            <option value="Todos">Todos</option>
                            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="account-filter" className="block text-sm text-gray-400 mb-1">Conta</label>
                        <select id="account-filter" value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="bg-gray-900 border-gray-600 rounded-md px-3 py-2 text-white">
                            <option value="Todos">Todas</option>
                            {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="product-filter" className="block text-sm text-gray-400 mb-1">Produto</label>
                        <select id="product-filter" value={productFilter} onChange={e => setProductFilter(e.target.value)} className="bg-gray-900 border-gray-600 rounded-md px-3 py-2 text-white">
                            <option value="Todos">Todos</option>
                            {uniqueProducts.map(prod => <option key={prod} value={prod}>{prod}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center pt-6">
                        <input type="checkbox" id="group-account" checked={groupByAccount} onChange={e => setGroupByAccount(e.target.checked)} className="h-4 w-4 rounded bg-gray-900 text-primary-600"/>
                        <label htmlFor="group-account" className="ml-2 text-sm text-gray-300">Agrupar</label>
                    </div>
                    <button onClick={handleAddPost} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Novo Registro</button>
                </div>
            </div>

            <PostTable posts={filteredPosts} groupByAccount={groupByAccount} onEdit={handleEditPost} onDelete={handleDeletePost} onSetPosted={setPostedState} sortBy={sortBy} sortDir={sortDir} onSort={(key) => { setSortBy(key); setSortDir(prev => sortBy === key ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'); }} />
            <AnalyticsChart allPosts={posts} />
            {isModalOpen && <PostFormModal post={editingPost} onSave={handleSavePost} onClose={() => setIsModalOpen(false)} accounts={uniqueAccounts} />}
        </div>
    );
};


// --- MAIN DASHBOARD COMPONENT --- //
interface DashboardProps { user: User; logout: () => void; }

const Dashboard: React.FC<DashboardProps> = ({ user, logout }) => {
    const [posts, setPosts] = useLocalStorage<Post[]>(`posts_${user.username}`, []);
    const [currentPage, setCurrentPage] = useState('metrics');

    return (
        <div className="flex min-h-screen">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-900 text-gray-200 overflow-y-auto">
                {currentPage === 'metrics' && <MetricsDashboard user={user} logout={logout} posts={posts} />}
                {currentPage === 'posts' && <PostControl user={user} logout={logout} posts={posts} setPosts={setPosts} />}
            </main>
        </div>
    );
};

export default Dashboard;
