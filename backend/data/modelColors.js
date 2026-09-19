/** Official-style exterior/interior palettes by brand + model (CarDekho / OEM names). */

const C = (name, hex) => ({ name, hex });

const WHITE = C('White', '#F4F4F0');
const PEARL_WHITE = C('Pearl White', '#F7F6F2');
const SILVER = C('Silver', '#C5C9CE');
const GREY = C('Grey', '#6B7178');
const BLACK = C('Black', '#1A1A1A');
const RED = C('Red', '#C0392B');
const BLUE = C('Blue', '#1E4E8C');
const BROWN = C('Brown', '#6B4A2E');
const ORANGE = C('Orange', '#E67E22');
const GREEN = C('Green', '#2E6B4F');
const MAROON = C('Maroon', '#6B1D2A');
const GOLD = C('Gold', '#C4A35A');
const BEIGE = C('Beige', '#D9C7A8');

const DEFAULT_EXTERIOR = [WHITE, PEARL_WHITE, SILVER, GREY, BLACK, RED, BLUE, BROWN, ORANGE, GREEN, MAROON, GOLD];
const DEFAULT_INTERIOR = [
  C('Beige', '#D9C7A8'),
  C('Black', '#1A1A1A'),
  C('Grey', '#6B7178'),
  C('Brown', '#6B4A2E'),
  C('Dual Tone', '#8A8074'),
  C('Ivory', '#EFE6D4'),
  C('Maroon', '#6B1D2A'),
  C('Tan', '#C4A484'),
];

