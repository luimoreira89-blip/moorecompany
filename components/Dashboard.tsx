

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Post, User, Status, Period, Format } from '../types';
import { getPeriodRange, getStatus } from '../utils/dateUtils';
import PostTable from './PostTable';
import PostFormModal from './PostFormModal';
import AnalyticsChart from './AnalyticsChart';
import { isValidDriveLink } from '../utils/postUtils';
// Fix: Consolidate date-fns imports to resolve module resolution errors.
import { parseISO, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';
// Fix: Add missing `Legend` import from recharts.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import PostBoard from './PostBoard';


// --- SUB-COMPONENTS --- //
declare global {
    interface Window {
        watchUserSubcollection: (collectionName: string, callback: (data: any[]) => void) => () => void;
        addUserSubcollectionDoc: (collectionName: string, data: any) => Promise<any>;
        updateUserSubcollectionDoc: (collectionName: string, docId: string, data: any) => Promise<void>;
        deleteUserSubcollectionDoc: (collectionName: string, docId: string) => Promise<void>;
    }
}

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
                           <label htmlFor="sales" className="block text-sm font-medium text-gray-300">Vendas</label>
                           <input type="number" step="1" name="sales" value={formData.sales} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                           <label htmlFor="clicks" className="block text-sm font-medium text-gray-300">Cliques</label>
                           <input type="number" step="1" name="clicks" value={formData.clicks} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div className="md:col-span-2">
                           <label htmlFor="views" className="block text-sm font-medium text-gray-300">Visualizações</label>
                           <input type="number" step="1" name="views" value={formData.views} onChange={handleChange} required className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
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


const MetricTable: React.FC<{ metrics: DailyMetric[]; onEdit: (metric: DailyMetric) => void; onDelete: (id: string) => void; }> = ({ metrics, onEdit, onDelete }) => {
    const sortedMetrics = [...metrics].sort((a, b) => b.date.localeCompare(a.date));
    
    return (
        <div className="overflow-x-auto bg-gray-800/50 border border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
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
                <tbody className="divide-y divide-gray-700">
                    {sortedMetrics.map(metric => (
                        <tr key={metric.id} className="bg-gray-800 hover:bg-gray-700/50 transition-colors">
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
                     {sortedMetrics.length === 0 && (
                        <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-500">Nenhum registro encontrado para o período selecionado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const Header: React.FC<{ user: User; logout: () => void; onAddPost: () => void; onAddMetric: () => void; currentPage: string; }> = ({ user, logout, onAddPost, onAddMetric, currentPage }) => {
    return (
        <header className="bg-gray-800/50 border-b border-gray-700 p-4 flex justify-between items-center">
            <div>
                {/* O título da página será renderizado no conteúdo principal agora */}
            </div>
            <div className="flex items-center gap-4">
                 <button onClick={currentPage === 'posts' ? onAddPost : onAddMetric} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    <span>{currentPage === 'posts' ? 'Adicionar Post' : 'Adicionar Registro'}</span>
                </button>
                <div className="flex items-center gap-3">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=3730a3&color=fff`} alt="User Avatar" className="h-10 w-10 rounded-full" />
                    <div>
                         <p className="font-semibold text-white">{user.displayName || user.username}</p>
                         <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <button onClick={logout} className="text-gray-400 hover:text-white" title="Sair">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>
        </header>
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
    const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

    // Filters for Posts
    const [period, setPeriod] = useState<Period>(Period.Last7Days);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [accountFilter, setAccountFilter] = useState('');
    const [groupByAccount, setGroupByAccount] = useState(false);
    const [sortBy, setSortBy] = useState('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    
    // Filters for Metrics
    const [metricPeriod, setMetricPeriod] = useState<Period>(Period.Last7Days);
    const [metricStartDate, setMetricStartDate] = useState('');
    const [metricEndDate, setMetricEndDate] = useState('');
    const [metricAccountFilter, setMetricAccountFilter] = useState('');


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
        return getPeriodRange(period);
    }, [period, startDate, endDate]);

    const filteredPosts = useMemo(() => {
        return allPosts
            .map(post => ({
                ...post,
                derivedStatus: getStatus(post)
            }))
            .filter(post => {
                const postDate = parseISO(post.date);
                const isAfterStart = !dateRange.start || postDate >= dateRange.start;
                const isBeforeEnd = !dateRange.end || postDate <= dateRange.end;
                const matchesAccount = !accountFilter || post.account === accountFilter;
                return isAfterStart && isBeforeEnd && matchesAccount;
            });
    }, [allPosts, dateRange, accountFilter]);

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
        return getPeriodRange(metricPeriod);
    }, [metricPeriod, metricStartDate, metricEndDate]);

    const filteredMetrics = useMemo(() => {
        return allMetrics.filter(metric => {
            const metricDate = parseISO(metric.date);
            const isAfterStart = !metricDateRange.start || metricDate >= metricDateRange.start;
            const isBeforeEnd = !metricDateRange.end || metricDate <= metricDateRange.end;
            const matchesAccount = !metricAccountFilter || metric.account === metricAccountFilter;
            return isAfterStart && isBeforeEnd && matchesAccount;
        });
    }, [allMetrics, metricDateRange, metricAccountFilter]);
    
    const kpiData = useMemo(() => {
        return filteredMetrics.reduce((acc, metric) => {
            acc.gmv += metric.gmv;
            acc.lucro += metric.lucro;
            acc.sales += metric.sales;
            acc.clicks += metric.clicks;
            acc.views += metric.views;
            return acc;
        }, { gmv: 0, lucro: 0, sales: 0, clicks: 0, views: 0 });
    }, [filteredMetrics]);

    const dailyChartData = useMemo(() => {
        if (!metricDateRange.start || !metricDateRange.end) return [];

        const days = eachDayOfInterval({ start: metricDateRange.start, end: metricDateRange.end });
        
        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const metricsForDay = filteredMetrics.filter(m => m.date === dayStr);
            return {
                name: format(day, 'dd/MM'),
                GMV: metricsForDay.reduce((sum, m) => sum + m.gmv, 0),
                Lucro: metricsForDay.reduce((sum, m) => sum + m.lucro, 0),
            };
        });
    }, [filteredMetrics, metricDateRange]);


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
                console.error("Error deleting post:", error);
                alert("Failed to delete post.");
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
             console.error("Error saving post:", error);
             alert("Failed to save post.");
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
            console.error("Error updating post status:", error);
            alert("Failed to update post status.");
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
            console.error("Error saving metric:", error);
            alert("Failed to save metric.");
        }
    };
    
    const handleDeleteMetric = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro diário?')) {
            try {
                await window.deleteUserSubcollectionDoc('dailyMetrics', id);
            } catch (error) {
                console.error("Error deleting metric:", error);
                alert("Failed to delete metric.");
            }
        }
    };


    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

            <main className="flex-1 flex flex-col">
                <Header user={user} logout={logout} onAddPost={handleAddPost} onAddMetric={handleAddMetric} currentPage={currentPage} />
                
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
                                    <select value={metricPeriod} onChange={e => setMetricPeriod(e.target.value as Period)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                                        {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                {metricPeriod === Period.Custom && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Início</label>
                                            <input type="date" value={metricStartDate} onChange={e => setMetricStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Fim</label>
                                            <input type="date" value={metricEndDate} onChange={e => setMetricEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                                        </div>
                                    </>
                                )}
                                 <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Conta</label>
                                    <select value={metricAccountFilter} onChange={e => setMetricAccountFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                                        <option value="">Todas as Contas</option>
                                        {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* KPIs */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <KpiCard title="GMV Total" value={`R$ ${kpiData.gmv.toFixed(2)}`} />
                                <KpiCard title="Lucro Total" value={`R$ ${kpiData.lucro.toFixed(2)}`} />
                                <KpiCard title="Vendas" value={kpiData.sales.toString()} />
                                <KpiCard title="Cliques" value={kpiData.clicks.toString()} />
                                <KpiCard title="Visualizações" value={kpiData.views.toString()} />
                            </div>
                            
                            {/* Chart */}
                            <div className="bg-gray-800/50 border border-gray-700 p-4 sm:p-6 rounded-lg">
                                 <h3 className="text-xl font-bold text-white mb-4">GMV & Lucro por Dia</h3>
                                 <div style={{ width: '100%', height: 300 }}>
                                      <ResponsiveContainer>
                                        <BarChart data={dailyChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                            <XAxis dataKey="name" stroke="#A0AEC0" />
                                            <YAxis stroke="#A0AEC0" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }} />
                                            <Legend />
                                            <Bar dataKey="GMV" fill="#818cf8">
                                                <LabelList dataKey="GMV" position="top" formatter={(value: number) => value > 0 ? `R$${value.toFixed(0)}` : ''} style={{ fill: '#e2e8f0', fontSize: '12px' }} />
                                            </Bar>
                                            <Bar dataKey="Lucro" fill="#22c55e">
                                                <LabelList dataKey="Lucro" position="top" formatter={(value: number) => value > 0 ? `R$${value.toFixed(0)}` : ''} style={{ fill: '#e2e8f0', fontSize: '12px' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                            </div>
                             {/* Metric Table */}
                            <MetricTable metrics={filteredMetrics} onEdit={handleEditMetric} onDelete={handleDeleteMetric} />

                        </div>
                    )}
                    {currentPage === 'posts' && (
                        <div className="space-y-6">
                             <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Performance de Conteúdo</h2>
                                <div className="flex items-center bg-gray-800 rounded-md p-1 border border-gray-700">
                                    <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Tabela</button>
                                    <button onClick={() => setViewMode('board')} className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'board' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Quadro</button>
                                </div>
                            </div>
                            {/* Post Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Período</label>
                                    <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                                        {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                {period === Period.Custom && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Início</label>
                                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Fim</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"/>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Conta</label>
                                    <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                                        <option value="">Todas as Contas</option>
                                        {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input type="checkbox" checked={groupByAccount} onChange={e => setGroupByAccount(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500" />
                                        Agrupar por conta
                                    </label>
                                </div>
                            </div>

                            {/* Content view */}
                            {viewMode === 'table' ? (
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
                            ) : (
                                <PostBoard
                                    posts={sortedPosts}
                                    onEdit={handleEditPost}
                                    onDelete={handleDeletePost}
                                    onSetPosted={handleSetPosted}
                                />
                            )}
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
