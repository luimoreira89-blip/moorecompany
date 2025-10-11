import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { FlowSession } from '../types';
import { startOfWeek, endOfWeek, parseISO, getDay, subWeeks } from 'date-fns';


const TimeSelector: React.FC<{
    label: string;
    totalSeconds: number;
    setTotalSeconds: (seconds: number) => void;
    isDisabled: boolean;
}> = ({ label, totalSeconds, setTotalSeconds, isDisabled }) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const minRef = useRef<HTMLDivElement>(null);
    const secRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<number | null>(null);

    const minuteOptions = Array.from({ length: 61 }, (_, i) => String(i).padStart(2, '0'));
    const secondOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
    const ITEM_HEIGHT = 40; // Corresponds to h-10 in Tailwind

    // Sync scroll position with state
    useEffect(() => {
        if (minRef.current) {
            minRef.current.scrollTop = minutes * ITEM_HEIGHT;
        }
        if (secRef.current) {
            secRef.current.scrollTop = seconds * ITEM_HEIGHT;
        }
    }, [totalSeconds, minutes, seconds]);

    const handleScroll = (type: 'minutes' | 'seconds') => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        scrollTimeoutRef.current = window.setTimeout(() => {
            if (isDisabled) return;
            
            const ref = type === 'minutes' ? minRef : secRef;
            if (!ref.current) return;

            const selectedIndex = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
            
            ref.current.scrollTo({ top: selectedIndex * ITEM_HEIGHT, behavior: 'smooth' });

            if (type === 'minutes') {
                setTotalSeconds(selectedIndex * 60 + seconds);
            } else {
                setTotalSeconds(minutes * 60 + selectedIndex);
            }
        }, 150); // Debounce to avoid excessive updates while scrolling
    };
    

    return (
        <div className="text-center">
            <label className="block text-lg font-medium text-gray-300 mb-3">{label}</label>
            <div className={`time-selector-container bg-black/30 border border-gray-700 rounded-lg p-2 flex justify-center gap-2 w-48 mx-auto ${isDisabled ? 'opacity-50' : ''}`}>
                <div className="time-selector-highlight"></div>
                <div className="time-selector-fade time-selector-fade-top"></div>
                <div className="time-selector-fade time-selector-fade-bottom"></div>
                {/* Minutes Wheel */}
                <div ref={minRef} onScroll={() => handleScroll('minutes')} className="time-selector-wheel">
                    {minuteOptions.map(min => (
                        <div key={`min-${min}`} className="time-selector-wheel-item">{min}</div>
                    ))}
                </div>
                 <span className="text-3xl font-bold text-gray-500 mt-9">:</span>
                {/* Seconds Wheel */}
                <div ref={secRef} onScroll={() => handleScroll('seconds')} className="time-selector-wheel">
                    {secondOptions.map(sec => (
                        <div key={`sec-${sec}`} className="time-selector-wheel-item">{sec}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ComparisonCard: React.FC<{ title: string; value: string; variation?: number }> = ({ title, value, variation }) => {
    const getVariationContent = () => {
        if (variation === undefined) {
            return <p className="text-2xl font-bold text-white mt-1">{value}</p>;
        }
        if (variation === Infinity) {
            return (
                <p className="text-2xl font-bold text-green-400 mt-1 flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
                    <span>Novo Hábito!</span>
                </p>
            );
        }
         return (
             <p className={`text-2xl font-bold mt-1 flex items-center justify-center gap-1 ${variation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {variation >= 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 11.586V7a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                )}
                <span>{Math.abs(variation).toFixed(0)}%</span>
             </p>
         );
    };

    return (
         <div className="p-3 bg-gray-800/50 rounded-md">
            <p className="text-sm text-gray-400">{title}</p>
            {getVariationContent()}
        </div>
    );
};


const FlowCaverna: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
    const [flowDurationInSeconds, setFlowDurationInSeconds] = useState(25 * 60);
    const [breakDurationInSeconds, setBreakDurationInSeconds] = useState(5 * 60);
    const [secondsLeft, setSecondsLeft] = useState(flowDurationInSeconds);
    const [timerMode, setTimerMode] = useState<'flow' | 'break' | 'paused'>('paused');
    const [isActive, setIsActive] = useState(false);
    const [sessions, setSessions] = useState<FlowSession[]>([]);
    
    const intervalRef = useRef<number | null>(null);
    const alarmSoundRef = useRef<HTMLAudioElement>(null);

    // Fetch sessions from Firestore
    useEffect(() => {
        const unsubscribe = window.watchUserSubcollection('flowSessions', (data) => {
            setSessions(data as FlowSession[]);
        });
        return () => unsubscribe();
    }, []);

    // Sync the timer display with the selected flow duration when the timer is idle.
    useEffect(() => {
        if (timerMode === 'paused' || (!isActive && secondsLeft === 0)) {
            setSecondsLeft(flowDurationInSeconds);
        }
    }, [flowDurationInSeconds, timerMode, isActive, secondsLeft]);


    // Timer logic
    useEffect(() => {
        if (!isActive) {
            return;
        }

        intervalRef.current = window.setInterval(() => {
            setSecondsLeft(prevSeconds => {
                if (prevSeconds <= 1) {
                    clearInterval(intervalRef.current!);
                    setIsActive(false);

                    if (alarmSoundRef.current) {
                        alarmSoundRef.current.muted = false;
                        alarmSoundRef.current.play().catch(error => console.warn("A reprodução do áudio falhou:", error));
                    }
        
                    if (Notification.permission === "granted") {
                        new Notification("Tempo esgotado!", {
                            body: timerMode === 'flow' ? "Hora de uma pausa!" : "Intervalo finalizado. Vamos voltar ao flow!",
                            icon: "https://iili.io/Kw8h2El.png"
                        });
                    }
        
                    if (timerMode === 'flow') {
                        window.addUserSubcollectionDoc('flowSessions', {
                            duration: flowDurationInSeconds / 60, // save in minutes
                            completedAt: new Date().toISOString()
                        }).catch(err => console.error("Failed to save flow session:", err));
                    }
                    
                    return 0;
                }
                return prevSeconds - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, timerMode, flowDurationInSeconds]);
    
    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }, []);

    const formatMinutes = (minutes: number) => {
        if (typeof minutes !== 'number' || !isFinite(minutes)) {
            return '0';
        }
        // Format to one decimal place, but remove .0 for whole numbers
        return String(Number(minutes.toFixed(1)));
    };

    const primeAudio = () => {
        if (alarmSoundRef.current && alarmSoundRef.current.paused) {
            const audio = alarmSoundRef.current;
            audio.muted = true;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.muted = false; 
                }).catch(error => {
                    console.warn("Audio priming failed. Sound may not play automatically.", error);
                    audio.muted = false;
                });
            }
        }
    };

    const handleStartFlow = () => {
        primeAudio();
        setTimerMode('flow');
        setSecondsLeft(flowDurationInSeconds);
        setIsActive(true);
    };

    const handleStartBreak = () => {
        primeAudio();
        setTimerMode('break');
        setSecondsLeft(breakDurationInSeconds);
        setIsActive(true);
    };

    const handleTogglePause = () => {
        if (!isActive) { // When resuming
            primeAudio();
        }
        setIsActive(prev => !prev);
    };

    const handleReset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        setTimerMode('paused');
        setSecondsLeft(flowDurationInSeconds);
    };

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const weeklyChartData = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

        const weekSessions = sessions.filter(s => {
            const completedDate = parseISO(s.completedAt);
            return completedDate >= weekStart && completedDate <= weekEnd;
        });
        
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun -> Sat

        weekSessions.forEach(session => {
            const dayIndex = getDay(parseISO(session.completedAt)); // 0 for Sunday...
            dailyTotals[dayIndex] += session.duration;
        });
        
        const chartOrderTotals = [...dailyTotals.slice(1), dailyTotals[0]];
        const chartOrderLabels = [...daysOfWeek.slice(1), daysOfWeek[0]];

        return chartOrderLabels.map((day, index) => ({
            name: day,
            minutos: chartOrderTotals[index]
        }));
    }, [sessions]);

    const weeklyTotal = useMemo(() => weeklyChartData.reduce((sum, day) => sum + day.minutos, 0), [weeklyChartData]);
    
    const weeklyAverage = useMemo(() => {
        const focusedDays = weeklyChartData.filter(d => d.minutos > 0).length;
        return focusedDays > 0 ? weeklyTotal / focusedDays : 0;
    }, [weeklyTotal, weeklyChartData]);

    const weeklyComparison = useMemo(() => {
        const today = new Date();
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
        const startOfLastWeek = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        const endOfLastWeek = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

        const thisWeekSessions = sessions.filter(s => {
            const completedDate = parseISO(s.completedAt);
            return completedDate >= startOfThisWeek;
        });

        const lastWeekSessions = sessions.filter(s => {
            const completedDate = parseISO(s.completedAt);
            return completedDate >= startOfLastWeek && completedDate <= endOfLastWeek;
        });

        const thisWeekTotal = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);
        const lastWeekTotal = lastWeekSessions.reduce((sum, s) => sum + s.duration, 0);
        
        const daysPassedThisWeek = getDay(today) === 0 ? 7 : getDay(today); 
        
        const thisWeekAverage = daysPassedThisWeek > 0 ? thisWeekTotal / daysPassedThisWeek : 0;
        const lastWeekAverage = lastWeekTotal / 7;

        let percentageChange = 0;
        if (lastWeekAverage > 0) {
            percentageChange = ((thisWeekAverage / lastWeekAverage) - 1) * 100;
        } else if (thisWeekAverage > 0) {
            percentageChange = Infinity;
        }

        return { thisWeekAverage, lastWeekAverage, percentageChange };
    }, [sessions]);


    return (
        <div className="text-white bg-black flex flex-col relative">
            {onToggleSidebar && (
                <button 
                    onClick={onToggleSidebar} 
                    className="sm:hidden text-white absolute top-4 left-4 z-10 p-2 bg-black/50 rounded-full backdrop-blur-sm"
                    aria-label="Abrir menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            )}
            <img src="https://iili.io/KNtp8tj.jpg" alt="Imagem de capa do Flow Caverna" className="w-full h-auto" />
            <div className="p-4 sm:p-6 space-y-8">
                <style>{`
                    .time-selector-container {
                        position: relative;
                        height: 140px;
                    }
                    .time-selector-wheel {
                        height: 120px;
                        width: 60px;
                        overflow-y: scroll;
                        scroll-snap-type: y mandatory;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .time-selector-wheel::-webkit-scrollbar {
                        display: none;
                    }
                    .time-selector-wheel-item {
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        scroll-snap-align: center;
                        font-size: 1.75rem;
                        font-weight: 600;
                        color: #6b7280;
                    }
                    .time-selector-highlight {
                        position: absolute;
                        top: 50%;
                        left: 1rem;
                        right: 1rem;
                        height: 40px;
                        transform: translateY(-50%);
                        border-top: 2px solid #0ea5e9;
                        border-bottom: 2px solid #0ea5e9;
                        pointer-events: none;
                        opacity: 0.7;
                    }
                    .time-selector-fade {
                        position: absolute;
                        left: 0;
                        right: 0;
                        height: 50px;
                        pointer-events: none;
                        z-index: 1;
                    }
                    .time-selector-fade-top {
                        top: 0;
                        background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
                    }
                    .time-selector-fade-bottom {
                        bottom: 0;
                        background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
                    }
                `}</style>
                
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 flex flex-col items-center shadow-lg shadow-primary-900/10 -mt-32 backdrop-blur-sm">
                    <div className={`flex flex-col md:flex-row justify-center items-center gap-6 transition-opacity duration-500 w-full ${isActive || timerMode !== 'paused' ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100 h-auto'}`}>
                        <TimeSelector label="Tempo de Intervalo" totalSeconds={breakDurationInSeconds} setTotalSeconds={setBreakDurationInSeconds} isDisabled={isActive} />
                        <TimeSelector label="Tempo de Flow" totalSeconds={flowDurationInSeconds} setTotalSeconds={setFlowDurationInSeconds} isDisabled={isActive} />
                    </div>

                    <div className="flex-grow flex justify-center items-center py-4 md:py-8">
                        <p className="font-mono text-8xl sm:text-9xl font-bold tracking-tighter">{timerDisplay}</p>
                    </div>

                    <div className="flex justify-center items-center gap-4 h-14">
                        {/* Idle State */}
                        {timerMode === 'paused' && (
                            <button onClick={handleStartFlow} className="w-48 py-3 text-xl font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-lg shadow-primary-600/30">
                                Iniciar Flow
                            </button>
                        )}

                        {/* Running State */}
                        {isActive && (
                            <button onClick={handleTogglePause} className="w-48 py-3 text-xl font-bold text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors shadow-lg shadow-yellow-500/30">
                                Pausar
                            </button>
                        )}
                        
                        {/* Paused State */}
                        {!isActive && timerMode !== 'paused' && secondsLeft > 0 && (
                            <>
                                <button onClick={handleTogglePause} className="w-40 py-2 text-lg font-bold text-white rounded-lg transition-colors shadow-lg bg-green-600 hover:bg-green-700 shadow-green-600/30">
                                    Continuar
                                </button>
                                <button onClick={handleReset} className="w-40 py-2 text-lg font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/30">
                                    Zerar
                                </button>
                            </>
                        )}
                        
                        {/* Finished State */}
                        {!isActive && secondsLeft === 0 && (
                            <>
                                {timerMode === 'flow' && (
                                    <button onClick={handleStartBreak} className="w-48 py-3 text-xl font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-lg shadow-green-600/30">
                                        Iniciar Intervalo
                                    </button>
                                )}
                                {timerMode === 'break' && (
                                    <button onClick={handleStartFlow} className="w-48 py-3 text-xl font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-lg shadow-primary-600/30">
                                        Novo Flow
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
                
                <div className="pt-8 mt-8 border-t border-gray-800 space-y-6">
                    <h2 className="text-2xl font-bold text-center text-primary-400">Desempenho Semanal</h2>
                    <div className="bg-gray-900/50 border border-gray-800 p-4 sm:p-6 rounded-lg">
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={weeklyChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                    <XAxis dataKey="name" stroke="#A0AEC0" />
                                    <YAxis 
                                        stroke="#A0AEC0" 
                                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }}
                                        tickFormatter={(value) => formatMinutes(value as number)}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }} 
                                        cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }}
                                        formatter={(value: number) => [formatMinutes(value), 'minutos']}
                                    />
                                    <Bar dataKey="minutos" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30}>
                                        <LabelList 
                                            dataKey="minutos" 
                                            position="top" 
                                            style={{ fill: '#e2e8f0', fontSize: '12px' }} 
                                            formatter={(value: number) => value > 0 ? formatMinutes(value) : ''} 
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-300">Resumo da Semana</h3>
                        <p className="text-primary-400 text-3xl font-bold mt-2">{formatMinutes(weeklyTotal)} minutos</p>
                        <p className="text-gray-400 mt-1">Média de {formatMinutes(weeklyAverage)} minutos por dia de foco.</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-300 mb-4">Comparativo Semanal</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ComparisonCard title="Média Diária (Atual)" value={`${formatMinutes(weeklyComparison.thisWeekAverage)} min`} />
                            <ComparisonCard title="Média Diária (Anterior)" value={`${formatMinutes(weeklyComparison.lastWeekAverage)} min`} />
                            <ComparisonCard title="Variação" value="" variation={weeklyComparison.percentageChange} />
                        </div>
                    </div>
                </div>

                <audio ref={alarmSoundRef} src="https://cdn.pixabay.com/audio/2022/03/15/audio_7027a6591a.mp3" preload="auto"></audio>
            </div>
        </div>
    );
};

export default FlowCaverna;
