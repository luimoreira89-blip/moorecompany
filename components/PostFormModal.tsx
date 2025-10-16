

import React, { useState, useEffect } from 'react';
import { Post, Format } from '../types';
import { FORMAT_OPTIONS } from '../constants';
import { isValidDriveLink, isValidDocLink } from '../utils/postUtils';

interface PostFormModalProps {
    post: Post | null;
    onSave: (post: Post) => void;
    onClose: () => void;
    accounts: string[];
}

const PostFormModal: React.FC<PostFormModalProps> = ({ post, onSave, onClose, accounts }) => {
    const [formData, setFormData] = useState<Partial<Post>>({
        date: new Date().toISOString().split('T')[0],
        account: '',
        info: '',
        product: '',
        format: Format.UGC,
        driveLink: '',
        copyLink: '',
        isPosted: false,
    });
    const [driveLinkError, setDriveLinkError] = useState<string | null>(null);
    const [copyLinkError, setCopyLinkError] = useState<string | null>(null);

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                date: post.date ? new Date(post.date).toISOString().split('T')[0] : '',
            });
        }
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'driveLink') {
            if (value && !isValidDriveLink(value)) {
                setDriveLinkError('Por favor, insira um link válido do Google Drive.');
            } else {
                setDriveLinkError(null);
            }
        }

        if (name === 'copyLink') {
            if (value && !isValidDocLink(value)) {
                setCopyLinkError('Por favor, insira um link válido do Google Docs.');
            } else {
                setCopyLinkError(null);
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (driveLinkError || copyLinkError) {
            alert(driveLinkError || copyLinkError);
            return;
        }
        onSave(formData as Post);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-lg border border-primary-800 animate-fade-in max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">{post?.id ? 'Editar Registro' : 'Novo Registro'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-300">Data da Postagem *</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                        <label htmlFor="account" className="block text-sm font-medium text-gray-300">Conta *</label>
                        <input type="text" name="account" id="account" list="accounts-list" value={formData.account} onChange={handleChange} required placeholder="@nome_da_conta" className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                        <datalist id="accounts-list">
                            {accounts.map(acc => <option key={acc} value={acc} />)}
                        </datalist>
                    </div>
                    <div>
                        <label htmlFor="driveLink" className="block text-sm font-medium text-gray-300">Link do Criativo (Drive)</label>
                        <input type="url" name="driveLink" id="driveLink" value={formData.driveLink} onChange={handleChange} placeholder="https://drive.google.com/..." className={`mt-1 block w-full bg-dark-bg border ${driveLinkError ? 'border-red-500' : 'border-gray-700'} rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500`} />
                        {driveLinkError && <p className="mt-1 text-sm text-red-400">{driveLinkError}</p>}
                    </div>
                    <div>
                        <label htmlFor="copyLink" className="block text-sm font-medium text-gray-300">Link da Copy (Doc)</label>
                        <input type="url" name="copyLink" id="copyLink" value={formData.copyLink} onChange={handleChange} placeholder="https://docs.google.com/..." className={`mt-1 block w-full bg-dark-bg border ${copyLinkError ? 'border-red-500' : 'border-gray-700'} rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500`} />
                        {copyLinkError && <p className="mt-1 text-sm text-red-400">{copyLinkError}</p>}
                    </div>
                    <div>
                        <label htmlFor="format" className="block text-sm font-medium text-gray-300">Formato *</label>
                        <select name="format" id="format" value={formData.format} onChange={handleChange} required className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                           {FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="info" className="block text-sm font-medium text-gray-300">Informações</label>
                        <textarea name="info" id="info" value={formData.info} onChange={handleChange} rows={2} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
                    </div>
                     <div>
                        <label htmlFor="product" className="block text-sm font-medium text-gray-300">Produto</label>
                        <input type="text" name="product" id="product" value={formData.product} onChange={handleChange} className="mt-1 block w-full bg-dark-bg border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
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

export default PostFormModal;