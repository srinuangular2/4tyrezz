const { rangeYears } = require('./brandMarket');

const NOW = null;

/**
 * India on-sale years by brand + model (launch → discontinue).
 * null end = still sold. Multiple ranges = separate generations.
 * Sources: OEM launch dates / used-car market listings (CarDekho, Spinny).
 */
const GENERATIONS = {
  'Maruti Suzuki': {
    '800': [1983, 2014],
    'A-Star': [2008, 2014],
    'Alto': [2000, 2012],
    'Alto 800': [2012, 2023],
    'Alto K10': [
      [2010, 2014],
      [2022, NOW],
    ],
    'Baleno': [2015, NOW],
    'Baleno RS': [2017, 2020],
    'Brezza': [2022, NOW],
    'Celerio': [2014, NOW],
    'Celerio X': [2017, 2021],
    'Ciaz': [2014, NOW],
    'Dzire': [2017, NOW],
    'Eeco': [2010, NOW],
    'Eeco Tour V': [2016, NOW],
    'Ertiga': [2012, NOW],
    'Ertiga Tour': [2019, NOW],
    'Esteem': [1994, 2008],
    'Fronx': [2023, NOW],
    'Grand Vitara': [
      [2003, 2015],
      [2022, NOW],
    ],
    'Gypsy': [1985, 2019],
    'Ignis': [2017, NOW],
    'Invicto': [2023, NOW],
    'Jimny': [2023, NOW],
    'Kizashi': [2011, 2014],
    'Omni': [1984, 2019],
    'Ritz': [2009, 2016],
    'S-Cross': [2015, 2022],
    'S Cross': [2015, 2022],
    'S-Presso': [2019, NOW],
    'SX4': [2007, 2014],
    'Swift': [2005, NOW],
    'Swift Dzire': [2008, 2020],
    'Swift Dzire Tour': [2015, NOW],
    'Vitara Brezza': [2016, 2022],
    'Victoris': [2025, NOW],
    'Wagon R': [1999, NOW],
    'XL6': [2019, NOW],
    'Zen': [1993, 2006],
    'e Vitara': [2025, NOW],
  },
  Hyundai: {
    Accent: [1999, 2013],
    Alcazar: [2021, NOW],
    Aura: [2020, NOW],
    Creta: [2015, NOW],
    'Creta Electric': [2025, NOW],
    'Creta N Line': [2024, NOW],
    Elantra: [2004, 2022],
    EON: [2011, 2019],
    Exter: [2023, NOW],
    Getz: [2004, 2010],
    'Grand i10': [2013, 2019],
    'Grand i10 Nios': [2019, NOW],
    'i10': [2007, 2019],
    'i20': [2010, NOW],
    'i20 Active': [2015, 2020],
    'i20 N Line': [2021, NOW],
    'Elite i20': [2014, 2020],
    'IONIQ 5': [2023, NOW],
    'Santa Fe': [2010, 2017],
    Santro: [
      [1998, 2014],
      [2018, 2022],
    ],
    Sonata: [2001, 2014],
    Terracan: [2003, 2007],
    Tucson: [2016, NOW],
    Venue: [2019, NOW],
    'Venue N Line': [2022, NOW],
    Verna: [2006, NOW],
    Xcent: [2014, 2020],
  },
  Honda: {
    Accord: [2001, 2020],
    Amaze: [2013, NOW],
    'Amaze - 2nd Gen': [2018, NOW],
    Brio: [2011, 2018],
    'BR-V': [2016, 2020],
    City: [1998, NOW],
    Civic: [1997, 2020],
    'CR-V': [2003, 2020],
    Elevate: [2023, NOW],
    Jazz: [2009, 2023],
    'WR-V': [2017, 2023],
  },
  Tata: {
    Altroz: [2020, NOW],
    Bolt: [2014, 2019],
    Curvv: [2024, NOW],
    'Curvv EV': [2024, NOW],
    Harrier: [2019, NOW],
    'Harrier EV': [2025, NOW],
    Hexa: [2017, 2020],
    Indica: [1998, 2018],
    Indigo: [2002, 2016],
    Nexon: [2017, NOW],
    'Nexon EV': [2020, NOW],
    Punch: [2021, NOW],
    'Punch EV': [2024, NOW],
    Safari: [
      [1998, 2019],
      [2021, NOW],
    ],
    Sierra: [2025, NOW],
    Tiago: [2016, NOW],
    'Tiago EV': [2022, NOW],
    Tigor: [2017, NOW],
    'Tigor EV': [2019, NOW],
    Zest: [2014, 2019],
  },
  Mahindra: {
    'BE 6': [2024, NOW],
    Bolero: [2000, NOW],
    'Bolero Neo': [2021, NOW],
    'Bolero Neo Plus': [2022, NOW],
    KUV100: [2016, 2023],
    Marazzo: [2018, 2023],
    Scorpio: [2002, 2022],
    'Scorpio Classic': [2022, NOW],
    'Scorpio-N': [2022, NOW],
    Thar: [
      [2010, 2019],
      [2020, NOW],
    ],
    'Thar Roxx': [2024, NOW],
    TUV300: [2015, 2020],
    XUV300: [2019, 2024],
    'XUV 3XO': [2024, NOW],
    'XUV 3XO EV': [2025, NOW],
    XUV500: [2011, 2021],
    XUV700: [2021, NOW],
    'XUV 7XO': [2025, NOW],
    'XEV 9e': [2024, NOW],
    'XEV 9S': [2025, NOW],
    Xylo: [2009, 2019],
  },
  Toyota: {
    Camry: [2002, NOW],
    Etios: [2010, 2020],
    'Etios Liva': [2011, 2020],
    Fortuner: [2009, NOW],
    Glanza: [2019, NOW],
    Hilux: [2022, NOW],
    Innova: [2005, 2016],
    'Innova Crysta': [2016, NOW],
    'Innova Hycross': [2022, NOW],
    'Land Cruiser 300': [2021, NOW],
    Rumion: [2023, NOW],
    'Urban Cruiser': [2020, 2022],
    'Urban Cruiser Hyryder': [2022, NOW],
    'Urban Cruiser Taisor': [2024, NOW],
    'Urban Cruiser eBella': [2025, NOW],
    Vellfire: [2020, NOW],
    Yaris: [2018, 2021],
  },
  Kia: {
    Carens: [2022, NOW],
    'Carens Clavis': [2025, NOW],
    'Carens Clavis EV': [2025, NOW],
    Carnival: [2020, NOW],
    EV6: [2022, NOW],
    EV9: [2024, NOW],
    Seltos: [2019, NOW],
    Sonet: [2020, NOW],
    Syros: [2025, NOW],
    'Syros EV': [2025, NOW],
  },
  Renault: {
    Captur: [2017, 2020],
    Duster: [
      [2012, 2022],
      [2025, NOW],
    ],
    Kiger: [2021, NOW],
    Kwid: [2015, NOW],
    Lodgy: [2015, 2020],
    Pulse: [2012, 2017],
    Scala: [2012, 2017],
    Triber: [2019, NOW],
  },
  Nissan: {
    Gravite: [2025, NOW],
    Magnite: [2020, NOW],
    Micra: [2010, 2019],
    Sunny: [2011, 2020],
    Tekton: [2025, NOW],
    Terrano: [2013, 2019],
  },
  Skoda: {
    Kodiaq: [2017, NOW],
    Kushaq: [2021, NOW],
    Kylaq: [2025, NOW],
    Octavia: [2001, 2023],
    Rapid: [2011, 2023],
    Slavia: [2022, NOW],
    Superb: [2004, 2023],
  },
  Volkswagen: {
    Ameo: [2016, 2020],
    Polo: [2009, 2022],
    Taigun: [2021, NOW],
    Tayron: [2025, NOW],
    Tiguan: [2017, NOW],
    'Tiguan R-Line': [2022, NOW],
    Vento: [2010, 2022],
    Virtus: [2022, NOW],
  },
  MG: {
    Astor: [2021, NOW],
    'Comet EV': [2023, NOW],
    Cyberster: [2025, NOW],
    Gloster: [2020, NOW],
    Hector: [2019, NOW],
    'Hector Plus': [2020, NOW],
    M9: [2025, NOW],
    Majestor: [2025, NOW],
    'Windsor EV': [2024, NOW],
    'ZS EV': [2020, NOW],
  },
  Jeep: {
    Compass: [2017, NOW],
    'Grand Cherokee': [2022, NOW],
    Meridian: [2022, NOW],
    Wrangler: [2021, NOW],
  },
  Citroen: {
    AircrossX: [2023, NOW],
    BasaltX: [2024, NOW],
    C3: [2022, NOW],
    C3X: [2022, NOW],
    'C3 Aircross': [2023, NOW],
    'C5 Aircross': [2021, NOW],
    eC3: [2023, NOW],
    eC3X: [2023, NOW],
  },
  BYD: {
    'ATTO 3': [2022, NOW],
    'eMAX 7': [2024, NOW],
    SEAL: [2023, NOW],
    'SEALION 7': [2025, NOW],
  },
  Tesla: {
    'Model 3': [2021, NOW],
    'Model Y': [2025, NOW],
    'Model Y L': [2025, NOW],
  },
  VinFast: {
    'VF 6': [2025, NOW],
    'VF 7': [2025, NOW],
    'VF MPV 7': [2025, NOW],
  },
  Ford: {
    Aspire: [2015, 2021],
    EcoSport: [2013, 2022],
    Endeavour: [2003, 2022],
    Figo: [2010, 2021],
    Freestyle: [2018, 2021],
  },
  Chevrolet: {
    Beat: [2010, 2017],
    Cruze: [2009, 2017],
    Enjoy: [2013, 2017],
    Sail: [2012, 2017],
    Spark: [2007, 2017],
    Tavera: [2004, 2017],
  },
};

