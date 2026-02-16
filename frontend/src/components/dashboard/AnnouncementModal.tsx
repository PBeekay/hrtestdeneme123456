import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // For editing
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'Genel' | 'Etkinlik' | 'Bakım' | 'Acil' | 'Toplantı' | 'Kutlama' | 'Eğitim'>('Genel');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper: Local Time ISO string (YYYY-MM-DDTHH:mm)
    // Fixes the issue where default new Date().toISOString() is UTC (3 hours behind TR)
    const getLocalISOString = () => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit mode
                setTitle(initialData.title);
                setContent(initialData.description || initialData.content);
                setCategory(initialData.category);

                // Ensure date is in compatible input format
                // API sends: "2024-01-30 14:00" -> Input needs: "2024-01-30T14:00"
                if (initialData.date && initialData.date.includes(' ')) {
                    setDate(initialData.date.replace(' ', 'T'));
                } else {
                    setDate(initialData.date || getLocalISOString());
                }
            } else {
                // Create mode - reset with local time default
                setTitle('');
                setContent('');
                setCategory('Genel');
                setDate(getLocalISOString());
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    // Simple Rich Text Helpers
    const insertFormat = (format: string) => {
        const textarea = document.getElementById('announcement-content') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        let newText = text;
        let newCursorPos = end;

        if (format === 'bold') {
            newText = `${before}**${selected}**${after}`;
            newCursorPos = end + 4;
        } else if (format === 'italic') {
            newText = `${before}_${selected}_${after}`;
            newCursorPos = end + 2;
        } else if (format === 'list') {
            newText = `${before}\n- ${selected}${after}`;
            newCursorPos = end + 3;
        }

        setContent(newText);
        // Focus back and set cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            title,
            content,
            category,
            announcement_date: date.replace('T', ' ')
        };

        try {
            if (initialData && initialData.id) {
                // Update
                await announcementService.updateAnnouncement(initialData.id, payload);
            } else {
                // Create
                await announcementService.createAnnouncement(payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'İşlem sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scaleIn border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <i className="fa-solid fa-bullhorn text-lg"></i>
                            </div>
                            {initialData ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Oluştur'}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 ml-14">
                            {initialData ? 'Mevcut duyuruyu güncelleyin.' : 'Tüm şirket çalışanları için yeni bir duyuru yayınlayın.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col lg:flex-row h-[600px]">

                    {/* Left Panel: Form */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-slate-50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100">
                                    <i className="fa-solid fa-circle-exclamation text-lg"></i>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Duyuru Başlığı</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Yıl Sonu Değerlendirme Toplantısı"
                                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as any)}
                                            className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-white appearance-none cursor-pointer"
                                        >
                                            <option value="Genel">📢 Genel Duyuru</option>
                                            <option value="Etkinlik">🎉 Etkinlik / Organizasyon</option>
                                            <option value="Toplantı">🤝 Toplantı</option>
                                            <option value="Kutlama">🎂 Kutlama / Tebrik</option>
                                            <option value="Eğitim">📚 Eğitim / Seminer</option>
                                            <option value="Bakım">🔧 Bakım / Kesinti</option>
                                            <option value="Acil">🚨 Acil Durum</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <i className="fa-solid fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Yayınlanma Tarihi</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-600"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">Şu anki zaman otomatik seçilidir.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">İçerik Detayları</label>

                                {/* Rich Text Toolbar */}
                                <div className="flex gap-1 mb-2 bg-slate-50 p-1 rounded-lg border border-slate-200 w-fit">
                                    <button type="button" onClick={() => insertFormat('bold')} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 transition-all" title="Kalın">
                                        <i className="fa-solid fa-bold"></i>
                                    </button>
                                    <button type="button" onClick={() => insertFormat('italic')} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 transition-all" title="İtalik">
                                        <i className="fa-solid fa-italic"></i>
                                    </button>
                                    <div className="w-px bg-slate-200 mx-1 my-1"></div>
                                    <button type="button" onClick={() => insertFormat('list')} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-800 transition-all" title="Liste">
                                        <i className="fa-solid fa-list-ul"></i>
                                    </button>
                                </div>

                                <textarea
                                    id="announcement-content"
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={12}
                                    placeholder="Duyuru metnini buraya giriniz..."
                                    className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none font-mono text-sm leading-relaxed"
                                ></textarea>
                                <p className="text-xs text-slate-400 mt-2 text-right">Markdown formatı desteklenir (Basit)</p>
                            </div>
                        </form>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className="w-full lg:w-80 bg-slate-50/50 p-8 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col">
                        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-6">Önizleme</h4>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4 opacity-100 scale-100 transition-all">
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 
                                    ${category === 'Acil' ? 'bg-red-50 text-red-600' :
                                        category === 'Etkinlik' ? 'bg-purple-50 text-purple-600' :
                                            category === 'Kutlama' ? 'bg-amber-50 text-amber-600' :
                                                'bg-blue-50 text-blue-600'}`}>
                                    <i className={`fa-solid ${category === 'Acil' ? 'fa-triangle-exclamation' :
                                            category === 'Etkinlik' ? 'fa-calendar-day' :
                                                category === 'Kutlama' ? 'fa-cake-candles' :
                                                    category === 'Toplantı' ? 'fa-handshake' :
                                                        category === 'Eğitim' ? 'fa-graduation-cap' :
                                                            'fa-bullhorn'
                                        } text-sm`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-700 text-sm truncate">{title || 'Başlık'}</h4>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{content || 'İçerik önizlemesi burada görünecek...'}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 text-right">{date.replace('T', ' ')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !title || !content}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-circle-notch fa-spin"></i> İşleniyor
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-paper-plane"></i> {initialData ? 'Güncelle' : 'Duyuruyu Yayınla'}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-slate-500 font-semibold hover:text-slate-700 transition-colors mt-2"
                            >
                                İptal Et
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementModal;
