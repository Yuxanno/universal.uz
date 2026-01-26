import { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import { Plus, UserPlus, X, Shield, ShoppingCart, Trash2, Lock, User, Edit, Camera, Upload } from 'lucide-react';
import { User as UserType } from '../../types';
import api from '../../utils/api';
import { useAlert } from '../../hooks/useAlert';
import { getRawPhone, displayPhone } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import PhoneInput from '../../components/PhoneInput';

export default function Helpers() {
 const { t } = useLanguage();
 const { showConfirm, AlertComponent } = useAlert();
 const [helpers, setHelpers] = useState<UserType[]>([]);
 const [showModal, setShowModal] = useState(false);
 const [editingUser, setEditingUser] = useState<UserType | null>(null);
 const [loading, setLoading] = useState(true);
 const [uploadingImage, setUploadingImage] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [formData, setFormData] = useState({
 name: '', phone: '+998', password: '', role: 'helper' as 'cashier' | 'helper', image: ''
 });
 const [isSaving, setIsSaving] = useState(false);
 const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 useEffect(() => { fetchHelpers(); }, []);

 const fetchHelpers = async () => {
 try {
 const res = await api.get('/users/helpers');
 setHelpers(res.data);
 } catch (err) { console.error('Error fetching helpers:', err); }
 finally { setLoading(false); }
 };

 // Input dan chiqganda saqlash
 const handleInputBlur = () => {
 if (!editingUser) return;
 
 // Oldingi timeout ni bekor qilish
 if (saveTimeoutRef.current) {
 clearTimeout(saveTimeoutRef.current);
 }
 
 // 1.5 sekunddan keyin saqlash
 saveTimeoutRef.current = setTimeout(async () => {
 if (!formData.name.trim() || !formData.phone.trim()) return;
 
 try {
 setIsSaving(true);
 const data = {
 name: formData.name,
 phone: getRawPhone(formData.phone),
 role: formData.role,
 image: formData.image,
 ...(formData.password && { password: formData.password })
 };
 
 await api.put(`/users/${editingUser._id}`, data);
 fetchHelpers();
 } catch (err: any) {
 console.error('Save error:', err);
 } finally {
 setIsSaving(false);
 }
 }, 1500);
 };

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 // Validate file size (5MB)
 if (file.size > 5 * 1024 * 1024) {
 alert('Rasm hajmi 5MB dan oshmasligi kerak');
 return;
 }

 // Validate file type
 if (!file.type.startsWith('image/')) {
 alert('Faqat rasm fayllari ruxsat etilgan');
 return;
 }

 setUploadingImage(true);
 try {
 const formData = new FormData();
 formData.append('image', file);
 
 const res = await api.post('/users/upload-image', formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 
 setFormData(prev => ({ ...prev, image: res.data.image }));
 } catch (err: any) {
 alert(err.response?.data?.message || 'Rasm yuklashda xatolik');
 } finally {
 setUploadingImage(false);
 }
 };

 const handleRemoveImage = async () => {
 if (!formData.image) return;
 
 try {
 await api.delete('/users/delete-image', { data: { imagePath: formData.image } });
 setFormData(prev => ({ ...prev, image: '' }));
 } catch (err) {
 console.error('Error deleting image:', err);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const data = {
 name: formData.name,
 phone: getRawPhone(formData.phone),
 role: formData.role,
 image: formData.image,
 ...(formData.password && { password: formData.password })
 };
 
 if (editingUser) {
 await api.put(`/users/${editingUser._id}`, data);
 } else {
 await api.post('/users', { ...data, password: formData.password });
 }
 fetchHelpers();
 closeModal();
 } catch (err: any) {
 alert(err.response?.data?.message || 'Xatolik yuz berdi');
 }
 };

 const handleDelete = async (id: string) => {
 const confirmed = await showConfirm("Yordamchini o'chirishni tasdiqlaysizmi?", "O'chirish");
 if (!confirmed) return;
 try {
 await api.delete(`/users/${id}`);
 fetchHelpers();
 } catch (err) { console.error('Error deleting helper:', err); }
 };

 const openEditModal = (user: UserType) => {
 setEditingUser(user);
 setFormData({
 name: user.name,
 phone: displayPhone(user.phone),
 password: '',
 role: user.role as 'cashier' | 'helper',
 image: user.image || ''
 });
 setShowModal(true);
 };

 const closeModal = () => {
 // Timeout ni tozalash
 if (saveTimeoutRef.current) {
 clearTimeout(saveTimeoutRef.current);
 }
 setShowModal(false);
 setEditingUser(null);
 setFormData({ name: '', phone: '+998', password: '', role: 'helper', image: '' });
 };

 return (
 <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0">
 {AlertComponent}
 <Header 
 title={t("Yordamchilar")}
 actions={
 <button onClick={() => setShowModal(true)} className="btn-primary">
 <Plus className="w-4 h-4" />
 <span className="hidden sm:inline">{t("Yangi yordamchi")}</span>
 </button>
 }
 />

 <div className="p-4 lg:p-6">
 {loading ? (
 <div className="flex justify-center py-20">
 <div className="spinner text-brand-600 w-8 h-8" />
 </div>
 ) : helpers.length === 0 ? (
 <div className="card flex flex-col items-center py-16">
 <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
 <UserPlus className="w-8 h-8 text-surface-400" />
 </div>
 <h3 className="text-lg font-semibold text-surface-900 mb-2">{t("Yordamchilar yo'q")}</h3>
 <p className="text-surface-500 mb-6">{t("Birinchi yordamchini qo'shing")}</p>
 <button onClick={() => setShowModal(true)} className="btn-primary">
 {t("Yordamchi qo'shish")}
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {helpers.map(helper => (
 <div key={helper._id} className="card-hover">
 <div className="flex items-start gap-3 mb-4">
 {helper.image ? (
 <img 
 src={helper.image} 
 alt={helper.name}
 className="w-12 h-12 rounded-xl object-cover"
 />
 ) : (
 <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
 {helper.name.charAt(0).toUpperCase()}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-surface-900 truncate">{helper.name}</h3>
 <p className="text-sm text-surface-500 truncate">{displayPhone(helper.phone)}</p>
 </div>
 <button onClick={() => openEditModal(helper)} className="btn-icon-sm hover:bg-brand-100 hover:text-brand-600">
 <Edit className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(helper._id)} className="btn-icon-sm hover:bg-danger-100 hover:text-danger-600">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <span className={`badge ${helper.role === 'cashier' ? 'badge-success' : 'badge-primary'}`}>
 {helper.role === 'cashier' ? (
 <><ShoppingCart className="w-3 h-3" /> {t("Kassir")}</>
 ) : (
 <><Shield className="w-3 h-3" /> {t("Yordamchi")}</>
 )}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Mobile FAB */}
 <button
 onClick={() => setShowModal(true)}
 className="lg:hidden fixed right-4 bottom-20 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all z-30"
 >
 <Plus className="w-6 h-6" />
 </button>

 {/* Enhanced Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
 <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-scaleIn max-h-[90vh] overflow-y-auto border-2 border-surface-100 dark:border-surface-700">
 {/* Gradient Header - RED from logo */}
 <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 sticky top-0 z-10">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
 <UserPlus className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-xl font-black text-white">
 {editingUser ? t('Yordamchini tahrirlash') : t('Yangi yordamchi')}
 </h3>
 <p className="text-sm text-white/90 font-semibold">
 {editingUser ? (
 isSaving ? t('Saqlanmoqda...') : t('O\'zgarishlar avtomatik saqlanadi')
 ) : (
 t('Yangi yordamchi qo\'shing')
 )}
 </p>
 </div>
 </div>
 <button 
 onClick={closeModal} 
 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 hover:rotate-90 duration-200"
 title="Yopish"
 >
 <X className="w-6 h-6" strokeWidth={3} />
 </button>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6">
 {/* Enhanced Image Upload */}
 <div>
 <label className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
 <Camera className="w-4 h-4 text-red-600" />
 {t("Profil rasmi")}
 </label>
 <div className="flex items-center gap-4">
 <div className="relative">
 {formData.image ? (
 <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-brand-100 shadow-lg">
 <img 
 src={formData.image} 
 alt="Preview" 
 className="w-full h-full object-cover"
 />
 <button
 type="button"
 onClick={handleRemoveImage}
 className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"
 >
 <X className="w-5 h-5" strokeWidth={3} />
 </button>
 </div>
 ) : (
 <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-surface-700 dark:to-surface-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-surface-600 shadow-inner">
 <Camera className="w-10 h-10 text-slate-400 mb-1" />
 <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Rasm yo'q</p>
 </div>
 )}
 </div>
 <div className="flex-1">
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 onChange={handleImageUpload}
 className="hidden"
 />
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={uploadingImage}
 className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
 uploadingImage
 ? 'bg-neutral-200 text-slate-400 cursor-not-allowed'
 : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
 }`}
 >
 {uploadingImage ? (
 <>
 <div className="spinner w-5 h-5" />
 {t("Yuklanmoqda...")}
 </>
 ) : (
 <>
 <Upload className="w-5 h-5" />
 {t("Rasm yuklash")}
 </>
 )}
 </button>
 <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 text-center font-bold">
 📸 {t("Maksimal: 5MB")}
 </p>
 </div>
 </div>
 </div>

 {/* Enhanced Role Selection */}
 <div>
 <label className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
 <Shield className="w-4 h-4 text-red-600" />
 {t("Rol tanlash")}
 </label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setFormData({...formData, role: 'cashier'})}
 className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
 formData.role === 'cashier' 
 ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg scale-105' 
 : 'border-neutral-200 dark:border-surface-600 hover:border-green-300 hover:bg-green-50/50 hover:scale-102'
 }`}
 >
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
 formData.role === 'cashier'
 ? 'bg-gradient-to-br from-green-500 to-green-600'
 : 'bg-gradient-to-br from-gray-200 to-gray-300'
 }`}>
 <ShoppingCart className={`w-7 h-7 ${formData.role === 'cashier' ? 'text-white' : 'text-slate-500'}`} />
 </div>
 <div className="text-center">
 <p className={`font-black text-base mb-1 ${formData.role === 'cashier' ? 'text-green-700' : 'text-slate-900 dark:text-white'}`}>
 {t("Kassir")}
 </p>
 <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
 {t("Kassa, qarzlar")}
 </p>
 </div>
 {formData.role === 'cashier' && (
 <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 )}
 </button>
 
 <button
 type="button"
 onClick={() => setFormData({...formData, role: 'helper'})}
 className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
 formData.role === 'helper' 
 ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 shadow-lg scale-105' 
 : 'border-neutral-200 dark:border-surface-600 hover:border-red-300 hover:bg-red-50/50 hover:scale-102'
 }`}
 >
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
 formData.role === 'helper'
 ? 'bg-gradient-to-br from-red-500 to-red-600'
 : 'bg-gradient-to-br from-gray-200 to-gray-300'
 }`}>
 <Shield className={`w-7 h-7 ${formData.role === 'helper' ? 'text-white' : 'text-slate-500'}`} />
 </div>
 <div className="text-center">
 <p className={`font-black text-base mb-1 ${formData.role === 'helper' ? 'text-red-700' : 'text-slate-900 dark:text-white'}`}>
 {t("Yordamchi")}
 </p>
 <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
 {t("QR skaner")}
 </p>
 </div>
 {formData.role === 'helper' && (
 <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 )}
 </button>
 </div>
 </div>

 {/* Enhanced Name Input */}
 <div>
 <label className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
 <User className="w-4 h-4 text-red-600" />
 {t("Ism familiya")}
 </label>
 <div className="relative flex items-center">
 <User className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
 <input 
 type="text" 
 className="w-full pl-12 pr-4 py-3.5 text-base font-semibold text-slate-900 dark:text-white bg-white dark:bg-surface-700 border-2 border-neutral-300 dark:border-surface-600 rounded-xl transition-all focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
 placeholder={t("Masalan: Alisher Navoiy")} 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 onBlur={handleInputBlur}
 required 
 />
 </div>
 </div>
 
 {/* Enhanced Phone Input */}
 <div>
 <label className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
 <User className="w-4 h-4 text-red-600" />
 {t("Telefon raqami")}
 </label>
 <PhoneInput
 value={formData.phone}
 onChange={(phone) => setFormData({...formData, phone})}
 required
 />
 </div>
 
 {/* Enhanced Password Input */}
 <div>
 <label className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
 <Lock className="w-4 h-4 text-red-600" />
 {editingUser ? t('Yangi parol (ixtiyoriy)') : t('Parol')}
 </label>
 <div className="relative flex items-center">
 <Lock className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
 <input 
 type="password" 
 className="w-full pl-12 pr-4 py-3.5 text-base font-semibold text-slate-900 dark:text-white bg-white dark:bg-surface-700 border-2 border-neutral-300 dark:border-surface-600 rounded-xl transition-all focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
 placeholder={editingUser ? t("Bo'sh qoldiring o'zgarmaydi") : t("Kamida 6 ta belgi")} 
 value={formData.password}
 onChange={e => setFormData({...formData, password: e.target.value})}
 onBlur={handleInputBlur}
 {...(!editingUser && { required: true, minLength: 6 })} 
 />
 </div>
 {!editingUser && (
 <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 ml-1 font-bold">
 🔒 {t("Parol kamida 6 ta belgidan iborat bo'lishi kerak")}
 </p>
 )}
 </div>
 
 {/* Enhanced Action Buttons */}
 <div className="flex gap-3 pt-4">
 <button 
 type="button" 
 onClick={closeModal} 
 className="flex-1 px-6 py-4 bg-neutral-100 dark:bg-surface-700 hover:bg-neutral-200 dark:hover:bg-surface-600 text-slate-900 dark:text-white text-base font-black rounded-xl transition-all hover:scale-105 shadow-md"
 >
 {t("Bekor qilish")}
 </button>
 <button 
 type="submit" 
 disabled={isSaving}
 className={`flex-1 px-6 py-4 text-white text-base font-black rounded-xl shadow-xl transition-all ${
 isSaving 
 ? 'bg-neutral-400 cursor-not-allowed' 
 : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-2xl hover:scale-105'
 }`}
 >
 {editingUser ? (
 isSaving ? t("Saqlanmoqda...") : t("Yangilash")
 ) : (
 t("Saqlash")
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
