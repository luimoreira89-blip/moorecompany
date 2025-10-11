

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Post, User, Status, Period, Format } from '../types';
import { getPeriodRange, getStatus } from '../utils/dateUtils';
import PostTable from './PostTable';
import PostFormModal from './PostFormModal';
import { isValidDriveLink } from '../utils/postUtils';
// Fix: Consolidate date-fns imports to resolve module resolution errors.
import { parseISO, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';
// Fix: Add missing imports from recharts for the new line chart.
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';


// --- SUB-COMPONENTS --- //
declare global {
    interface Window {
        watchUserSubcollection: (collectionName: string, callback: (data: any[]) => void) => () => void;
        addUserSubcollectionDoc: (collectionName: string, data: any) => Promise<any>;
        updateUserSubcollectionDoc: (collectionName: string, docId: string, data: any) => Promise<void>;
        deleteUserSubcollectionDoc: (collectionName: string, docId: string) => Promise<void>;
    }
}
const GmvProgressBar: React.FC<{ current: number; goal: number; }> = ({ current, goal }) => {
    const percentage = goal > 0 ? (current / goal) * 100 : 0;
    const formattedCurrent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current);
    const formattedGoal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal);

    return (
        <div className="w-full max-w-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                    <span role="img" aria-label="Medalha">🎖️</span>
                    <em className="text-white font-semibold italic text-xs">SEJA RARE</em>
                </div>
                <div className="text-white font-mono text-xs text-right">{formattedCurrent} / {formattedGoal}</div>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                    className="h-full rounded-full progress-bar-neon"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                    title={`${percentage.toFixed(2)}%`}
                />
            </div>
        </div>
    );
};


const Sidebar: React.FC<{
    currentPage: string;
    setCurrentPage: (page: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    user: User;
    logout: () => void;
}> = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen, user, logout }) => {
    const navItems = [
        { id: 'metrics', label: 'Análise de Métricas' },
        { id: 'posts', label: 'Performance de Conteúdo' },
    ];

    const handleNavClick = (page: string) => {
        setCurrentPage(page);
        setIsSidebarOpen(false); // Fecha a sidebar ao navegar
    };

    return (
        <div className={`fixed inset-y-0 left-0 z-30 w-60 bg-gray-900 p-4 flex flex-col border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:relative sm:translate-x-0`}>
            <div className="mb-10 text-center h-24 flex items-center justify-center">
                <img src="https://iili.io/Kw8h2El.png" alt="Utmify Logo" className="h-20 w-auto" />
            </div>
            <nav className="flex flex-col space-y-2 flex-grow">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`px-4 py-2.5 text-left rounded-md text-sm font-medium transition-colors ${currentPage === item.id
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
            {/* User Profile Section */}
            <div className="mt-auto border-t border-gray-800 pt-4 space-y-4">
                <div className="flex items-center gap-3">
                     <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0c4a6e&color=fff`} alt="User Avatar" className="h-10 w-10 rounded-full" />
                    <div className="overflow-hidden flex-1">
                        <p className="font-semibold text-white text-sm truncate">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                     <button onClick={logout} className="text-gray-400 hover:text-white ml-auto flex-shrink-0" title="Sair">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};


const KpiCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-lg">
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
        gmv: '' as string | number,
        sales: '' as string | number,
        views: '' as string | number,
        clicks: '' as string | number,
        lucro: '' as string | number,
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
                gmv: '',
                sales: '',
                views: '',
                clicks: '',
                lucro: '',
            });
        }
    }, [metricToEdit]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            date: formData.date,
            account: formData.account,
            gmv: Number(formData.gmv) || 0,
            sales: Number(formData.sales) || 0,
            views: Number(formData.views) || 0,
            clicks: Number(formData.clicks) || 0,
            lucro: Number(formData.lucro) || 0,
        };
        onSave({ ...dataToSave, id: metricToEdit?.id });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-lg border border-primary-800 max-h-full overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">{metricToEdit ? 'Editar Registro' : 'Adicionar Registro Diário'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-300">Data *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                            <label htmlFor="account-metric" className="block text-sm font-medium text-gray-300">Conta *</label>
                            <input type="text" name="account" id="account-metric" list="accounts-list-metric" value={formData.account} onChange={handleChange} required placeholder="@nome_da_conta" className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                            <datalist id="accounts-list-metric">
                                {accounts.map(acc => <option key={acc} value={acc} />)}
                            </datalist>
                        </div>
                         <div>
                           <label htmlFor="gmv" className="block text-sm font-medium text-gray-300">GMV (R$)</label>
                           <input type="number" step="0.01" name="gmv" value={formData.gmv} onChange={handleChange} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                        </div>
                         <div>
                           <label htmlFor="lucro" className="block text-sm font-medium text-gray-300">Lucro (R$)</label>
                           <input type="number" step="0.01" name="lucro" value={formData.lucro} onChange={handleChange} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                           <label htmlFor="sales" className="block text-sm font-medium text-gray-300">Vendas</label>
                           <input type="number" step="1" name="sales" value={formData.sales} onChange={handleChange} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                           <label htmlFor="clicks" className="block text-sm font-medium text-gray-300">Cliques</label>
                           <input type="number" step="1" name="clicks" value={formData.clicks} onChange={handleChange} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div className="md:col-span-2">
                           <label htmlFor="views" className="block text-sm font-medium text-gray-300">Visualizações</label>
                           <input type="number" step="1" name="views" value={formData.views} onChange={handleChange} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md py-2 px-3 text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MetricTable: React.FC<{ metrics: DailyMetric[]; onEdit: (metric: DailyMetric) => void; onDelete: (id: string) => void; }> = ({ metrics, onEdit, onDelete }) => {
    const sortedMetrics = [...metrics].sort((a, b) => b.date.localeCompare(a.date));

    if (sortedMetrics.length === 0) {
        return <div className="text-center py-10 text-gray-500">Nenhum registro encontrado para o período selecionado.</div>;
    }
    
    return (
        <div>
            {/* Mobile Card View */}
            <div className="space-y-4 sm:hidden"> 
                {sortedMetrics.map(metric => (
                    <div key={metric.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{metric.account}</span>
                            <span className="text-sm text-gray-300">{format(parseISO(metric.date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="text-gray-400">GMV:</div><div className="text-right text-white">R$ {metric.gmv.toFixed(2)}</div>
                            <div className="text-gray-400">Lucro:</div><div className="text-right text-white">R$ {metric.lucro.toFixed(2)}</div>
                            <div className="text-gray-400">Vendas:</div><div className="text-right text-white">{metric.sales}</div>
                            <div className="text-gray-400">Cliques:</div><div className="text-right text-white">{metric.clicks}</div>
                            <div className="text-gray-400">Views:</div><div className="text-right text-white">{metric.views}</div>
                        </div>
                        <div className="flex justify-end gap-4 border-t border-gray-700 pt-3 mt-2">
                            <button onClick={() => onEdit(metric)} className="text-primary-400 hover:text-primary-300 font-medium text-sm">Editar</button>
                            <button onClick={() => onDelete(metric.id)} className="text-red-400 hover:text-red-300 font-medium text-sm">Excluir</button>
                        </div>
                    </div>
                ))}
            </div>
             {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-lg">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Conta</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">GMV</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lucro</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliques</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sortedMetrics.map(metric => (
                            <tr key={metric.id} className="bg-gray-900 hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{format(parseISO(metric.date), 'dd/MM/yyyy')}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{metric.account}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">R$ {metric.gmv.toFixed(2)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">R$ {metric.lucro.toFixed(2)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{metric.sales}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{metric.clicks}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{metric.views}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-4">
                                        <button onClick={() => onEdit(metric)} className="text-primary-400 hover:text-primary-300">Editar</button>
                                        <button onClick={() => onDelete(metric.id)} className="text-red-400 hover:text-red-300">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


const Header: React.FC<{
    onAddPost: () => void;
    onAddMetric: () => void;
    currentPage: string;
    onToggleSidebar: () => void;
    gmvData: { current: number; goal: number };
}> = ({ onAddPost, onAddMetric, currentPage, onToggleSidebar, gmvData }) => {
    return (
        <header className="bg-gray-900/50 border-b border-gray-800 p-4 flex items-center justify-between gap-4">
            {/* Left group */}
            <div className="flex items-center gap-4">
                {/* Hamburger for mobile */}
                <button onClick={onToggleSidebar} className="sm:hidden text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>

                {/* Progress Bar for mobile */}
                <div className="sm:hidden">
                    <div className="w-full max-w-xs">
                        {gmvData && <GmvProgressBar current={gmvData.current} goal={gmvData.goal} />}
                    </div>
                </div>
            </div>

            {/* Right group */}
            <div className="flex items-center gap-4">
                {/* Progress Bar for desktop */}
                <div className="hidden sm:block">
                    <div className="w-full max-w-sm">
                        {gmvData && <GmvProgressBar current={gmvData.current} goal={gmvData.goal} />}
                    </div>
                </div>

                <button onClick={currentPage === 'posts' ? onAddPost : onAddMetric} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 flex-shrink-0">
                    <PlusIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">{currentPage === 'posts' ? 'Adicionar Post' : 'Adicionar Registro'}</span>
                    <span className="sm:hidden text-sm">Add</span>
                </button>
            </div>
        </header>
    );
};


const PostStatCard: React.FC<{ title: string; value: number; bgColorClass: string; }> = ({ title, value, bgColorClass }) => (
    <div className={`${bgColorClass} p-6 rounded-lg text-center shadow-lg`}>
        <p className="text-4xl font-bold text-white">{value}</p>
        <h3 className="text-gray-300 text-lg font-medium mt-2 uppercase tracking-wider">{title}</h3>
    </div>
);


const ContentPerformanceChart: React.FC<{ posts: Post[] }> = ({ posts }) => {
    const [period, setPeriod] = useState<Period>(Period.Last7Days);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const dateRange = useMemo(() => {
        if (period === Period.Custom) {
            return {
                start: startDate ? startOfDay(parseISO(startDate)) : null,
                end: endDate ? endOfDay(parseISO(endDate)) : null
            };
        }
        return getPeriodRange(period);
    }, [period, startDate, endDate]);

    const chartData = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return [];

        const postsInDateRange = posts.filter(post => {
            const postDate = parseISO(post.date);
            return postDate >= dateRange.start && postDate <= dateRange.end;
        });

        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const postedCount = postsInDateRange.filter(p => p.isPosted && format(parseISO(p.date), 'yyyy-MM-dd') === dayStr).length;
            return {
                name: format(day, 'dd/MM'),
                Postagens: postedCount,
            };
        });
    }, [posts, dateRange]);

    return (
        <div className="bg-gray-900/50 border border-gray-800 p-4 sm:p-6 rounded-lg mt-6">
             <div className="flex flex-wrap gap-4 mb-4 items-end">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Período do Gráfico</label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="bg-dark-bg border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500">
                        {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                {period === Period.Custom && (
                    <>
                        <div>
                            <label htmlFor="chart-start-date" className="block text-sm font-medium text-gray-400 mb-1">Data Início</label>
                            <input type="date" id="chart-start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-dark-bg border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500"/>
                        </div>
                        <div>
                            <label htmlFor="chart-end-date" className="block text-sm font-medium text-gray-400 mb-1">Data Fim</label>
                            <input type="date" id="chart-end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-dark-bg border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500"/>
                        </div>
                    </>
                )}
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" stroke="#A0AEC0" />
                        <YAxis stroke="#A0AEC0" allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }}
                            itemStyle={{ color: '#0ea5e9' }}
                            labelStyle={{ color: '#E2E8F0' }}
                        />
                        <Line type="monotone" dataKey="Postagens" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Postagens" position="top" style={{ fill: '#e2e8f0', fontSize: '12px' }} formatter={(value: number) => value > 0 ? value : ''} />
                        </Line>
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT --- //

interface DashboardProps {
    user: User;
    logout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, logout }) => {
    // --- STATE MANAGEMENT --- //
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([]);
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [isMetricModalOpen, setMetricModalOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState<Post | null>(null);
    const [metricToEdit, setMetricToEdit] = useState<DailyMetric | null>(null);
    const [currentPage, setCurrentPage] = useState('metrics');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    // Filters for Posts
    const [period, setPeriod] = useState<Period>(Period.All);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [accountFilter, setAccountFilter] = useState('');
    const [groupByAccount, setGroupByAccount] = useState(false);
    const [sortBy, setSortBy] = useState('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    
    // Filters for Metrics page
    const [metricPeriod, setMetricPeriod] = useState<Period>(Period.Last7Days);
    const [metricStartDate, setMetricStartDate] = useState('');
    const [metricEndDate, setMetricEndDate] = useState('');
    const [metricAccountFilter, setMetricAccountFilter] = useState('');

    // Filters for Analytics Chart
    const [chartMetric, setChartMetric] = useState<'GMV' | 'Lucro' | 'Views'>('GMV');
    const [chartPeriod, setChartPeriod] = useState<Period>(Period.Last7Days);
    const [chartStartDate, setChartStartDate] = useState('');
    const [chartEndDate, setChartEndDate] = useState('');


    // --- ERROR HANDLER --- //
    const handleFirestoreError = (error: any, action: string) => {
        console.error(`Erro ao ${action}:`, error);
        let userMessage = `Falha ao ${action}. Tente novamente.`;

        switch (error.code) {
            case 'permission-denied':
                userMessage = `Falha ao ${action}: Permissão negada. Verifique as regras de segurança do Firestore no seu painel Firebase para garantir que o usuário logado (${user.email}) tem permissão para escrever na coleção 'users/${user.uid}/...'.`;
                break;
            case 'unauthenticated':
                userMessage = `Falha ao ${action}: Você não está autenticado. Sua sessão pode ter expirado. Tente fazer o login novamente.`;
                break;
            case 'unavailable':
                userMessage = `Falha ao ${action}: O serviço está temporariamente indisponível. Tente novamente mais tarde.`;
                break;
            default:
                 userMessage = `Ocorreu um erro inesperado ao ${action} (${error.code || 'sem código'}). Verifique o console para mais detalhes.`;
        }
        alert(userMessage);
    };

    // --- DATA FETCHING --- //
    useEffect(() => {
        const unsubPosts = window.watchUserSubcollection('posts', (data) => {
            setAllPosts(data as Post[]);
        });
        const unsubMetrics = window.watchUserSubcollection('dailyMetrics', (data) => {
            setAllMetrics(data as DailyMetric[]);
        });
        return () => {
            unsubPosts();
            unsubMetrics();
        };
    }, []);

    // --- COMPUTED DATA & MEMOS --- //
    const totalGmv = useMemo(() => {
        return allMetrics.reduce((sum, metric) => sum + metric.gmv, 0);
    }, [allMetrics]);

    const uniqueAccounts = useMemo(() => {
        const postAccounts = allPosts.map(p => p.account);
        const metricAccounts = allMetrics.map(m => m.account);
        return [...new Set([...postAccounts, ...metricAccounts])].filter(Boolean);
    }, [allPosts, allMetrics]);

    const dateRange = useMemo(() => {
        if (period === Period.Custom) {
            return {
                start: startDate ? startOfDay(parseISO(startDate)) : null,
                end: endDate ? endOfDay(parseISO(endDate)) : null
            };
        }
        if (period === Period.All) {
            return { start: null, end: null };
        }
        return getPeriodRange(period);
    }, [period, startDate, endDate]);

    const filteredPosts = useMemo(() => {
        return allPosts
            .map(post => ({
                ...post,
                derivedStatus: getStatus(post)
            }))
            .filter(post => {
                const matchesAccount = !accountFilter || post.account === accountFilter;
                if (period === Period.All) {
                    return matchesAccount;
                }
                const postDate = parseISO(post.date);
                const isAfterStart = !dateRange.start || postDate >= dateRange.start;
                const isBeforeEnd = !dateRange.end || postDate <= dateRange.end;
                return isAfterStart && isBeforeEnd && matchesAccount;
            });
    }, [allPosts, dateRange, accountFilter, period]);

    const postCounts = useMemo(() => {
        return filteredPosts.reduce((acc, post) => {
            if (post.derivedStatus === Status.Posted) acc.posted++;
            else if (post.derivedStatus === Status.Pending) acc.pending++;
            else if (post.derivedStatus === Status.Overdue) acc.overdue++;
            return acc;
        }, { posted: 0, pending: 0, overdue: 0 });
    }, [filteredPosts]);

    const sortedPosts = useMemo(() => {
        return [...filteredPosts].sort((a, b) => {
            const valA = a[sortBy as keyof Post] ?? '';
            const valB = b[sortBy as keyof Post] ?? '';
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPosts, sortBy, sortDir]);

    const metricDateRange = useMemo(() => {
        if (metricPeriod === Period.Custom) {
            return {
                start: metricStartDate ? startOfDay(parseISO(metricStartDate)) : null,
                end: metricEndDate ? endOfDay(parseISO(metricEndDate)) : null
            };
        }
        if (metricPeriod === Period.All) {
            return { start: null, end: null };
        }
        return getPeriodRange(metricPeriod);
    }, [metricPeriod, metricStartDate, metricEndDate]);

    const filteredMetrics = useMemo(() => {
        if (!metricDateRange.start || !metricDateRange.end) {
             return metricPeriod === Period.All ? allMetrics.filter(m => !metricAccountFilter || m.account === metricAccountFilter) : [];
        }
        return allMetrics.filter(metric => {
            const metricDate = parseISO(metric.date);
            const isAfterStart = !metricDateRange.start || metricDate >= metricDateRange.start;
            const isBeforeEnd = !metricDateRange.end || metricDate <= metricDateRange.end;
            const matchesAccount = !metricAccountFilter || metric.account === metricAccountFilter;
            return isAfterStart && isBeforeEnd && matchesAccount;
        });
    }, [allMetrics, metricDateRange, metricAccountFilter, metricPeriod]);

    const postedPostsInPeriod = useMemo(() => {
        if (!metricDateRange.start || !metricDateRange.end) {
            return metricPeriod === Period.All ? allPosts.filter(p => p.isPosted) : [];
        }
        return allPosts.filter(p => {
            if (!p.isPosted || !p.postedAt) return false;
            const postDate = parseISO(p.postedAt);
            return postDate >= metricDateRange.start! && postDate <= metricDateRange.end!;
        });
    }, [allPosts, metricDateRange, metricPeriod]);
    
    const kpiData = useMemo(() => {
        const baseKpis = filteredMetrics.reduce((acc, metric) => {
            acc.gmv += metric.gmv;
            acc.lucro += metric.lucro;
            acc.sales += metric.sales;
            acc.clicks += metric.clicks;
            acc.views += metric.views;
            return acc;
        }, { gmv: 0, lucro: 0, sales: 0, clicks: 0, views: 0 });

        const videosPostados = postedPostsInPeriod.length;
        const rpp = videosPostados > 0 ? baseKpis.gmv / videosPostados : 0;

        return { ...baseKpis, videosPostados, rpp };
    }, [filteredMetrics, postedPostsInPeriod]);

    const chartDateRange = useMemo(() => {
        if (chartPeriod === Period.Custom) {
            return {
                start: chartStartDate ? startOfDay(parseISO(chartStartDate)) : null,
                end: chartEndDate ? endOfDay(parseISO(chartEndDate)) : null
            };
        }
        return getPeriodRange(chartPeriod);
    }, [chartPeriod, chartStartDate, chartEndDate]);


    const analyticsChartData = useMemo(() => {
        if (!chartDateRange.start || !chartDateRange.end) return [];

        const metricsForChart = allMetrics.filter(metric => {
            const matchesAccount = !metricAccountFilter || metric.account === metricAccountFilter;
            if (!matchesAccount) return false;
            
            const metricDate = parseISO(metric.date);
            return metricDate >= chartDateRange.start! && metricDate <= chartDateRange.end!;
        });
        
        const days = eachDayOfInterval({ start: chartDateRange.start, end: chartDateRange.end });
        
        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const metricsForDay = metricsForChart.filter(m => m.date === dayStr);
            const value = metricsForDay.reduce((sum, m) => {
                switch (chartMetric) {
                    case 'GMV': return sum + m.gmv;
                    case 'Lucro': return sum + m.lucro;
                    case 'Views': return sum + m.views;
                    default: return sum;
                }
            }, 0);

            return {
                name: format(day, 'dd/MM'),
                [chartMetric]: value,
            };
        });
    }, [allMetrics, chartDateRange, chartMetric, metricAccountFilter]);


    // --- EVENT HANDLERS --- //
    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDir('desc');
        }
    };

    const handleAddPost = () => {
        setPostToEdit(null);
        setPostModalOpen(true);
    };

    const handleEditPost = (post: Post) => {
        setPostToEdit(post);
        setPostModalOpen(true);
    };

    const handleDeletePost = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                await window.deleteUserSubcollectionDoc('posts', id);
            } catch (error) {
                handleFirestoreError(error, 'excluir o post');
            }
        }
    };
    
    const handleSavePost = async (post: Post) => {
        try {
            if (post.id) {
                // Adjust date from input to be stored correctly (midnight UTC)
                const localDate = parseISO(post.date);
                const correctedPost = { ...post, date: localDate.toISOString() };
                await window.updateUserSubcollectionDoc('posts', post.id, correctedPost);
            } else {
                const newId = `post_${Date.now()}`;
                const localDate = parseISO(post.date);
                const newPost = { ...post, id: newId, date: localDate.toISOString() };
                await window.addUserSubcollectionDoc('posts', newPost);
            }
            setPostModalOpen(false);
        } catch (error) {
             handleFirestoreError(error, post.id ? 'atualizar o post' : 'salvar o post');
        }
    };

    const handleSetPosted = async (id: string, isPosted: boolean) => {
        try {
            const data: { isPosted: boolean; postedAt?: string } = { isPosted };
            if (isPosted) {
                data.postedAt = new Date().toISOString();
            }
            await window.updateUserSubcollectionDoc('posts', id, data);
        } catch (error) {
            handleFirestoreError(error, 'atualizar o status do post');
        }
    };
    
    const handleAddMetric = () => {
        setMetricToEdit(null);
        setMetricModalOpen(true);
    };

    const handleEditMetric = (metric: DailyMetric) => {
        setMetricToEdit(metric);
        setMetricModalOpen(true);
    };

    const handleSaveMetric = async (metric: Omit<DailyMetric, 'createdAt'> & { id?: string }) => {
        try {
            if (metric.id) {
                await window.updateUserSubcollectionDoc('dailyMetrics', metric.id, metric);
            } else {
                 await window.addUserSubcollectionDoc('dailyMetrics', metric);
            }
            setMetricModalOpen(false);
        } catch (error) {
            handleFirestoreError(error, metric.id ? 'atualizar a métrica' : 'salvar a métrica');
        }
    };
    
    const handleDeleteMetric = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro diário?')) {
            try {
                await window.deleteUserSubcollectionDoc('dailyMetrics', id);
            // Fix: Add curly braces to the catch block to fix the syntax error.
            } catch (error) {
                handleFirestoreError(error, 'excluir a métrica');
            }
        }
    };


    return (
        <div className="flex h-screen bg-black text-gray-200 overflow-hidden">
             {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 sm:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            <Sidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                user={user}
                logout={logout}
            />

            <main className="flex-1 flex flex-col">
                <Header 
                    onAddPost={handleAddPost} 
                    onAddMetric={handleAddMetric} 
                    currentPage={currentPage}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    gmvData={{ current: totalGmv, goal: 250000 }}
                />
                
                <div className="flex-1 p-4 sm:p-6 overflow-auto">
                    {currentPage === 'metrics' && (
                        <div className="space-y-6">
                             <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Análise de Métricas</h2>
                            </div>
                            {/* Metric Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Período</label>
                                    <select value={metricPeriod} onChange={e => setMetricPeriod(e.target.value as Period)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white">
                                        {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                {metricPeriod === Period.Custom && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Início</label>
                                            <input type="date" value={metricStartDate} onChange={e => setMetricStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Fim</label>
                                            <input type="date" value={metricEndDate} onChange={e => setMetricEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"/>
                                        </div>
                                    </>
                                )}
                                 <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Conta</label>
                                    <select value={metricAccountFilter} onChange={e => setMetricAccountFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white">
                                        <option value="">Todas as Contas</option>
                                        {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* KPIs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                <KpiCard title="GMV" value={`R$ ${kpiData.gmv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                <KpiCard title="Lucro (Comissão)" value={`R$ ${kpiData.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                <KpiCard title="Itens Vendidos" value={kpiData.sales.toLocaleString('pt-BR')} />
                                <KpiCard title="Vídeos Postados" value={kpiData.videosPostados.toLocaleString('pt-BR')} />
                                <KpiCard title="RPP" value={`R$ ${kpiData.rpp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                <KpiCard title="Views" value={kpiData.views.toLocaleString('pt-BR')} />
                                <KpiCard title="Cliques" value={kpiData.clicks.toLocaleString('pt-BR')} />
                            </div>
                            
                            {/* Chart */}
                            <div className="bg-gray-900/50 border border-gray-800 p-4 sm:p-6 rounded-lg">
                                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                    <h3 className="text-xl font-bold text-white">Análise Gráfica</h3>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value as any)} className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white">
                                            <option value="GMV">GMV</option>
                                            <option value="Lucro">Lucro</option>
                                            <option value="Views">Views</option>
                                        </select>
                                        <select value={chartPeriod} onChange={e => setChartPeriod(e.target.value as Period)} className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white">
                                            {Object.values(Period).filter(p => p !== Period.All).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        {chartPeriod === Period.Custom && (
                                            <>
                                                <input type="date" value={chartStartDate} onChange={e => setChartStartDate(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"/>
                                                <input type="date" value={chartEndDate} onChange={e => setChartEndDate(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"/>
                                            </>
                                        )}
                                    </div>
                                </div>
                                 <div style={{ width: '100%', height: 300 }}>
                                      <ResponsiveContainer>
                                        <LineChart data={analyticsChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                            <XAxis dataKey="name" stroke="#A0AEC0" />
                                            <YAxis stroke="#A0AEC0" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }} />
                                            <Line type="monotone" dataKey={chartMetric} name={chartMetric} stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                 </div>
                            </div>
                             {/* Metric Table */}
                            <MetricTable metrics={filteredMetrics} onEdit={handleEditMetric} onDelete={handleDeleteMetric} />

                        </div>
                    )}
                    {currentPage === 'posts' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Performance de Conteúdo</h2>

                            {/* Post KPIs */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <PostStatCard title="Total" value={filteredPosts.length} bgColorClass="bg-blue-900" />
                                <PostStatCard title="Postados" value={postCounts.posted} bgColorClass="bg-green-900" />
                                <PostStatCard title="Pendentes" value={postCounts.pending} bgColorClass="bg-orange-900" />
                                <PostStatCard title="Atrasados" value={postCounts.overdue} bgColorClass="bg-red-900" />
                            </div>

                            {/* Post Filters */}
                            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Período</label>
                                        <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white">
                                            {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    {period === Period.Custom && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Data Início</label>
                                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"/>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Data Fim</label>
                                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"/>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Conta</label>
                                        <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white">
                                            <option value="">Todas as Contas</option>
                                            {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 border-t border-gray-800 pt-4 gap-4">
                                     <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input type="checkbox" checked={groupByAccount} onChange={e => setGroupByAccount(e.target.checked)} className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-primary-600 focus:ring-primary-500" />
                                        Agrupar por conta (Tabela)
                                    </label>
                                </div>
                            </div>
                            
                            {/* Content view */}
                            <PostTable
                                posts={sortedPosts}
                                groupByAccount={groupByAccount}
                                onEdit={handleEditPost}
                                onDelete={handleDeletePost}
                                onSetPosted={handleSetPosted}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />

                            <ContentPerformanceChart posts={allPosts} />
                        </div>
                    )}
                </div>
            </main>

            {isPostModalOpen && <PostFormModal onClose={() => setPostModalOpen(false)} onSave={handleSavePost} post={postToEdit} accounts={uniqueAccounts} />}
            {isMetricModalOpen && <DailyMetricFormModal onClose={() => setMetricModalOpen(false)} onSave={handleSaveMetric} metricToEdit={metricToEdit} accounts={uniqueAccounts} />}
        </div>
    );
};

export default Dashboard;