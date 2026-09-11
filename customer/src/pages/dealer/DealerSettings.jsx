import Profile from '../dashboard/Profile';
import { ProfileCard } from '../profile/ProfileLayout';

export default function DealerSettings() {
  return (
    <ProfileCard eyebrow="Account" title="Dealer profile & settings">
      <Profile />
    </ProfileCard>
  );
}
