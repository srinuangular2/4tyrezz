const { rangeYears } = require('./brandMarket');
const { yearsForModel } = require('./modelGenerations');

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function T(variant, fuelType, transmission, bodyType, years) {
  return { variant, fuelType, transmission, bodyType, years };
}

/**
 * CarDekho / used-market trims for models the OEM catalogue omits
 * (Tour/fleet, discontinued names). Shown live even before a full reseed.
 */
const TRIMS = {
  'Maruti Suzuki::Ertiga Tour': [
    T('STD', 'Petrol', 'Manual', 'MUV'),
    T('STD CNG', 'CNG', 'Manual', 'MUV'),
    T('1.5 D', 'Diesel', 'Manual', 'MUV', rangeYears(2019, 2022)),
  ],
  'Maruti Suzuki::Swift Dzire Tour': [
    T('LXI', 'Petrol', 'Manual', 'Sedan'),
    T('VXI', 'Petrol', 'Manual', 'Sedan'),
    T('S-CNG', 'CNG', 'Manual', 'Sedan'),
    T('LDI', 'Diesel', 'Manual', 'Sedan', rangeYears(2015, 2020)),
    T('VDI', 'Diesel', 'Manual', 'Sedan', rangeYears(2015, 2020)),
  ],
  'Maruti Suzuki::Eeco Tour V': [
    T('STD 5 STR', 'Petrol', 'Manual', 'MUV'),
    T('AC 5 STR', 'Petrol', 'Manual', 'MUV'),
    T('AC CNG 5 STR', 'CNG', 'Manual', 'MUV'),
  ],
  'Maruti Suzuki::Alto 800': [
    T('STD', 'Petrol', 'Manual', 'Hatchback'),
    T('LX', 'Petrol', 'Manual', 'Hatchback'),
    T('LXI', 'Petrol', 'Manual', 'Hatchback'),
    T('VXI', 'Petrol', 'Manual', 'Hatchback'),
    T('LXI CNG', 'CNG', 'Manual', 'Hatchback'),
  ],
  'Maruti Suzuki::Baleno RS': [T('1.0 RS', 'Petrol', 'Manual', 'Hatchback')],
  'Maruti Suzuki::Celerio X': [
    T('VXI', 'Petrol', 'Manual', 'Hatchback'),
    T('ZXI', 'Petrol', 'Manual', 'Hatchback'),
    T('VXI AMT', 'Petrol', 'AMT', 'Hatchback'),
  ],
  'Maruti Suzuki::Ciaz': [
    T('Sigma', 'Petrol', 'Manual', 'Sedan'),
    T('Delta', 'Petrol', 'Manual', 'Sedan'),
    T('Zeta', 'Petrol', 'Manual', 'Sedan'),
    T('Alpha', 'Petrol', 'Manual', 'Sedan'),
    T('Delta AT', 'Petrol', 'Automatic', 'Sedan'),
    T('Zeta Diesel', 'Diesel', 'Manual', 'Sedan', rangeYears(2014, 2020)),
    T('Alpha Diesel', 'Diesel', 'Manual', 'Sedan', rangeYears(2014, 2020)),
  ],
  'Maruti Suzuki::Ignis': [
    T('Sigma', 'Petrol', 'Manual', 'Hatchback'),
    T('Delta', 'Petrol', 'Manual', 'Hatchback'),
    T('Zeta', 'Petrol', 'Manual', 'Hatchback'),
    T('Alpha', 'Petrol', 'Manual', 'Hatchback'),
    T('Delta AMT', 'Petrol', 'AMT', 'Hatchback'),
    T('Zeta AMT', 'Petrol', 'AMT', 'Hatchback'),
  ],
  'Maruti Suzuki::S-Cross': [
    T('Sigma', 'Petrol', 'Manual', 'SUV'),
    T('Delta', 'Petrol', 'Manual', 'SUV'),
    T('Zeta', 'Petrol', 'Manual', 'SUV'),
    T('Alpha', 'Petrol', 'Manual', 'SUV'),
    T('Zeta AT', 'Petrol', 'Automatic', 'SUV'),
  ],
  'Maruti Suzuki::Swift Dzire': [
    T('LXI', 'Petrol', 'Manual', 'Sedan'),
    T('VXI', 'Petrol', 'Manual', 'Sedan'),
    T('ZXI', 'Petrol', 'Manual', 'Sedan'),
    T('VXI AMT', 'Petrol', 'AMT', 'Sedan'),
    T('ZXI AMT', 'Petrol', 'AMT', 'Sedan'),
    T('LDI', 'Diesel', 'Manual', 'Sedan', rangeYears(2008, 2020)),
    T('VDI', 'Diesel', 'Manual', 'Sedan', rangeYears(2008, 2020)),
    T('ZDI', 'Diesel', 'Manual', 'Sedan', rangeYears(2008, 2020)),
  ],
  'Maruti Suzuki::Vitara Brezza': [
    T('LXi', 'Petrol', 'Manual', 'SUV'),
    T('VXi', 'Petrol', 'Manual', 'SUV'),
    T('ZXi', 'Petrol', 'Manual', 'SUV'),
    T('ZXi+', 'Petrol', 'Manual', 'SUV'),
    T('VXi AT', 'Petrol', 'Automatic', 'SUV'),
    T('LDi', 'Diesel', 'Manual', 'SUV', rangeYears(2016, 2020)),
    T('VDi', 'Diesel', 'Manual', 'SUV', rangeYears(2016, 2020)),
    T('ZDi', 'Diesel', 'Manual', 'SUV', rangeYears(2016, 2020)),
  ],
  'Hyundai::Elantra': [
    T('S', 'Petrol', 'Manual', 'Sedan'),
    T('SX', 'Petrol', 'Manual', 'Sedan'),
    T('SX(O)', 'Petrol', 'Automatic', 'Sedan'),
    T('SX Diesel', 'Diesel', 'Manual', 'Sedan'),
  ],
  'Hyundai::Santro': [
    T('Era', 'Petrol', 'Manual', 'Hatchback'),
    T('Magna', 'Petrol', 'Manual', 'Hatchback'),
    T('Sportz', 'Petrol', 'Manual', 'Hatchback'),
    T('Asta', 'Petrol', 'Manual', 'Hatchback'),
    T('Magna CNG', 'CNG', 'Manual', 'Hatchback'),
    T('Sportz AMT', 'Petrol', 'AMT', 'Hatchback'),
  ],
  'Hyundai::Tucson': [
    T('2WD MT', 'Diesel', 'Manual', 'SUV'),
    T('2WD AT', 'Diesel', 'Automatic', 'SUV'),
    T('4WD AT', 'Diesel', 'Automatic', 'SUV'),
    T('Platinum AT', 'Petrol', 'Automatic', 'SUV'),
  ],
  'Hyundai::Xcent': [
    T('E', 'Petrol', 'Manual', 'Sedan'),
    T('S', 'Petrol', 'Manual', 'Sedan'),
    T('SX', 'Petrol', 'Manual', 'Sedan'),
    T('S CNG', 'CNG', 'Manual', 'Sedan'),
    T('S Diesel', 'Diesel', 'Manual', 'Sedan'),
  ],
  'Hyundai::i20 Active': [
    T('1.2 S', 'Petrol', 'Manual', 'SUV'),
    T('1.2 SX', 'Petrol', 'Manual', 'SUV'),
    T('1.4 S', 'Diesel', 'Manual', 'SUV'),
    T('1.4 SX', 'Diesel', 'Manual', 'SUV'),
  ],
  'Honda::Jazz': [
    T('V', 'Petrol', 'Manual', 'Hatchback'),
    T('VX', 'Petrol', 'Manual', 'Hatchback'),
    T('ZX', 'Petrol', 'Manual', 'Hatchback'),
    T('VX CVT', 'Petrol', 'CVT', 'Hatchback'),
    T('ZX CVT', 'Petrol', 'CVT', 'Hatchback'),
  ],
  'Honda::WR-V': [
    T('SV', 'Petrol', 'Manual', 'SUV'),
    T('VX', 'Petrol', 'Manual', 'SUV'),
    T('VX Diesel', 'Diesel', 'Manual', 'SUV'),
  ],
  'Honda::Civic': [
    T('V', 'Petrol', 'CVT', 'Sedan'),
    T('VX', 'Petrol', 'CVT', 'Sedan'),
    T('ZX', 'Petrol', 'CVT', 'Sedan'),
    T('ZX Diesel', 'Diesel', 'Manual', 'Sedan'),
  ],
  'Toyota::Etios': [
    T('J', 'Petrol', 'Manual', 'Sedan'),
    T('G', 'Petrol', 'Manual', 'Sedan'),
    T('V', 'Petrol', 'Manual', 'Sedan'),
    T('GD', 'Diesel', 'Manual', 'Sedan'),
    T('VD', 'Diesel', 'Manual', 'Sedan'),
  ],
  'Toyota::Urban Cruiser': [
    T('Mid', 'Petrol', 'Manual', 'SUV'),
    T('High', 'Petrol', 'Manual', 'SUV'),
    T('High AT', 'Petrol', 'Automatic', 'SUV'),
  ],
  'Ford::EcoSport': [
    T('Ambiente', 'Petrol', 'Manual', 'SUV'),
    T('Trend', 'Petrol', 'Manual', 'SUV'),
    T('Titanium', 'Petrol', 'Manual', 'SUV'),
    T('Titanium AT', 'Petrol', 'Automatic', 'SUV'),
    T('Sports', 'Petrol', 'Manual', 'SUV'),
    T('Trend Diesel', 'Diesel', 'Manual', 'SUV'),
    T('Titanium Diesel', 'Diesel', 'Manual', 'SUV'),
  ],
  'Ford::Endeavour': [
    T('Titanium 4x2', 'Diesel', 'Automatic', 'SUV'),
    T('Titanium 4x4', 'Diesel', 'Automatic', 'SUV'),
    T('Sport', 'Diesel', 'Automatic', 'SUV'),
  ],
  'Ford::Figo': [
    T('Ambiente', 'Petrol', 'Manual', 'Hatchback'),
    T('Trend', 'Petrol', 'Manual', 'Hatchback'),
    T('Titanium', 'Petrol', 'Manual', 'Hatchback'),
    T('Titanium Diesel', 'Diesel', 'Manual', 'Hatchback'),
  ],
  'Renault::Captur': [
    T('RXE', 'Petrol', 'Manual', 'SUV'),
    T('RXL', 'Petrol', 'Manual', 'SUV'),
    T('RXT', 'Petrol', 'Manual', 'SUV'),
    T('Platine', 'Petrol', 'Manual', 'SUV'),
    T('RXL Diesel', 'Diesel', 'Manual', 'SUV'),
  ],
  'Renault::Lodgy': [
    T('Std', 'Diesel', 'Manual', 'MUV'),
    T('RxE', 'Diesel', 'Manual', 'MUV'),
    T('RxZ', 'Diesel', 'Manual', 'MUV'),
    T('Stepway', 'Diesel', 'Manual', 'MUV'),
  ],
  'Volkswagen::Polo': [
    T('Trendline', 'Petrol', 'Manual', 'Hatchback'),
    T('Comfortline', 'Petrol', 'Manual', 'Hatchback'),
    T('Highline', 'Petrol', 'Manual', 'Hatchback'),
    T('Highline Plus', 'Petrol', 'Manual', 'Hatchback'),
    T('GT TSI', 'Petrol', 'Automatic', 'Hatchback'),
    T('Comfortline Diesel', 'Diesel', 'Manual', 'Hatchback'),
  ],
  'Volkswagen::Vento': [
    T('Trendline', 'Petrol', 'Manual', 'Sedan'),
    T('Comfortline', 'Petrol', 'Manual', 'Sedan'),
    T('Highline', 'Petrol', 'Manual', 'Sedan'),
    T('Highline AT', 'Petrol', 'Automatic', 'Sedan'),
    T('Comfortline Diesel', 'Diesel', 'Manual', 'Sedan'),
  ],
  'Mahindra::XUV300': [
    T('W4', 'Petrol', 'Manual', 'SUV'),
    T('W6', 'Petrol', 'Manual', 'SUV'),
    T('W8', 'Petrol', 'Manual', 'SUV'),
    T('W8(O)', 'Petrol', 'Manual', 'SUV'),
    T('W6 Diesel', 'Diesel', 'Manual', 'SUV'),
    T('W8 Diesel', 'Diesel', 'Manual', 'SUV'),
  ],
  'Mahindra::XUV700': [
    T('MX', 'Petrol', 'Manual', 'SUV'),
    T('AX3', 'Petrol', 'Manual', 'SUV'),
    T('AX5', 'Petrol', 'Manual', 'SUV'),
    T('AX7', 'Petrol', 'Automatic', 'SUV'),
    T('AX7 Diesel', 'Diesel', 'Automatic', 'SUV'),
    T('AX7 L', 'Diesel', 'Automatic', 'SUV'),
  ],
  'Mahindra::Scorpio': [
    T('S5', 'Diesel', 'Manual', 'SUV'),
    T('S7', 'Diesel', 'Manual', 'SUV'),
    T('S11', 'Diesel', 'Manual', 'SUV'),
    T('S11 4WD', 'Diesel', 'Manual', 'SUV'),
  ],
};

