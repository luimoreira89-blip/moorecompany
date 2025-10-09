import React, { useState } from 'react';
import { User } from '../types';

interface AuthPageProps {
    login: (user: User) => boolean;
    register: (user: User) => boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ login, register }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username || !password) {
            setError('Usuário e senha são obrigatórios.');
            return;
        }

        if (isLogin) {
            const loggedIn = login({ username, password });
            if (!loggedIn) {
                setError('Usuário ou senha inválidos.');
            }
        } else {
            const registered = register({ username, password });
            if (registered) {
                setSuccess('Cadastro realizado com sucesso! Faça o login.');
                setIsLogin(true);
                setUsername('');
                setPassword('');
            } else {
                setError('Este nome de usuário já existe.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-primary-800">
                <div className="text-center">
                    <img src="https://iili.io/KwW3VNj.png" alt="Logo Painel de Postagens" className="w-40 mx-auto mb-6" />
                </div>
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                        className={`w-1/2 py-4 text-center font-medium ${isLogin ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                        className={`w-1/2 py-4 text-center font-medium ${!isLogin ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400'}`}
                    >
                        Cadastro
                    </button>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}
                    {success && <p className="text-green-400 text-center bg-green-900/50 p-3 rounded-md">{success}</p>}
                    
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Usuário</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Nome de usuário"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Senha</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500 transition-colors"
                        >
                            {isLogin ? 'Entrar' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;