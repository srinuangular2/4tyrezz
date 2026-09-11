import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuthGuard } from './AuthGuardModal';

export default function WhatsAppConnectButton({ car, onOpen }) {
  const { requireAuth } = useAuthGuard();
  const dealerPhone = String(car?.dealer?.whatsapp || car?.dealer?.phone || car?.owner?.mobile || '916304135959').replace(/\D/g, '');

  const handleConnect = () => {
    const title = `${car?.year || ''} ${car?.brand?.name || ''} ${car?.model?.name || car?.title || 'car'}`.trim();
    const ref = String(car?._id || car?.id || '').slice(-6).toUpperCase();
    const textMessage = `Hi, I am interested in ${title} (Ref: #4T${ref}). Is it available?`;
    const phone = dealerPhone.startsWith('91') ? dealerPhone : `91${dealerPhone}`;
    onOpen?.({ phone, textMessage });
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(textMessage)}`, '_blank');
  };

  return (
    <button
      type="button"
      onClick={() => requireAuth(handleConnect)}
      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer mt-3 w-full"
    >
      <FaWhatsapp className="w-5 h-5" />
      <span>Connect on WhatsApp</span>
    </button>
  );
}