function resolveKey(brand, model) {
  const direct = `${brand}::${model}`;
  if (TRIMS[direct]) return direct;
  return Object.keys(TRIMS).find((key) => {
    const [b, m] = key.split('::');
    return norm(b) === norm(brand) && norm(m) === norm(model);
  }) || null;
}

function marketVariantRows() {
  const rows = [];
  Object.entries(TRIMS).forEach(([key, trims]) => {
    const [brand, model] = key.split('::');
    const modelYears = yearsForModel(brand, model) || [];
    trims.forEach((trim) => {
      const years = trim.years?.length ? trim.years : modelYears;
      rows.push({
        brand,
        model,
        bodyType: trim.bodyType || '',
        fuelType: trim.fuelType || '',
        transmission: trim.transmission || '',
        variant: trim.variant,
        years,
        source: 'market-trims',
        sourceKey: `market-trims::${slug(brand)}::${slug(model)}::${slug(trim.variant)}::${slug(trim.fuelType)}::${slug(trim.transmission)}`,
      });
    });
  });
  return rows;
}

function listMarketVariants({ brand, model, fuelType, transmission, search, year } = {}) {
  const key = resolveKey(brand, model);
  if (!key) return [];
  const [b, m] = key.split('::');
  const modelYears = yearsForModel(b, m) || [];
  const y = Number(year);
  const q = String(search || '').trim().toLowerCase();
  return (TRIMS[key] || [])
    .filter((trim) => {
      const years = trim.years?.length ? trim.years : modelYears;
      if (y && years.length && !years.includes(y)) return false;
      if (fuelType && norm(trim.fuelType) !== norm(fuelType)) return false;
      if (transmission && norm(trim.transmission) !== norm(transmission)) return false;
      if (q && !String(trim.variant).toLowerCase().includes(q)) return false;
      return true;
    })
    .map((trim, i) => ({
      _id: `market-${slug(b)}-${slug(m)}-${slug(trim.variant)}-${i}`,
      name: trim.variant,
      variant: trim.variant,
      brand: b,
      model: m,
      fuelType: trim.fuelType,
      transmission: trim.transmission,
      bodyType: trim.bodyType,
      years: trim.years?.length ? trim.years : modelYears,
    }));
}

function parentModelName(model) {
  return String(model || '')
    .replace(/\s+tour(\s+v)?$/i, '')
    .replace(/\s+n[\s-]?line$/i, '')
    .trim();
}

module.exports = {
  marketVariantRows,
  listMarketVariants,
  parentModelName,
  resolveKey,
};
