

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Post, User, Status, Period, Format } from '../types';
import { getPeriodRange, getStatus } from '../utils/dateUtils';
import PostTable from './PostTable';
import PostFormModal from './PostFormModal';
import AnalyticsChart from './AnalyticsChart';
import { isValidDriveLink } from '../utils/postUtils';
// FIX: Import date-fns functions from their specific paths to resolve module export errors.
import { default as parseISO } from 'date-fns/parseISO';
import { default as startOfDay } from 'date-fns/startOfDay';
import { default as endOfDay } from 'date-fns/endOfDay';
import { default as subDays } from 'date-fns/subDays';
import { default as format } from 'date-fns/format';
import { default as eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { default as subHours } from 'date-fns/subHours';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
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
                           <label htmlFor="sales" className="block text-sm font-medium text-