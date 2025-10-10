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

    const backgroundStyle: React.CSSProperties = {
        backgroundColor: '#111827',
        backgroundImage: `
            url('https://iili.io/KwgA0v4.png'),
            url('https://iili.io/KwUbhZX.png')
        `,
        backgroundPosition: '-15vw center, right center',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundSize: 'auto 100vh, auto 100vh',
        backgroundAttachment: 'fixed',
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-full" style={backgroundStyle}>
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-primary-800/60">
                <div className="text-center mb-6">
                     <img src="https://iili.io/Kw8h2El.png" alt="Utmify Logo" className="h-28 w-auto mx-auto" />
                    <h2 className="text-2xl text-white mt-4">Análise de Métricas - TikTok Shop</h2>
                </div>
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                        className={`w-1/2 py-4 text-center font-medium transition-all duration-300 ${isLogin ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400 hover:text-primary-500'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                        className={`w-1/2 py-4 text-center font-medium transition-all duration-300 ${!isLogin ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400 hover:text-primary-500'}`}
                    >
                        Cadastro
                    </button>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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

                <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative px-2 bg-gray-900/70 text-sm text-gray-400">OU</div>
                </div>

                <div>
                    <button
                        id="btnGoogle"
                        type="button"
                        onClick={() => window.signInWithGoogle()}
                        className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500 transition-colors"
                    >
                         <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 74.8C307.7 99.8 280.7 86 248 86c-84.3 0-152.3 68.2-152.3 152S163.7 390 248 390c47.1 0 89.6-22.3 117.2-57.2H248v-87.7h239.8c4.3 23.6 6.2 47.8 6.2 73.5z"></path></svg>
                        Entrar com Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;