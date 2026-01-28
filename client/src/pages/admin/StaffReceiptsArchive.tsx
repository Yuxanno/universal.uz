import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Package, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAlert } from '../../hooks/useAlert';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerItem {
 product: string;
 name: string;
 code: string;
 price: number;
 quantity: number;
}

interface WorkerReceipt {
 _id: string;
 items: WorkerItem[];
 total: number;
 status: 'archived';
 createdBy: {
 _id: string;
 name: string;
 };
 createdAt: string;
}

interface Worker {
 _id: string;
 name: string;
 role: string;
}

export default function StaffReceiptsArchive() {
 const { t } = useLanguage();
 const { AlertComponent, showAlert } = useAlert();
 const navigate = useNavigate();
 const [workers, setWorkers] = useState<Worker[]>([]);
 const [receipts, setReceipts] = useState<WorkerReceipt[]>([]);
 const [loading, setLoading] = useState(true);

 const fetchData = useCallback(async () => {
 try {
 const [workersRes, receiptsRes] = await Promise.all([
 api.get('/users/helpers'),
 api.get('/receipts/archived')
 ]);
 
 const helpers = workersRes.data.filter((w: Worker) => w.role === 'helper');
 const uniqueHelpers = helpers.filter((w: Worker, index: number, self: Worker[]) => 
 index === self.findIndex((t) => t._id === w._id)
 );
 setWorkers(uniqueHelpers);
 
 const uniqueReceipts = receiptsRes.data.filter((r: WorkerReceipt, index: number, self: WorkerReceipt[]) => 
 index === self.findIndex((t) => t._id === r._id)
 );
 setReceipts(uniqueReceipts);
 } catch (err) {
 console.error('Error fetching data:', err);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchData();
 const interval = setInterval(fetchData, 5000);
 return () => clearInterval(interval);
 }, [fetchData]);

 const getWorkerReceipts = (workerId: string) => {
 return receipts.filter(r => r.createdBy?._id === workerId);
 };

 const handleApprove = async (receiptId: string) => {
 try {
 await api.put(`/receipts/${receiptId}/approve-archived`);
 showAlert('Chek tasdiqlandi!', 'Muvaffaqiyat', 'success');
 fetchData();
 } catch (err: any) {
 console.error('Error approving receipt:', err);
 showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'Xatolik', 'danger');
 }
 };

 return (
 <div className="min-h-screen bg-surface-50">
 {AlertComponent}
 
 {/* Top Bar */}
 <div className="bg-white border-b border-surface-200 px-6 py-4 shadow-sm">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <button
 onClick={() => navigate('/staff-receipts')}
 className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border-2 shadow-sm bg-neutral-100 text-neutral-900 border-neutral-300 hover:bg-neutral-200"
 >
 <ArrowLeft className="w-5 h-5" />
 <span>{t("Orqaga")}</span>
 </button>
 <h1 className="text-xl font-bold text-surface-900">{t("Arxivlangan cheklar")}</h1>
 </div>
 <span className="text-sm text-surface-500">
 {receipts.length} {t("ta arxivlangan chek")}
 </span>
 </div>
 </div>

 {/* Workers Grid */}
 <div className="p-6">
 {loading ? (
 <div className="flex justify-center py-20">
 <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 {workers.map((worker) => {
 const workerReceipts = getWorkerReceipts(worker._id);
 
 if (workerReceipts.length === 0) return null;
 
 const allItems = workerReceipts.flatMap(r => r.items);
 const total = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

 return (
 <div
 key={worker._id}
 className="rounded-2xl border-2 overflow-hidden transition-all bg-white shadow-sm border-neutral-300"
 >
 {/* Header */}
 <div className="px-5 py-4 bg-neutral-100">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white">
 <User className="w-6 h-6 text-surface-600" />
 </div>
 <div>
 <h3 className="font-semibold text-lg text-surface-900">
 {worker.name}
 </h3>
 <p className="text-sm text-surface-500">
 {workerReceipts.length} ta arxivlangan chek
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Items list */}
 <div className="p-4 min-h-[200px] max-h-[400px] overflow-auto">
 <div className="space-y-3">
 {allItems.map((item, index) => (
 <div key={index}>
 {index > 0 && <div className="border-t border-surface-200 -mt-1 mb-3" />}
 <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50">
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-surface-900 truncate text-sm">{item.name}</p>
 <p className="text-xs text-surface-500">Kod: {item.code}</p>
 </div>
 <div className="flex items-center gap-3 flex-shrink-0">
 <span className="font-semibold text-surface-700 min-w-[70px] text-right text-sm">
 {formatNumber(item.price)}
 </span>
 <span className="text-surface-400 font-bold text-lg">×</span>
 <span className="font-bold text-surface-900 min-w-[40px] text-center text-sm">
 {item.quantity}
 </span>
 <span className="font-bold text-surface-900 min-w-[80px] text-right text-sm">
 {formatNumber(item.price * item.quantity)}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Footer */}
 <div className="px-5 py-4 border-t border-surface-200 bg-surface-50">
 <div className="flex items-center justify-between mb-4">
 <span className="text-surface-500 font-medium">{t("Jami")}:</span>
 <span className="text-3xl font-bold text-surface-900">
 {formatNumber(total)} <span className="text-base font-normal text-surface-500">{t("so'm")}</span>
 </span>
 </div>
 
 <button
 onClick={() => {
 // Approve all receipts for this worker
 workerReceipts.forEach(receipt => {
 handleApprove(receipt._id);
 });
 }}
 className="w-full flex items-center justify-center gap-2 py-4 text-white rounded-xl font-semibold text-lg transition-colors bg-success-500 hover:bg-success-600"
 >
 <CheckCircle className="w-5 h-5" />
 {t("Tasdiqlash")}
 </button>
 </div>
 </div>
 );
 })}

 {receipts.length === 0 && !loading && (
 <div className="col-span-full text-center py-20 text-surface-400">
 <Package className="w-20 h-20 mx-auto mb-4 opacity-50" />
 <h3 className="text-xl font-medium mb-2 text-surface-600">{t("Arxivlangan cheklar yo'q")}</h3>
 <p>{t("Hozircha arxivda cheklar mavjud emas")}</p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
