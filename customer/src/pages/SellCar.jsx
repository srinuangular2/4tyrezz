import { Section } from '../components/PageShell';
import FaqsSection from '../components/FaqsSection';
import SellCarFlow from '../components/sell/SellCarFlow';
import SellBanner from '../components/sell/SellBanner';
import WhySell4tyrezz from '../components/sell/WhySell4tyrezz';

const SELL_FAQS = [
  {
    q: 'Is it free to sell my car with 4tyrezz?',
    a: 'Yes. Sharing details, seeing an estimate and booking inspection does not cost you a listing fee. Any payout is discussed only after inspection.',
  },
  {
    q: 'Is the first price I see the final amount I will get?',
    a: 'No. The online range is indicative. The final offer is confirmed after a physical inspection of condition, documents and kilometres.',
  },
  {
    q: 'Do I have to accept the offer?',
    a: 'No. You can decline and keep the car. Nothing is sold until you accept the inspected offer.',
  },
  {
    q: 'Can I cancel after booking an inspection?',
    a: 'Yes. Tell us before the slot and we will cancel. If you change your mind after inspection, you can still walk away.',
  },
  {
    q: 'How is my phone number used?',
    a: 'Enquiries come to the 4tyrezz team. We contact you about evaluation and offer. We do not publish your number on the car listing for public buyers to call.',
  },
  {
    q: 'How long until inspection?',
    a: 'Most bookings are scheduled within a few days, depending on city and slot availability. You pick the date and time in the form.',
  },
  {
    q: 'What if the offer is not good enough?',
    a: 'You can decline. Use the estimate as a guide, wait for a better slot, or keep driving the car. There is no obligation to sell.',
  },
  {
    q: 'I have more than one car. Can I still sell through 4tyrezz?',
    a: 'Yes. Submit each car separately so inspection and offers stay accurate. Our team will coordinate slots with you.',
  },
];

export default function SellCar() {
  return (
    <div className="bg-slate-50">
      <SellBanner />
      <Section eyebrow="Assured selling" title="Start with your registration number">
        <SellCarFlow />
      </Section>
      <Section bg>
        <WhySell4tyrezz />
      </Section>
      <Section className="bg-gradient-to-b from-blue-50/70">
        <FaqsSection
          faqs={SELL_FAQS}
          subtitle="Everything you need to know about selling your car with 4tyrezz."
        />
      </Section>
    </div>
  );
}
