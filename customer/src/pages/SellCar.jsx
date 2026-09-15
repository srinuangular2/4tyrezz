import { PageHero, Section } from '../components/PageShell';
import SellCarFlow from '../components/sell/SellCarFlow';

export default function SellCar() {
  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Sell"
        title="Get a fair price for your car"
        subtitle="Identify the car, share condition and photos, see an indicative estimate, then book inspection. Final offers come after inspection."
      />
      <Section eyebrow="Assured selling" title="Four steps to a booked evaluation">
        <SellCarFlow />
      </Section>
    </div>
  );
}