const ALIASES = {
  'maruti suzuki::wagonr': 'Wagon R',
  'maruti suzuki::wagon r': 'Wagon R',
  'maruti suzuki::s cross': 'S-Cross',
  'maruti suzuki::scross': 'S-Cross',
  'maruti suzuki::swift dzire': 'Swift Dzire',
  'hyundai::grand i10 nios': 'Grand i10 Nios',
  'hyundai::i 20': 'i20',
};

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toYears(range) {
  if (!range || !range.length) return [];
  const start = range[0];
  const end = range[1] == null ? new Date().getFullYear() : range[1];
  return rangeYears(start, end);
}

function yearsForModel(brand, model) {
  const b = String(brand || '').trim();
  const m = String(model || '').trim();
  if (!b || !m) return null;
  const aliasKey = `${norm(b)}::${norm(m)}`;
  const mappedName = ALIASES[aliasKey] || m;
  const group = GENERATIONS[b] || GENERATIONS[Object.keys(GENERATIONS).find((k) => norm(k) === norm(b))];
  if (!group) return null;
  const entry =
    group[mappedName] ||
    group[m] ||
    Object.entries(group).find(([name]) => norm(name) === norm(mappedName))?.[1];
  if (!entry) return null;
  const ranges = Array.isArray(entry[0]) ? entry : [entry];
  const years = [...new Set(ranges.flatMap((r) => toYears(r)))];
  years.sort((a, b) => b - a);
  return years;
}

