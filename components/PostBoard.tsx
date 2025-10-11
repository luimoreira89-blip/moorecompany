import React from 'react';
import { Post, Status } from '../types';
import { STATUS_COLORS } from '../constants';
import { formatPostDate } from '../utils/dateUtils';

interface PostBoardProps {
    posts: (Post & { derivedStatus: Status })[];
    onEdit: (post: Post) => void;
    onDelete: (id: string) => void;
    onSetPosted: (id: string, isPosted: boolean) => void;
}

const PostCard: React.FC<{ post: Post & { derivedStatus: Status }; onEdit: (post: Post) => void; onDelete: (id: string) => void; onSetPosted: (id: string, isPosted: boolean) => void; }> = ({ post, onEdit, onDelete, onSetPosted }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 space-y-3">
            <div className="flex justify-between items-start">
                <span className="font-bold text-white">{post.account}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[post.derivedStatus]}`}>{post.derivedStatus}</span>
            </div>
            <p className="text-sm text-gray-300"><strong>Data:</strong> {formatPostDate(post.date)}</p>
            {post.product && <p className="text-sm text-gray-400"><strong>Produto:</strong> {post.product}</p>}
            <p className="text-sm text-gray-400"><strong>Formato:</strong> {post.format}</p>
            <div className="flex items-center gap-4 pt-2">
                {post.driveLink && (
                    <a href={post.driveLink} target="_blank" rel="noopener noreferrer" title="Abrir link do criativo">
                         <span role="img" aria-label="Claquete" className="text-2xl hover:opacity-80 transition-opacity">🎬</span>
                    </a>
                )}
                {post.copyLink && (
                    <a href={post.copyLink} target="_blank" rel="noopener noreferrer" title="Abrir link da copy">
                         <span role="img" aria-label="Mão escrevendo" className="text-2xl hover:opacity-80 transition-opacity">✍️</span>
                    </a>
                )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-700 pt-3 mt-3">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox"
                        id={`posted-check-${post.id}`}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        checked={post.isPosted}
                        onChange={(e) => onSetPosted(post.id, e.target.checked)}
                    />
                    <label htmlFor={`posted-check-${post.id}`} className="text-sm text-gray-300 cursor-pointer">Postado</label>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => onEdit(post)} className="text-xs text-primary-400 hover:text-primary-300">Editar</button>
                    <button onClick={() => onDelete(post.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
                </div>
            </div>
        </div>
    );
};


const BoardColumn: React.FC<{ title: string; posts: (Post & { derivedStatus: Status })[]; status: Status } & Omit<PostBoardProps, 'posts'>> = ({ title, posts, status, ...props }) => {
    return (
        <div className="flex-shrink-0 w-80 bg-gray-900/50 rounded-lg p-3">
            <h3 className={`font-bold text-lg mb-4 p-2 rounded-md text-center ${STATUS_COLORS[status]}`}>{title} ({posts.length})</h3>
            <div className="space-y-4 h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {posts.map(post => <PostCard key={post.id} post={post} {...props} />)}
                {posts.length === 0 && <p className="text-center text-gray-500 mt-8">Nenhum post aqui.</p>}
            </div>
        </div>
    );
};

const PostBoard: React.FC<PostBoardProps> = (props) => {
    const { posts } = props;

    const overduePosts = posts.filter(p => p.derivedStatus === Status.Overdue);
    const pendingPosts = posts.filter(p => p.derivedStatus === Status.Pending);
    const postedPosts = posts.filter(p => p.derivedStatus === Status.Posted);

    return (
        <div className="flex gap-6 overflow-x-auto pb-4">
            <BoardColumn title="Atrasado" posts={overduePosts} status={Status.Overdue} {...props} />
            <BoardColumn title="Pendente" posts={pendingPosts} status={Status.Pending} {...props} />
            <BoardColumn title="Postado" posts={postedPosts} status={Status.Posted} {...props} />
        </div>
    );
};

export default PostBoard;