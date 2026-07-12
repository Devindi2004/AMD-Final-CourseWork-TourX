export interface EmergencyNumber {
  name: string;
  number: string;
  description: string;
  icon: 'shield-checkmark' | 'medkit' | 'flame' | 'earth' | 'people';
}

// Sri Lanka national emergency hotlines — all free/toll-free, dialable from any phone.
export const SRI_LANKA_EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { name: 'Police Emergency', number: '119', description: 'Police, crime, general emergencies', icon: 'shield-checkmark' },
  { name: 'Suwa Seriya Ambulance', number: '1990', description: 'Free national ambulance service', icon: 'medkit' },
  { name: 'Fire & Rescue', number: '110', description: 'Fire brigade and rescue services', icon: 'flame' },
  { name: 'Tourist Police', number: '1912', description: 'English-speaking assistance for visitors', icon: 'earth' },
  { name: 'Disaster Management Centre', number: '117', description: 'Floods, landslides & natural disasters', icon: 'earth' },
  { name: 'Women & Children Helpline', number: '1938', description: 'Abuse, harassment & child safety', icon: 'people' },
];
