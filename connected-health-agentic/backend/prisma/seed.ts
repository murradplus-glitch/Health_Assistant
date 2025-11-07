import { prisma } from '../src/prisma.js';

const facilities = [
  { name: 'PIMS Islamabad', type: 'Hospital', district: 'Islamabad', tehsil: 'Islamabad', lat: 33.6938, lng: 73.0652, services: ['emergency', 'pediatrics', 'maternal'], openingHours: { daily: '24/7' }, contact: '051-926-1170' },
  { name: 'DHQ Hospital Rawalpindi', type: 'Hospital', district: 'Rawalpindi', tehsil: 'Rawalpindi', lat: 33.5973, lng: 73.0481, services: ['emergency', 'medicine', 'surgery'], openingHours: { daily: '24/7' }, contact: '051-555-1234' },
  { name: 'THQ Gujar Khan', type: 'Hospital', district: 'Rawalpindi', tehsil: 'Gujar Khan', lat: 33.2556, lng: 73.3024, services: ['maternal', 'pediatrics'], openingHours: { daily: '24/7' }, contact: '051-333-1199' },
  { name: 'Lady Reading Hospital', type: 'Hospital', district: 'Peshawar', tehsil: 'Peshawar', lat: 34.0151, lng: 71.5805, services: ['emergency', 'trauma', 'medicine'], openingHours: { daily: '24/7' }, contact: '091-921-1441' },
  { name: 'Khyber Teaching Hospital', type: 'Hospital', district: 'Peshawar', tehsil: 'Peshawar', lat: 34.0037, lng: 71.5130, services: ['maternal', 'pediatrics', 'surgery'], openingHours: { daily: '24/7' }, contact: '091-922-4400' },
  { name: 'Civil Hospital Quetta', type: 'Hospital', district: 'Quetta', tehsil: 'Quetta', lat: 30.1798, lng: 66.9750, services: ['emergency', 'medicine'], openingHours: { daily: '24/7' }, contact: '081-920-1100' },
  { name: 'Children Hospital Karachi', type: 'Hospital', district: 'Karachi', tehsil: 'Karachi East', lat: 24.8615, lng: 67.0099, services: ['pediatrics', 'emergency'], openingHours: { daily: '24/7' }, contact: '021-9926-1200' },
  { name: 'Jinnah Postgraduate Medical Centre', type: 'Hospital', district: 'Karachi', tehsil: 'Karachi South', lat: 24.8456, lng: 67.0346, services: ['emergency', 'maternal', 'surgery'], openingHours: { daily: '24/7' }, contact: '021-9920-1351' },
  { name: 'Abbasi Shaheed Hospital', type: 'Hospital', district: 'Karachi', tehsil: 'Karachi Central', lat: 24.9296, lng: 67.0310, services: ['trauma', 'pediatrics'], openingHours: { daily: '24/7' }, contact: '021-9926-5680' },
  { name: 'Liaquat University Hospital', type: 'Hospital', district: 'Hyderabad', tehsil: 'Latifabad', lat: 25.3960, lng: 68.3578, services: ['maternal', 'medicine'], openingHours: { daily: '24/7' }, contact: '022-921-3305' },
  { name: 'Civil Hospital Sukkur', type: 'Hospital', district: 'Sukkur', tehsil: 'Sukkur', lat: 27.7139, lng: 68.8356, services: ['emergency', 'pediatrics'], openingHours: { daily: '24/7' }, contact: '071-931-0060' },
  { name: 'THQ Hospital Khairpur', type: 'Hospital', district: 'Khairpur', tehsil: 'Khairpur', lat: 27.5295, lng: 68.7592, services: ['maternal', 'medicine'], openingHours: { daily: '24/7' }, contact: '072-601-1234' },
  { name: 'Rural Health Center Mardan', type: 'RHC', district: 'Mardan', tehsil: 'Takht Bhai', lat: 34.3419, lng: 71.8828, services: ['maternal', 'vaccination'], openingHours: { daily: '08:00-20:00' }, contact: '0937-541234' },
  { name: 'Basic Health Unit Swabi', type: 'BHU', district: 'Swabi', tehsil: 'Lahor', lat: 34.2006, lng: 72.0462, services: ['vaccination', 'family-planning'], openingHours: { daily: '08:00-16:00' }, contact: '0938-220987' },
  { name: 'Basic Health Unit Charsadda', type: 'BHU', district: 'Charsadda', tehsil: 'Shabqadar', lat: 34.1955, lng: 71.7311, services: ['vaccination', 'maternal'], openingHours: { daily: '08:00-16:00' }, contact: '091-660-1234' },
  { name: 'RHC Muzaffarabad', type: 'RHC', district: 'Muzaffarabad', tehsil: 'Muzaffarabad', lat: 34.3700, lng: 73.4700, services: ['maternal', 'vaccination', 'medicine'], openingHours: { daily: '08:00-22:00' }, contact: '05822-920123' },
  { name: 'DHQ Gilgit', type: 'Hospital', district: 'Gilgit', tehsil: 'Gilgit', lat: 35.9179, lng: 74.3080, services: ['maternal', 'emergency'], openingHours: { daily: '24/7' }, contact: '05811-920510' },
  { name: 'BHU Hunza', type: 'BHU', district: 'Hunza', tehsil: 'Aliabad', lat: 36.3188, lng: 74.6527, services: ['vaccination', 'basic-care'], openingHours: { daily: '09:00-15:00' }, contact: '05813-450123' },
  { name: 'THQ Bahawalpur', type: 'Hospital', district: 'Bahawalpur', tehsil: 'Ahmedpur East', lat: 29.1431, lng: 71.2577, services: ['maternal', 'pediatrics'], openingHours: { daily: '24/7' }, contact: '062-287-1234' },
  { name: 'Civil Hospital Multan', type: 'Hospital', district: 'Multan', tehsil: 'Multan City', lat: 30.1978, lng: 71.4697, services: ['emergency', 'surgery'], openingHours: { daily: '24/7' }, contact: '061-450-1234' },
  { name: 'Jhang THQ', type: 'Hospital', district: 'Jhang', tehsil: 'Shorkot', lat: 31.9101, lng: 72.1083, services: ['maternal', 'vaccination'], openingHours: { daily: '24/7' }, contact: '047-920-1122' },
  { name: 'BHU Faisalabad', type: 'BHU', district: 'Faisalabad', tehsil: 'Jaranwala', lat: 31.3342, lng: 73.4197, services: ['vaccination', 'basic-care'], openingHours: { daily: '08:00-16:00' }, contact: '041-920-1100' },
  { name: 'RHC Gujranwala', type: 'RHC', district: 'Gujranwala', tehsil: 'Nowshera Virkan', lat: 31.9637, lng: 73.9724, services: ['maternal', 'pediatrics'], openingHours: { daily: '08:00-20:00' }, contact: '055-920-1234' },
  { name: 'THQ Abbottabad', type: 'Hospital', district: 'Abbottabad', tehsil: 'Havelian', lat: 34.0537, lng: 73.1566, services: ['emergency', 'pediatrics'], openingHours: { daily: '24/7' }, contact: '0992-931234' }
];

