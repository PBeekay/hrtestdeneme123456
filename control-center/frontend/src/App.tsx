
import { useSystemStatus } from './hooks/useSystemStatus';
import { SystemHeader } from './components/dashboard/SystemHeader';
import { StatusCard } from './components/dashboard/StatusCard';

function App() {
    const { data: targets, isLoading, error } = useSystemStatus();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <SystemHeader
                    lastUpdate={new Date()}
                    loading={isLoading}
                />

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="bg-rose-900/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl text-center">
                        <p>Failed to load system status. Please check your connection.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {targets?.map((target) => (
                            <StatusCard key={target.target_id} target={target} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
