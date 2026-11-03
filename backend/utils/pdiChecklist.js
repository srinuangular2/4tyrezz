const PDI_CATEGORIES = [
  {
    key: 'exterior',
    label: 'Exterior',
    items: [
      { key: 'paint', label: 'Paint finish' },
      { key: 'panels', label: 'Panel gaps' },
      { key: 'glass', label: 'Glass and lights' },
      { key: 'tyres', label: 'Tyres' },
    ],
  },
  {
    key: 'mechanical',
    label: 'Mechanical',
    items: [
      { key: 'engine', label: 'Engine' },
      { key: 'gearbox', label: 'Gearbox' },
      { key: 'brakes', label: 'Brakes' },
      { key: 'suspension', label: 'Suspension' },
    ],
  },
  {
    key: 'ac',
    label: 'AC',
    items: [
      { key: 'cooling', label: 'Cooling' },
      { key: 'blower', label: 'Blower' },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    items: [
      { key: 'battery', label: 'Battery' },
      { key: 'infotainment', label: 'Infotainment' },
      { key: 'windows', label: 'Power windows' },
    ],
  },
  {
    key: 'vin',
    label: 'VIN',
    items: [
      { key: 'chassis', label: 'Chassis number match' },
      { key: 'engineNo', label: 'Engine number match' },
      { key: 'tamper', label: 'No tamper marks' },
    ],
  },
];

const REPAINT_PANELS = ['Bonnet', 'Roof', 'Boot', 'Front bumper', 'LHS doors', 'RHS doors', 'Quarter panel'];

const TIME_SLOTS = ['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00'];

function blankChecklist() {
  return PDI_CATEGORIES.map((cat) => ({
    key: cat.key,
    label: cat.label,
    status: 'pass',
    items: cat.items.map((item) => ({ ...item, result: 'pass' })),
  }));
}

function scoreChecklist(categories = []) {
  const items = categories.flatMap((cat) => cat.items || []);
  if (!items.length) return { score: 0, categories };
  const passed = items.filter((item) => item.result === 'pass').length;
  const next = categories.map((cat) => ({
    ...cat,
    status: (cat.items || []).every((item) => item.result === 'pass') ? 'pass' : 'fail',
  }));
  return { score: Math.round((passed / items.length) * 100), categories: next };
}

module.exports = {
  PDI_CATEGORIES,
  REPAINT_PANELS,
  TIME_SLOTS,
  blankChecklist,
  scoreChecklist,
};
