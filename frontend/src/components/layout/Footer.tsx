import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    {/* Left Section: Brand & Contact */}
                    <div className="space-y-4">
                        <div className="text-3xl font-bold text-blue-600 tracking-tighter">
                            [vr]
                        </div>
                        <p className="text-slate-500 text-sm">Bizimle iletişime geçin!</p>

                        <div className="flex items-center gap-4">
                            <a href="/" className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-all">
                                <i className="fa-brands fa-instagram"></i>
                            </a>
                            <a href="/" className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 flex items-center justify-center transition-all">
                                <i className="fa-brands fa-twitter"></i>
                            </a>
                            <a href="/" className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center transition-all">
                                <i className="fa-brands fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>

                    {/* Right Section: Corporate Links */}
                    <div className="text-left md:text-right">
                        <h3 className="text-slate-800 font-bold mb-4">Kurumsal</h3>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li>
                                <a href="/" className="hover:text-blue-600 transition-colors">Hakkımızda</a>
                            </li>
                            <li>
                                <a href="/" className="hover:text-blue-600 transition-colors">Bilgi Bankası</a>
                            </li>
                            <li>
                                <a href="/" className="hover:text-blue-600 transition-colors">Bize Ulaşın</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section: Copyright */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
                    <p>Telif hakkı © 2026 Veriyum Teknoloji A.Ş. Tüm Hakları Saklıdır.</p>
                    <div className="flex gap-4 mt-2 md:mt-0">
                        <a href="/" className="hover:text-slate-600">Gizlilik Politikası</a>
                        <a href="/" className="hover:text-slate-600">Kullanım Şartları</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