const programs = [
  { name: 'Sehat Card Plus', description: 'Catastrophic health coverage for low-income families', eligibilityRules: { minAge: 0, gender: 'any', requiresSehatCard: true } },
  { name: 'Maternal Nutrition Support', description: 'Supplemental nutrition for pregnant women', eligibilityRules: { minAge: 15, gender: 'female', requiresSehatCard: false } },
  { name: 'Childhood Immunization Incentive', description: 'Incentives for completing EPI schedule', eligibilityRules: { minAge: 0, gender: 'any', requiresSehatCard: false } },
  { name: 'Chronic Disease Follow-up', description: 'Tele-follow-up for hypertension and diabetes patients', eligibilityRules: { minAge: 30, gender: 'any', requiresSehatCard: false } },
  { name: 'Adolescent Health Awareness', description: 'Education sessions for adolescents', eligibilityRules: { minAge: 10, gender: 'any', requiresSehatCard: false } }
];

const patients = [
  { fullName: 'Ayesha Khan', age: 28, gender: 'female', pregnancyStatus: '2nd trimester', address: 'Islamabad F-10', lat: 33.7000, lng: 73.0333 },
  { fullName: 'Bilal Ahmed', age: 5, gender: 'male', pregnancyStatus: null, address: 'Rawalpindi Saddar', lat: 33.6000, lng: 73.0400 },
  { fullName: 'Sadia Bibi', age: 32, gender: 'female', pregnancyStatus: 'postpartum', address: 'Peshawar Cantt', lat: 34.0000, lng: 71.5000 },
  { fullName: 'Imran Shah', age: 42, gender: 'male', pregnancyStatus: null, address: 'Karachi Korangi', lat: 24.8500, lng: 67.1500 },
  { fullName: 'Zara Malik', age: 1, gender: 'female', pregnancyStatus: null, address: 'Karachi Nazimabad', lat: 24.9300, lng: 67.0500 },
  { fullName: 'Farah Javed', age: 35, gender: 'female', pregnancyStatus: 'not pregnant', address: 'Quetta Brewery Road', lat: 30.2000, lng: 67.0000 },
  { fullName: 'Hassan Raza', age: 60, gender: 'male', pregnancyStatus: null, address: 'Multan Cantt', lat: 30.2000, lng: 71.4500 },
  { fullName: 'Nadia Saleem', age: 24, gender: 'female', pregnancyStatus: '1st trimester', address: 'Sukkur City', lat: 27.7000, lng: 68.8500 },
  { fullName: 'Kamran Ali', age: 55, gender: 'male', pregnancyStatus: null, address: 'Gilgit City', lat: 35.9200, lng: 74.3200 },
  { fullName: 'Shazia Parveen', age: 48, gender: 'female', pregnancyStatus: 'not pregnant', address: 'Bahawalpur City', lat: 29.4000, lng: 71.6800 },
  { fullName: 'Tariq Hussain', age: 38, gender: 'male', pregnancyStatus: null, address: 'Faisalabad', lat: 31.4200, lng: 73.0800 },
  { fullName: 'Iqra Younis', age: 16, gender: 'female', pregnancyStatus: 'not pregnant', address: 'Hunza', lat: 36.3200, lng: 74.6500 },
  { fullName: 'Rehan Zafar', age: 8, gender: 'male', pregnancyStatus: null, address: 'Swabi', lat: 34.2100, lng: 72.0500 },
  { fullName: 'Bushra Tariq', age: 30, gender: 'female', pregnancyStatus: '3rd trimester', address: 'Muzaffarabad', lat: 34.3700, lng: 73.4700 }
];

