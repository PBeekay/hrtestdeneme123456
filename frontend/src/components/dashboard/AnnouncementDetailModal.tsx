import React, { useState } from 'react';
import { announcementService } from '../../services/announcementService';

interface AnnouncementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement: any;
    onDelete?: () => void;
    onEdit?: (announcement: any) => void;
    isAdmin?: boolean;
}

const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
    isOpen,
    onClose,
    announcement,
    onDelete,
    onEdit,
    isAdmin = false
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen || !announcement) return null;

    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        if (!dateString.includes('-') && !dateString.includes(':')) return dateString;
        try {
            const dateObj = new Date(dateString.replace(' ', 'T'));
            if (isNaN(dateObj.getTime())) return dateString;
            return new Intl.DateTimeFormat('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit'
            }).format(dateObj);
        } catch {
            return dateString;
        }
    };

    // Helper to render Markdown-like content (basic bold/italic/list)
    const renderContent = (content: string) => {
        if (!content) return null;

        return content.split('\n').map((line, index) => {
            // List item
            if (line.trim().startsWith('- ')) {
                return (
                    <li key={index} className="ml-4 list-disc pl-1 mb-1">
                        {renderInlineFormatting(line.substring(2))}
                    </li>
                );
            }
            // Paragraph
            return (
                <p key={index} className="mb-2 last:mb-0">
                    {renderInlineFormatting(line)}
                </p>
            );
        });
    };

    const renderInlineFormatting = (text: string) => {
        // Regex for **bold** and *italic*
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('_') && part.endsWith('_')) {
                return <em key={i}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('*') && part.endsWith('*')) { // simplistic italic check
                return <em key={i}>{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const getIconClass = (category: string) => {
        switch (category) {
            case 'Etkinlik': return 'fa-calendar-day text-purple-600 bg-purple-50';
            case 'Acil': return 'fa-triangle-exclamation text-red-600 bg-red-50';
            case 'Kutlama': return 'fa-cake-candles text-amber-600 bg-amber-50';
            case 'Toplantı': return 'fa-handshake text-blue-600 bg-blue-50';
            case 'Eğitim': return 'fa-graduation-cap text-emerald-600 bg-emerald-50';
            case 'Bakım': return 'fa-screwdriver-wrench text-orange-600 bg-orange-50';
            default: return 'fa-bullhorn text-blue-600 bg-blue-50';
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
            setIsDeleting(true);
            try {
                await announcementService.deleteAnnouncement(announcement.id);
                if (onDelete) onDelete();
                onClose();
            } catch (error) {
                console.error("Delete failed", error);
                alert("Silme işlemi başarısız oldu.");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn border border-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${getIconClass(announcement.category).split(' ').slice(1).join(' ')}`}>
                            <i className={`fa-solid ${getIconClass(announcement.category).split(' ')[0]}`}></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${announcement.category === 'Acil' ? 'bg-red-50 text-red-600 border-red-100' :
                                        announcement.category === 'Etkinlik' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {announcement.category}
                                </span>
                                <span className="text-slate-400 text-xs">
                                    <i className="fa-regular fa-clock mr-1"></i>
                                    {formatDate(announcement.date)}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 leading-snug">{announcement.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => onEdit && onEdit(announcement)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    title="Düzenle"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Sil"
                                >
                                    {isDeleting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-regular fa-trash-can"></i>}
                                </button>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[60vh] text-slate-600 leading-relaxed text-base">
                    {renderContent(announcement.description || announcement.content)}
                </div>

                {/* Footer */}
                {announcement.author_name && (
                    <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                                {announcement.author_name.substring(0, 2).toUpperCase()}
                            </div>
                            <span>Ekleyen: <span className="font-semibold text-slate-700">{announcement.author_name}</span></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementDetailModal;
