import React, { useState } from 'react';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFirebaseError = (err: any) => {
        // Log the full error to the console for debugging purposes.
        console.error("Firebase Auth Error:", err);

        switch (err.code) {
            case 'auth/invalid-email':
                return 'O formato do email é inválido. Por favor, verifique e tente novamente.';
            case 'auth/weak-password':
                return 'A senha é muito fraca. Deve ter pelo menos 6 caracteres.';
            case 'auth/email-already-in-use':
                return 'Este email já está cadastrado. Tente fazer login ou use um email diferente.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                 return 'Email ou senha inválidos. Verifique suas credenciais.';
            case 'auth/operation-not-allowed':
                 return 'O cadastro por email e senha não está ativado para este aplicativo. Contate o suporte.';
            case 'auth/too-many-requests':
                 return 'Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde.';
            case 'auth/network-request-failed':
                return 'Erro de rede. Verifique sua conexão com a internet e tente novamente.';
            default:
                // For any other error, show a generic message but include the code for reference.
                return `Ocorreu um erro inesperado (${err.code}). Tente novamente.`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !password) {
            setError('Email e senha são obrigatórios.');
            return;
        }

        try {
            if (isLogin) {
                await window.signInWithEmailPassword(email, password);
                // onAuthStateChanged irá lidar com o redirecionamento
            } else {
                await window.signUpWithEmailPassword(email, password);
                setSuccess('Cadastro realizado com sucesso! Faça o login.');
                setIsLogin(true);
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError(handleFirebaseError(err));
        }
    };

    const backgroundStyle: React.CSSProperties = {
        backgroundColor: '#000000',
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
            <div className="w-full max-w-md p-8 space-y-6 bg-dark-bg/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-primary-800/60">
                <div className="text-center mb-6">
                     <img src="https://iili.io/Kw8h2El.png" alt="Utmify Logo" className="h-28 w-auto mx-auto" />
                    <h2 className="text-2xl text-white mt-4">Análise de Métricas - TikTok Shop</h2>
                </div>
                <div className="flex border-b border-gray-800">
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
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-800 bg-gray-900 placeholder-gray-600 text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Senha</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-800 bg-gray-900 placeholder-gray-600 text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 transition-colors"
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