const reminderTemplates = [
  { type: 'vaccine', message: 'EPI follow-up dose due', daysFromNow: 7 },
  { type: 'medication', message: 'Blood pressure check-in', daysFromNow: 3 },
  { type: 'followup', message: 'Clinic follow-up visit', daysFromNow: 14 }
];

const interactionTemplates = [
  { agentName: 'triage', inputSummary: 'Fever and rash reported', outputSummary: 'Recommended clinic visit within 24h', triageLevel: 'clinic' },
  { agentName: 'facility-finder', inputSummary: 'Searching facility in Rawalpindi', outputSummary: 'Suggested DHQ Hospital Rawalpindi', triageLevel: 'clinic' },
  { agentName: 'program-eligibility', inputSummary: 'Check Sehat Card eligibility', outputSummary: 'Likely eligible for Sehat Card Plus', triageLevel: 'info' }
];

async function main() {
  console.log('Clearing existing data...');
  await prisma.mcpLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.patientProgramEligibility.deleteMany();
  await prisma.program.deleteMany();
  await prisma.facilityInventory.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding facilities...');
  for (const facility of facilities) {
    await prisma.facility.create({
      data: {
        name: facility.name,
        type: facility.type,
        district: facility.district,
        tehsil: facility.tehsil,
        lat: facility.lat,
        lng: facility.lng,
        services: facility.services,
        openingHours: facility.openingHours,
        contact: facility.contact,
        inventory: {
          create: [
            { itemName: 'Paracetamol', itemType: 'medicine', stockLevel: 'adequate', lastUpdated: new Date() },
            { itemName: 'ORS', itemType: 'medicine', stockLevel: 'low', lastUpdated: new Date() },
            { itemName: 'Rapid malaria tests', itemType: 'diagnostic', stockLevel: 'adequate', lastUpdated: new Date() }
          ],
        },
      },
    });
  }

  console.log('Seeding programs...');
  await prisma.program.createMany({ data: programs });

  console.log('Seeding patients...');
  for (const patient of patients) {
    await prisma.patient.create({
      data: {
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        pregnancyStatus: patient.pregnancyStatus,
        address: patient.address,
        lat: patient.lat,
        lng: patient.lng,
      },
    });
  }

  console.log('Linking program eligibility for first patients...');
  const createdPatients = await prisma.patient.findMany({ take: 5 });
  const createdPrograms = await prisma.program.findMany();
  for (const patient of createdPatients) {
    for (const program of createdPrograms) {
      const eligible = patient.age >= (program.eligibilityRules as any).minAge;
      await prisma.patientProgramEligibility.create({
        data: {
          patientId: patient.id,
          programId: program.id,
          status: eligible ? 'eligible' : 'review',
          details: { evaluatedAt: new Date().toISOString() },
        },
      });
    }
  }

  console.log('Creating reminders...');
  const allPatients = await prisma.patient.findMany();
  for (const patient of allPatients.slice(0, 10)) {
    let index = 0;
    for (const template of reminderTemplates) {
      await prisma.reminder.create({
        data: {
          patientId: patient.id,
          type: template.type,
          message: `${template.message} for ${patient.fullName}`,
          scheduledAt: new Date(Date.now() + template.daysFromNow * 24 * 60 * 60 * 1000 + index * 1000),
          status: 'scheduled',
        },
      });
      index += 1;
    }
  }

  console.log('Logging sample interactions...');
  for (const template of interactionTemplates) {
    await prisma.interaction.create({
      data: {
        agentName: template.agentName,
        inputSummary: template.inputSummary,
        outputSummary: template.outputSummary,
        triageLevel: template.triageLevel,
      },
    });
  }

  console.log('Creating analytics events...');
  await prisma.analyticsEvent.createMany({
    data: [
      { eventType: 'hotspot-alert', payload: { district: 'Rawalpindi', tehsil: 'Gujar Khan', cases: 5, condition: 'fever-with-rash', windowHours: 24 } },
      { eventType: 'usage-summary', payload: { role: 'lhw', interactions: 25 } }
    ],
  });

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
