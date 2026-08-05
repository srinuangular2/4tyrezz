import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppConnectButton({ car }) {
  // Your target contact phone number
  const targetPhone = '916304135959';

  const handleConnect = () => {
    const carTitle = `${car.year || ''} ${car.brand?.name || ''} ${car.title || car.model?.name || 'Car'}`.trim();
    const carPrice = car.price ? `₹${car.price} Lakhs` : 'Price on Request';
    const carUrl = `${window.location.origin}/cars/${car._id || car.id}`;

    // Craft rich formatted text message for WhatsApp
    const textMessage = 
`🚗 *Car Inquiry - 4TYREZZ*

*Vehicle:* ${carTitle}
*Price:* ${carPrice}
*View Details:* ${carUrl}

Hi, I am interested in this car and would like to connect with a dealer!`;

    // Encode URL text
    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;

    // Open WhatsApp in new tab/app
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleConnect}
      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer mt-3 w-full"
    >
    <FaWhatsapp className="w-5 h-5" />
      <span>Connect on WhatsApp</span>
    </button>
  );
}