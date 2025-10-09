import React, { useState, useMemo, useCallback } from 'react';
import { Post, User, Status, Period, Format } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getPeriodRange, getStatus } from '../utils/dateUtils';
import PostTable from './PostTable';
import PostFormModal from './PostFormModal';
import AnalyticsChart from './AnalyticsChart';

interface DashboardProps {
    user: User;
    logout: () => void;
}

type SortKey = keyof Pick<Post, 'date' | 'account' | 'product' | 'format'>;

const Dashboard: React.FC<DashboardProps> = ({ user, logout }) => {
    const [posts, setPosts] = useLocalStorage<Post[]>(`posts_${user.username}`, []);
    const [period, setPeriod] = useState<Period>(Period.Weekly);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | 'Todos'>('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [groupByAccount, setGroupByAccount] = useState(false);
    const [sortBy, setSortBy] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleAddPost = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleDeletePost = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            setPosts(posts.filter(p => p.id !== id));
        }
    };

    const handleSavePost = (post: Post) => {
        if (post.id) {
            setPosts(posts.map(p => p.id === post.id ? post : p));
        } else {
            setPosts([...posts, { ...post, id: Date.now().toString() }]);
        }
        setIsModalOpen(false);
        setEditingPost(null);
    };
    
    const setPostedState = (id: string, isPosted: boolean) => {
        setPosts(posts.map(p => p.id === id ? { ...p, isPosted, postedAt: isPosted ? new Date().toISOString() : undefined } : p));
    };

    const dateRange = useMemo(() => getPeriodRange(period), [period]);

    const filteredPosts = useMemo(() => {
        return posts
            .map(p => ({ ...p, derivedStatus: getStatus(p) }))
            .filter(p => {
                const postDate = new Date(p.date);
                const inDateRange = postDate >= dateRange.start && postDate <= dateRange.end;
                const matchesSearch = p.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.info.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.product.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'Todos' || p.derivedStatus === statusFilter;
                return inDateRange && matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
    }, [posts, dateRange, searchTerm, statusFilter, sortBy, sortDir]);

    const kpis = useMemo(() => {
        const postsInPeriod = posts
            .map(p => ({ ...p, derivedStatus: getStatus(p) }))
            .filter(p => {
                const postDate = new Date(p.date);
                return postDate >= dateRange.start && postDate <= dateRange.end;
            });
        return {
            total: postsInPeriod.length,
            posted: postsInPeriod.filter(p => p.derivedStatus === Status.Posted).length,
            pending: postsInPeriod.filter(p => p.derivedStatus === Status.Pending).length,
            overdue: postsInPeriod.filter(p => p.derivedStatus === Status.Overdue).length,
        };
    }, [posts, dateRange]);

    const uniqueAccounts = useMemo(() => [...new Set(posts.map(p => p.account).filter(Boolean))].sort(), [posts]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <header className="relative flex items-center justify-center h-16">
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <img src="https://iili.io/KwW3VNj.png" alt="Logo" className="h-12 w-auto" />
                </div>
                <h1 className="text-3xl font-bold text-white">Painel de Postagens</h1>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-right">
                    <p className="text-gray-400 text-sm">Bem-vindo, {user.username}!</p>
                    <button onClick={logout} className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
                        Sair
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm">Total no Período</h3>
                    <p className="text-2xl font-bold text-white">{kpis.total}</p>
                </div>
                <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-lg">
                    <h3 className="text-green-400/80 text-sm">Postados</h3>
                    <p className="text-2xl font-bold text-green-400">{kpis.posted}</p>
                </div>
                <div className="bg-orange-900/30 border border-orange-700/50 p-4 rounded-lg">
                    <h3 className="text-orange-400/80 text-sm">Pendentes</h3>
                    <p className="text-2xl font-bold text-orange-400">{kpis.pending}</p>
                </div>
                <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg">
                    <h3 className="text-red-400/80 text-sm">Atrasados</h3>
                    <p className="text-2xl font-bold text-red-400">{kpis.overdue}</p>
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-grow">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">Buscar</label>
                        <input type="text" id="search" placeholder="Buscar por conta, produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500"/>
                    </div>
                    <div>
                        <label htmlFor="period" className="block text-sm font-medium text-gray-400 mb-1">Período</label>
                        <select id="period" value={period} onChange={e => setPeriod(e.target.value as Period)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500">
                            {Object.values(Period).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                        <select id="status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as (Status | 'Todos'))} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500">
                            <option value="Todos">Todos</option>
                            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="group-account" checked={groupByAccount} onChange={e => setGroupByAccount(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500"/>
                        <label htmlFor="group-account" className="ml-2 block text-sm text-gray-300">Agrupar por conta</label>
                    </div>
                    <button onClick={handleAddPost} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors">
                        Novo Registro
                    </button>
                </div>
            </div>

            <PostTable 
                posts={filteredPosts}
                groupByAccount={groupByAccount}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onSetPosted={setPostedState}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={(key) => {
                    if (sortBy === key) {
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                        setSortBy(key);
                        setSortDir('desc');
                    }
                }}
            />
            
            <AnalyticsChart allPosts={posts} />

            {isModalOpen && (
                <PostFormModal
                    post={editingPost}
                    onSave={handleSavePost}
                    onClose={() => setIsModalOpen(false)}
                    accounts={uniqueAccounts}
                />
            )}
        </div>
    );
};

export default Dashboard;