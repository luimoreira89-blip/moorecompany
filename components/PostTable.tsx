import React from 'react';
import { Post, Status } from '../types';
import { formatPostDate, formatTimestamp } from '../utils/dateUtils';
import { STATUS_COLORS } from '../constants';

interface PostTableProps {
    posts: (Post & { derivedStatus: Status })[];
    groupByAccount: boolean;
    onEdit: (post: Post) => void;
    onDelete: (id: string) => void;
    onSetPosted: (id: string, isPosted: boolean) => void;
    onDuplicate: (post: Post) => void;
    sortBy: string;
    sortDir: 'asc' | 'desc';
    onSort: (key: any) => void;
}

const SortableHeader: React.FC<{ title: string; sortKey: string; sortBy: string; sortDir: 'asc' | 'desc'; onSort: (key: string) => void; className?: string }> = ({ title, sortKey, sortBy, sortDir, onSort, className }) => {
    const isSorted = sortBy === sortKey;
    const icon = isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '';
    return (
        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer ${className}`} onClick={() => onSort(sortKey)}>
            {title} {icon}
        </th>
    );
};

const DesktopPostRow: React.FC<{ post: Post & { derivedStatus: Status }; onEdit: (post: Post) => void; onDelete: (id: string) => void; onSetPosted: (id: string, isPosted: boolean) => void; onDuplicate: (post: Post) => void; }> = ({ post, onEdit, onDelete, onSetPosted, onDuplicate }) => (
    <tr className="bg-gray-900 hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{post.account}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{formatPostDate(post.date)}</td>
        <td className="px-4 py-4 whitespace-normal text-sm text-gray-300 max-w-xs truncate">{post.info}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{post.product}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{post.format}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={post.isPosted}
                    onChange={(e) => onSetPosted(post.id, e.target.checked)}
                />
                <div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[post.derivedStatus]}`}>
                        {post.derivedStatus}
                    </span>
                    {post.isPosted && post.postedAt && (
                        <p className="text-xs text-gray-500 mt-1">{formatTimestamp(post.postedAt)}</p>
                    )}
                </div>
            </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center">
            {post.driveLink && (
                <a href={post.driveLink} target="_blank" rel="noopener noreferrer" title="Abrir link do criativo">
                    <span role="img" aria-label="Claquete" className="text-2xl hover:opacity-80 transition-opacity">🎬</span>
                </a>
            )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center">
            {post.copyLink && (
                <a href={post.copyLink} target="_blank" rel="noopener noreferrer" title="Abrir link da copy">
                    <span role="img" aria-label="Mão escrevendo" className="text-2xl hover:opacity-80 transition-opacity">✍️</span>
                </a>
            )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end gap-4">
                <button onClick={() => onEdit(post)} className="text-primary-400 hover:text-primary-300">Editar</button>
                <button onClick={() => onDuplicate(post)} className="text-yellow-400 hover:text-yellow-300">Duplicar</button>
                <button onClick={() => onDelete(post.id)} className="text-red-400 hover:text-red-300">Excluir</button>
            </div>
        </td>
    </tr>
);

type GroupedData = {
    posts: (Post & { derivedStatus: Status })[];
    stats: { posted: number; pending: number; overdue: number };
};

const PostTable: React.FC<PostTableProps> = ({ posts, groupByAccount, ...props }) => {
    const { onEdit, onDelete, onSetPosted, onDuplicate } = props;
    const totalColumns = 9;

    const groupedPosts = React.useMemo(() => {
        if (!groupByAccount) return null;
        return posts.reduce((acc: Record<string, GroupedData>, post) => {
            const account = post.account || 'Sem Conta';
            if (!acc[account]) {
                acc[account] = { posts: [], stats: { posted: 0, pending: 0, overdue: 0 } };
            }
            acc[account].posts.push(post);
            if (post.derivedStatus === Status.Posted) acc[account].stats.posted++;
            else if (post.derivedStatus === Status.Pending) acc[account].stats.pending++;
            else if (post.derivedStatus === Status.Overdue) acc[account].stats.overdue++;
            return acc;
        }, {});
    }, [posts, groupByAccount]);

    return (
        <div>
            {/* Mobile Card View */}
            <div className="space-y-4 sm:hidden">
                {posts.map(post => (
                    <div key={post.id} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-white truncate pr-2">{post.account}</span>
                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[post.derivedStatus]}`}>{post.derivedStatus}</span>
                        </div>
                        
                        <div className="text-sm text-gray-300 space-y-1">
                           <p><strong>Data:</strong> {formatPostDate(post.date)}</p>
                           {post.product && <p><strong>Produto:</strong> {post.product}</p>}
                           <p><strong>Formato:</strong> {post.format}</p>
                           {post.info && <p className="pt-2 border-t border-gray-700/50 mt-2"><strong>Info:</strong> {post.info}</p>}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                            <div className="flex items-center gap-4">
                                {post.driveLink && <a href={post.driveLink} target="_blank" rel="noopener noreferrer" title="Abrir link do criativo"><span role="img" aria-label="Claquete" className="text-2xl">🎬</span></a>}
                                {post.copyLink && <a href={post.copyLink} target="_blank" rel="noopener noreferrer" title="Abrir link da copy"><span role="img" aria-label="Mão escrevendo" className="text-2xl">✍️</span></a>}
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id={`mobile-posted-${post.id}`} checked={post.isPosted} onChange={(e) => onSetPosted(post.id, e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500" />
                                <label htmlFor={`mobile-posted-${post.id}`} className="text-sm text-gray-300">Postado</label>
                            </div>
                        </div>
                         {post.isPosted && post.postedAt && (
                            <p className="text-xs text-gray-500 text-right -mt-2">{formatTimestamp(post.postedAt)}</p>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => onEdit(post)} className="text-sm text-primary-400 hover:text-primary-300">Editar</button>
                            <button onClick={() => onDuplicate(post)} className="text-sm text-yellow-400 hover:text-yellow-300">Duplicar</button>
                            <button onClick={() => onDelete(post.id)} className="text-sm text-red-400 hover:text-red-300">Excluir</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-gray-900/50 border border-gray-800 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-900">
                        <tr>
                            <SortableHeader title="Conta" sortKey="account" {...props} />
                            <SortableHeader title="Data" sortKey="date" {...props} />
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Informações</th>
                            <SortableHeader title="Produto" sortKey="product" {...props} />
                            <SortableHeader title="Formato" sortKey="format" {...props} />
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Criativo</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Copy</th>
                            <th scope="col" className="relative px-4 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {groupedPosts ? (
                            Object.keys(groupedPosts).map((account) => {
                                const data = groupedPosts[account];
                                return (
                                    <React.Fragment key={account}>
                                        <tr className="bg-dark-bg">
                                            <td colSpan={totalColumns} className="px-4 py-3 text-sm font-bold text-primary-300">
                                                <div className="flex justify-between items-center">
                                                    <span>{account}</span>
                                                    <div className="flex gap-4 text-xs font-normal">
                                                        <span className="text-green-400">Postados: {data.stats.posted}</span>
                                                        <span className="text-orange-400">Pendentes: {data.stats.pending}</span>
                                                        <span className="text-red-400">Atrasados: {data.stats.overdue}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {data.posts.map(post => <DesktopPostRow key={post.id} post={post} {...props} />)}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            posts.map(post => <DesktopPostRow key={post.id} post={post} {...props} />)
                        )}
                    </tbody>
                </table>
            </div>
            
             {(posts.length === 0) && (
                <div className="text-center py-10 text-gray-500">Nenhum registro encontrado para o período selecionado.</div>
            )}
        </div>
    );
};

export default PostTable;