/** Used-car names CarDekho still lists that the current OEM catalogue dropped. */
const HISTORICAL_MODELS = [
  ['Maruti Suzuki', 'Alto 800'],
  ['Maruti Suzuki', 'Baleno RS'],
  ['Maruti Suzuki', 'Celerio X'],
  ['Maruti Suzuki', 'Ciaz'],
  ['Maruti Suzuki', 'Eeco Tour V'],
  ['Maruti Suzuki', 'Ertiga Tour'],
  ['Maruti Suzuki', 'Ignis'],
  ['Maruti Suzuki', 'S-Cross'],
  ['Maruti Suzuki', 'Swift Dzire'],
  ['Maruti Suzuki', 'Swift Dzire Tour'],
  ['Maruti Suzuki', 'Vitara Brezza'],
  ['Hyundai', 'Elantra'],
  ['Hyundai', 'Santro'],
  ['Hyundai', 'Tucson'],
  ['Hyundai', 'Xcent'],
  ['Hyundai', 'i20 Active'],
  ['Honda', 'Jazz'],
  ['Honda', 'WR-V'],
  ['Honda', 'Civic'],
  ['Toyota', 'Etios'],
  ['Toyota', 'Urban Cruiser'],
  ['Ford', 'EcoSport'],
  ['Ford', 'Endeavour'],
  ['Ford', 'Figo'],
  ['Renault', 'Captur'],
  ['Renault', 'Lodgy'],
  ['Volkswagen', 'Polo'],
  ['Volkswagen', 'Vento'],
  ['Mahindra', 'XUV300'],
  ['Mahindra', 'XUV700'],
  ['Mahindra', 'Scorpio'],
];

function historicalModelRows() {
  return HISTORICAL_MODELS.map(([brand, model]) => ({
    brand,
    model,
    bodyType: '',
    fuelType: '',
    transmission: '',
    variant: '',
    years: yearsForModel(brand, model) || [],
    source: 'market-history',
    sourceKey: `history::${norm(brand)}::${norm(model)}`.replace(/\s+/g, '-'),
  }));
}

module.exports = { yearsForModel, historicalModelRows, GENERATIONS };