const MODELS = {
  'maruti suzuki::baleno': {
    exterior: [
      C('Arctic White', '#F5F5F2'),
      C('Splendid Silver', '#C8CCD1'),
      C('Grandeur Grey', '#5C6168'),
      C('Nexa Blue', '#163A70'),
      C('Opulent Red', '#9B1B2E'),
      C('Luxe Beige', '#CDBBA0'),
      C('Magma Grey', '#4A4E55'),
      C('Celestial Blue', '#2A4F86'),
    ],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8'), C('Dual Tone', '#8A8074')],
  },
  'maruti suzuki::swift': {
    exterior: [
      C('Pearl Arctic White', '#F6F6F3'),
      C('Silky Silver', '#C5C9CE'),
      C('Magma Grey', '#4A4E55'),
      C('Solid Fire Red', '#C0392B'),
      C('Lazuli Blue', '#1E4E8C'),
      C('Midnight Black', '#1A1A1A'),
      C('Sizzling Red', '#E03A3A'),
    ],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'maruti suzuki::dzire': {
    exterior: [WHITE, SILVER, GREY, C('Nexa Blue', '#163A70'), C('Gallant Red', '#A31E2E'), BLACK],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'maruti suzuki::brezza': {
    exterior: [WHITE, SILVER, GREY, C('Brave Khaki', '#8A7A4B'), C('Splendid Silver', '#C8CCD1'), C('Exuberant Red', '#C0392B'), C('Pearl Midnight Black', '#1A1A1A'), C('Sizzling Red', '#E03A3A')],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'maruti suzuki::ertiga': {
    exterior: [WHITE, SILVER, GREY, BLUE, C('Auburn Red', '#8B2E2E'), BLACK],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'hyundai::creta': {
    exterior: [
      C('Polar White', '#F5F5F2'),
      C('Typhoon Silver', '#C5C9CE'),
      C('Titan Grey', '#5C6168'),
      C('Abyss Black', '#1A1A1A'),
      C('Fiery Red', '#C0392B'),
      C('Ranger Khaki', '#8A7A4B'),
      C('Atlas White', '#EEEEE8'),
      C('Robust Emerald', '#1F5C4A'),
    ],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone Beige', '#D0C0A4'), C('Brown', '#6B4A2E')],
  },
  'hyundai::i20': {
    exterior: [C('Polar White', '#F5F5F2'), SILVER, GREY, C('Thunder Blue', '#1E3A6E'), C('Fiery Red', '#C0392B'), BLACK, C('Amazon Grey', '#6B7178')],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8')],
  },
  'hyundai::venue': {
    exterior: [WHITE, SILVER, GREY, C('Denim Blue', '#2A4A7A'), RED, BLACK, C('Intense Blue', '#163A70')],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'hyundai::verna': {
    exterior: [WHITE, SILVER, GREY, C('Starry Night', '#1A2740'), C('Fiery Red', '#C0392B'), BLACK, C('Tellurian Brown', '#6B4A2E')],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'tata::nexon': {
    exterior: [WHITE, SILVER, GREY, C('Daytona Grey', '#4A4E55'), C('Fearless Red', '#C0392B'), C('Pristine White', '#F5F5F2'), C('Flame Red', '#E03A3A'), BLACK, C('Grassland Beige', '#CDBBA0')],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'tata::punch': {
    exterior: [WHITE, SILVER, GREY, C('Tornado Blue', '#1E4E8C'), C('Orcus White', '#F5F5F2'), C('Meteor Bronze', '#7A6248'), RED, BLACK],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8')],
  },
  'tata::harrier': {
    exterior: [WHITE, SILVER, GREY, C('Calypso Red', '#9B1B2E'), C('Oberon Black', '#1A1A1A'), C('Tropical Mist', '#C8D4D0'), C('Pebble Grey', '#8A9096')],
    interior: [C('Black', '#1A1A1A'), C('Brown', '#6B4A2E')],
  },
  'honda::city': {
    exterior: [C('Platinum White Pearl', '#F7F6F2'), C('Lunar Silver Metallic', '#C5C9CE'), C('Modern Steel Metallic', '#6B7178'), C('Radiant Red Metallic', '#C0392B'), C('Golden Brown Metallic', '#7A6248'), BLACK],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'honda::amaze': {
    exterior: [WHITE, SILVER, GREY, RED, C('Golden Brown', '#7A6248'), BLACK],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'kia::seltos': {
    exterior: [WHITE, SILVER, GREY, C('Imperial Blue', '#163A70'), C('Intense Red', '#C0392B'), BLACK, C('Gravity Grey', '#5C6168'), C('Pewter Olive', '#6B6B4A')],
    interior: [C('Black', '#1A1A1A'), C('Brown', '#6B4A2E'), C('Sage Green', '#5C6B5A')],
  },
  'kia::sonet': {
    exterior: [WHITE, SILVER, GREY, C('Intense Red', '#C0392B'), C('Intelligency Blue', '#1E4E8C'), BLACK, C('Beige Beige', '#CDBBA0')],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'toyota::innova crysta': {
    exterior: [WHITE, SILVER, GREY, C('Avant Garde Bronze', '#7A6248'), C('Sparkling Black Crystal Shine', '#1A1A1A'), C('Super White', '#F5F5F2')],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'toyota::fortuner': {
    exterior: [WHITE, SILVER, GREY, C('Attitude Black', '#1A1A1A'), C('Phantom Brown', '#6B4A2E'), C('Emotional Red', '#C0392B')],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8')],
  },
  'toyota::glanza': {
    exterior: [WHITE, SILVER, GREY, C('Cafe White', '#F5F5F2'), C('Enticing Red', '#C0392B'), C('Gaming Grey', '#5C6168'), BLUE],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'mahindra::xuv700': {
    exterior: [WHITE, SILVER, GREY, C('Everest White', '#F5F5F2'), C('Dazzling Silver', '#C5C9CE'), C('Midnight Black', '#1A1A1A'), C('Red Rage', '#C0392B'), C('Electric Blue', '#1E4E8C')],
    interior: [C('Black', '#1A1A1A'), C('Brown', '#6B4A2E')],
  },
  'mahindra::thar': {
    exterior: [C('Napoli Black', '#1A1A1A'), C('Rocky Beige', '#CDBBA0'), C('Red Rage', '#C0392B'), C('Galaxy Grey', '#5C6168'), WHITE, C('Deep Forest', '#2E6B4F')],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'mahindra::scorpio': {
    exterior: [WHITE, SILVER, GREY, RED, BLACK, C('Diamond White', '#F5F5F2')],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'maruti suzuki::alto': {
    exterior: [WHITE, SILVER, GREY, RED, C('Granite Grey', '#5C6168'), C('Metallic Silky Silver', '#C5C9CE')],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8')],
  },
  'maruti suzuki::wagon r': {
    exterior: [WHITE, SILVER, GREY, C('Nutmeg Brown', '#6B4A2E'), C('Poolside Blue', '#1E4E8C'), RED],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'maruti suzuki::fronx': {
    exterior: [WHITE, SILVER, GREY, C('Nexa Blue', '#163A70'), C('Earthen Brown', '#6B4A2E'), C('Sizzling Red', '#E03A3A'), BLACK],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'maruti suzuki::ciaz': {
    exterior: [WHITE, SILVER, GREY, C('Nexa Blue', '#163A70'), C('Pearl Midnight Black', '#1A1A1A'), BROWN],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'hyundai::grand i10 nios': {
    exterior: [C('Polar White', '#F5F5F2'), SILVER, GREY, C('Aqua Teal', '#2A6B6B'), RED, C('Typhoon Silver', '#C5C9CE')],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'hyundai::exter': {
    exterior: [WHITE, SILVER, GREY, C('Atlas White', '#EEEEE8'), C('Starry Night', '#1A2740'), C('Ranger Khaki', '#8A7A4B'), RED],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'tata::tiago': {
    exterior: [WHITE, SILVER, GREY, C('Daytona Grey', '#4A4E55'), C('Flame Red', '#E03A3A'), C('Arizona Blue', '#1E4E8C')],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8')],
  },
  'tata::altroz': {
    exterior: [WHITE, SILVER, GREY, C('Downtown Red', '#C0392B'), C('Highstreet Gold', '#C4A35A'), C('Avenue White', '#F5F5F2'), BLACK],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'honda::elevate': {
    exterior: [C('Platinum White Pearl', '#F7F6F2'), SILVER, GREY, C('Golden Brown Metallic', '#7A6248'), C('Radiant Red Metallic', '#C0392B'), BLACK],
    interior: [C('Beige', '#D9C7A8'), C('Black', '#1A1A1A')],
  },
  'kia::carens': {
    exterior: [WHITE, SILVER, GREY, C('Imperial Blue', '#163A70'), C('Intense Red', '#C0392B'), BLACK],
    interior: [C('Black', '#1A1A1A'), C('Brown', '#6B4A2E')],
  },
  'toyota::urban cruiser hyryder': {
    exterior: [WHITE, SILVER, GREY, C('Cafe White', '#F5F5F2'), C('Sporting Red', '#C0392B'), C('Midnight Black', '#1A1A1A'), C('Enticing Silver', '#C5C9CE')],
    interior: [C('Black', '#1A1A1A'), C('Brown', '#6B4A2E')],
  },
  'mahindra::xuv 3xo': {
    exterior: [WHITE, SILVER, GREY, C('Tango Red', '#C0392B'), C('Nebula Blue', '#1E4E8C'), BLACK, C('Deep Forest', '#2E6B4F')],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'volkswagen::taigun': {
    exterior: [WHITE, SILVER, GREY, C('Wild Cherry Red', '#C0392B'), C('Carbon Steel Grey', '#4A4E55'), C('Rising Blue', '#1E4E8C'), BLACK],
    interior: [C('Black', '#1A1A1A'), C('Dual Tone', '#8A8074')],
  },
  'skoda::kushaq': {
    exterior: [WHITE, SILVER, GREY, C('Candy White', '#F5F5F2'), C('Brilliant Silver', '#C5C9CE'), C('Carbon Steel', '#4A4E55'), RED, BLACK],
    interior: [C('Black', '#1A1A1A'), C('Beige', '#D9C7A8')],
  },
};

function normalizeBrand(brand) {
  const b = String(brand || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!b) return '';
  if (b.startsWith('maruti')) return 'maruti suzuki';
  if (b.includes('mercedes')) return 'mercedes benz';
  if (b.startsWith('tata')) return 'tata';
  if (b.startsWith('mg') || b.includes('morris')) return 'mg';
  if (b === 'vw' || b.includes('volkswagen')) return 'volkswagen';
  return b;
}

function normalizeModel(model) {
  return String(model || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function colorsFor(brand, model) {
  const b = normalizeBrand(brand);
  const m = normalizeModel(model);
  const exact = MODELS[`${b}::${m}`];
  if (exact?.exterior?.length) {
    return { exterior: exact.exterior, interior: exact.interior || DEFAULT_INTERIOR, matched: true };
  }
  const compact = m.replace(/\s/g, '');
  const hit = Object.entries(MODELS).find(([key]) => {
    const [kb, km] = key.split('::');
    const brandOk = !b || kb === b || kb.includes(b) || b.includes(kb);
    if (!brandOk || !m) return false;
    const kmCompact = km.replace(/\s/g, '');
    return km === m || kmCompact === compact || m.includes(km) || km.includes(m);
  });
  if (hit?.[1]?.exterior?.length) {
    return { exterior: hit[1].exterior, interior: hit[1].interior || DEFAULT_INTERIOR, matched: true };
  }
  return { exterior: DEFAULT_EXTERIOR, interior: DEFAULT_INTERIOR, matched: false };
}

module.exports = { colorsFor, DEFAULT_EXTERIOR, DEFAULT_INTERIOR };
