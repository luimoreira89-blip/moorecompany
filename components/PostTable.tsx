import React from 'react';
import { Post, Status } from '../types';
import { getStatus, formatPostDate, formatTimestamp } from '../utils/dateUtils';
import { STATUS_COLORS } from '../constants';

interface PostTableProps {
    posts: (Post & { derivedStatus: Status })[];
    groupByAccount: boolean;
    onEdit: (post: Post) => void;
    onDelete: (id: string) => void;
    onSetPosted: (id: string, isPosted: boolean) => void;
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


const PostRow: React.FC<{ post: Post & { derivedStatus: Status }; onEdit: (post: Post) => void; onDelete: (id: string) => void; onSetPosted: (id: string, isPosted: boolean) => void; }> = ({ post, onEdit, onDelete, onSetPosted }) => {
    return (
        <tr className="bg-gray-800 hover:bg-gray-700/50 transition-colors">
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{post.account}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{formatPostDate(post.date)}</td>
            <td className="px-4 py-4 text-sm text-gray-300 max-w-xs truncate">{post.info}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{post.product}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{post.format}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm">
                 <div className="flex items-center gap-2">
                    <input 
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500 cursor-pointer"
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
            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-4">
                    {post.driveLink && (
                        <a href={post.driveLink} target="_blank" rel="noopener noreferrer" title="Abrir link do Drive">
                             <img src="https://iili.io/Kwj8bMQ.png" alt="Ícone Google Drive" className="h-6 w-6 hover:opacity-80 transition-opacity" />
                        </a>
                    )}
                    <button onClick={() => onEdit(post)} className="text-primary-400 hover:text-primary-300">Editar</button>
                    <button onClick={() => onDelete(post.id)} className="text-red-400 hover:text-red-300">Excluir</button>
                </div>
            </td>
        </tr>
    );
};


const PostTable: React.FC<PostTableProps> = ({ posts, groupByAccount, ...props }) => {

    const groupedPosts = React.useMemo(() => {
        if (!groupByAccount) return null;
        return posts.reduce((acc, post) => {
            const account = post.account || 'Sem Conta';
            if (!acc[account]) {
                acc[account] = { posts: [], stats: { posted: 0, pending: 0, overdue: 0 }};
            }
            acc[account].posts.push(post);
            if (post.derivedStatus === Status.Posted) acc[account].stats.posted++;
            else if (post.derivedStatus === Status.Pending) acc[account].stats.pending++;
            else if (post.derivedStatus === Status.Overdue) acc[account].stats.overdue++;
            return acc;
        }, {} as Record<string, { posts: (Post & { derivedStatus: Status })[], stats: { posted: number, pending: number, overdue: number } }>);
    }, [posts, groupByAccount]);

    return (
        <div className="overflow-x-auto bg-gray-800/50 border border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                    <tr>
                        <SortableHeader title="Conta" sortKey="account" {...props} />
                        <SortableHeader title="Data" sortKey="date" {...props} />
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Informações</th>
                        <SortableHeader title="Produto" sortKey="product" {...props} />
                        <SortableHeader title="Formato" sortKey="format" {...props} />
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="relative px-4 py-3"><span className="sr-only">Ações</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {groupedPosts ? (
                        Object.entries(groupedPosts).map(([account, data]) => (
                            <React.Fragment key={account}>
                                <tr className="bg-gray-900">
                                    <td colSpan={7} className="px-4 py-3 text-sm font-bold text-primary-300">
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
                                {data.posts.map(post => <PostRow key={post.id} post={post} {...props} />)}
                            </React.Fragment>
                        ))
                    ) : (
                        posts.map(post => <PostRow key={post.id} post={post} {...props} />)
                    )}
                    {posts.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-10 text-gray-500">Nenhum registro encontrado para o período selecionado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PostTable;