require('dotenv').config();
const { mapRcPayload, fetchVehicleDetailsByReg } = require('../services/integrations/rtoLookupService');

const fixture = {
  status: true,
  data: {
    rc_maker_desc: 'HYUNDAI MOTOR INDIA LTD',
    rc_maker_model: 'I20 ASTA 1.2 KAPPA',
    rc_fuel_desc: 'PETROL',
    rc_regn_dt: '14-Jun-2021',
    rc_registered_at: 'RTA HYDERABAD',
    rc_color: 'POLAR WHITE',
    rc_owner_sr: '1',
    rc_vh_class_desc: 'Motor Car(LMV)',
    rc_body_type_desc: 'HATCHBACK',
    rc_insurance_upto: '13-Jun-2026',
  },
};

console.log('fixture map', mapRcPayload(fixture));

const way2Fixture = {
  status: 'OK',
  success: true,
  data: {
    result: {
      maker_description: 'HYUNDAI MOTOR INDIA LTD',
      maker_model: 'I20 ASTA 1.2 KAPPA',
      fuel_type: 'PETROL',
      registration_date: '2021-06-14',
      registered_at: 'SOUTH DELHI, Delhi',
      vehicle_category: 'LMV',
      insurance_upto: '2026-06-13',
    },
  },
};
console.log('way2api fixture map', mapRcPayload(way2Fixture));

const plate = process.argv[2];
if (!plate) {
  console.log('Pass a real RC to hit the live provider: node scripts/testRtoLookup.js TS09XX0000');
  process.exit(0);
}

fetchVehicleDetailsByReg(plate)
  .then((data) => {
    console.log('live', data);
    process.exit(0);
  })
  .catch((err) => {
    console.error('live error', err.status, err.message);
    process.exit(1);
  });
