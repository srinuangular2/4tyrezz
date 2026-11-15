import { UserRound } from 'lucide-react';
import { mediaUrl } from '../pages/profile/hubUtils';

export default function AccountAvatar({ user, className = 'h-8 w-8 text-[13px]', tone = 'blue' }) {
  const src = mediaUrl(user?.avatar);
  const letter = String(user?.name || user?.dealershipName || user?.dealerCode || 'U').trim().charAt(0).toUpperCase() || 'U';
  const fill = tone === 'white' ? 'bg-white text-[#1853ff]' : 'bg-[#3083ff] text-white';

  if (!user) return <UserRound className="h-5 w-5" strokeWidth={2.2} />;
  if (src) return <img src={src} alt="" className={`${className} rounded-full object-cover`} />;
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-full font-semibold ${fill}`}>
      {letter}
    </span>
  );
}
