export interface AlertItem {
  id: string;
  title: string;
  subtitle: string;
  matchPercentage?: number;
  threatLevel: 'HIGH' | 'MODERATE' | 'LOW';
  fileNo: string;
  lastSeenLocation: string;
  lastSeenTime: string;
  mugshotUrl: string;
  cameraName?: string;
  confidence?: string;
  latitude: number;
  longitude: number;
  status: 'ALERT' | 'INVESTIGATING' | 'LOCATED' | 'FALSE ALERT' | 'COMPLETED';
  vehicleDetails?: {
    model: string;
    colors: string;
    plateNumber: string;
    authenticated: boolean;
  };
  telemetry?: {
    azimuth: string;
    zoom: string;
    lens: string;
    signal: string;
  };
}

export interface CaseItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  missingSince: string;
  lastSeen: string;
  photoUrl: string;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface MessageItem {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isRadioChannel?: boolean;
}

export interface OfficerProfile {
  unitId: string;
  encryptionKey: string;
  name: string;
  rank: string;
  shift: string;
  status: string;
  commsLink: string;
}

// Initial Mock Data matching the Stitch screens
export const INITIAL_OFFICER: OfficerProfile = {
  unitId: 'ALPHA-9-042',
  encryptionKey: 'AES-256',
  name: 'Karan Malhotra',
  rank: 'Tactical Inspector',
  shift: 'Night Duty (18:00 - 06:00)',
  status: 'ACTIVE DUTY',
  commsLink: 'MUN-HQ-SRV-04',
};

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'vikram-singh',
    title: 'Vikram Singh',
    subtitle: 'Critical Match Detected',
    matchPercentage: 94,
    threatLevel: 'HIGH',
    fileNo: '#23854-OPS',
    lastSeenLocation: 'Marine Drive, Zone 1',
    lastSeenTime: '02:14 ago',
    mugshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0uinW8y67YEK48-TdEQY-AJG8_ueBS_ohoH74aQpBE-NnZUMuuO3XSn-b-M18y7prXJq2iAbpLw1bkW2T_P-YboddcbqRBzmK3U5K9WbHkNn650YAf_dDkFhILF_Q1KmFljN0YdOrR6B98KpIAp8QJ8nUgIu-LXiF2v0fTDyu7Au_9T8wZFr_sZbATd3kx0YJoEdCbykGKA05bBbdWWkPzddOXow2DDEC-I4_M0L9-37JYIMmLtHvjUChA',
    cameraName: 'CAM-224-B',
    confidence: '91.4%',
    latitude: 18.9431,
    longitude: 72.8246,
    status: 'ALERT',
    telemetry: {
      azimuth: '244.18°',
      zoom: '4.5X',
      lens: '85MM',
      signal: '100%',
    },
  },
  {
    id: 'govt-vehicle',
    title: 'Govt Vehicle Entry',
    subtitle: 'Vehicle Warning',
    threatLevel: 'LOW',
    fileNo: '#VEH-9042',
    lastSeenLocation: 'Gateway Checkpoint',
    lastSeenTime: '02:14m ago',
    mugshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0ugr5Kt8aui4Phy-SEZgLlFAlAZvBNIyb3-k8IlJtdKFqD3dReUWPjjbCpMWIrjJKD9u5U-FGeeptPvjj344wvC7D7mgQyx37b0ZLLtRZP5EX-D54lcognDD2SFKGJw0YEiRGP-DCCdkHvfgGcTUPDarZynuMq33cj1fEj9e8sXxVIYS_Pv0Glq4ze764TbYmEz9pUAWmVHqjG2tEh7nMVFq7WAjLdU43dKZXl8RS-fg77naueC4XlrCzhI',
    latitude: 18.9220,
    longitude: 72.8347,
    status: 'ALERT',
    vehicleDetails: {
      model: 'Mahindra Scorpio',
      colors: 'White/Black',
      plateNumber: 'MH-01-CP-9042',
      authenticated: true,
    },
  },
  {
    id: 'signal-spike',
    title: 'Unidentified Signal Spike',
    subtitle: 'Radio Channel 4',
    threatLevel: 'MODERATE',
    fileNo: '#SIG-4820',
    lastSeenLocation: 'Colaba Waterfront',
    lastSeenTime: '05:40 ago',
    mugshotUrl: '',
    latitude: 18.9067,
    longitude: 72.8145,
    status: 'ALERT',
  },
];

export const INITIAL_CASES: CaseItem[] = [
  {
    id: 'case-01',
    name: 'Aarav Mehta',
    age: 12,
    gender: 'MALE',
    missingSince: 'May 20, 2026',
    lastSeen: 'Victoria Terminus (CST)',
    photoUrl: 'https://lh3.googleusercontent.com/aida/ADBb0uizPUY6M_NlroyBqrX5XTPrN0cAjgzKywTPXwHQWwQ4zA06Po3-JnMNNdtOhOLMxSytUYg5li2uaxpYU5_NcwI4j50Fc_a_Knk4u9pQJfI_Nw3qg_hFLFpJ17aPM7YTx4fepcZP_0MqSsGWTIFlhK9po3Q-346m9vSIp_ykkX1HIQUXjLcBYlCnrevXWqEUOf5-bmLT45mAvS5-fMTWEjWIWwW5O2fW3CC71vV_fsIA0VH6rIzZDxlvPg',
    status: 'ACTIVE',
  },
  {
    id: 'case-02',
    name: 'Priya Sharma',
    age: 28,
    gender: 'FEMALE',
    missingSince: 'May 18, 2026',
    lastSeen: 'Bandra Promenade',
    photoUrl: 'https://lh3.googleusercontent.com/aida/AB6AXuDv915T66OGD0yrX_nnf23c0n2XAnsWog4Lf6Ayi_mv3DRNxdvmRobdUBvVo1DKNUOxNHnXTwXU_4SJKokTsTjIyE27TF5ApxXTGLEiOfDgo3dsucHBj0nsqLokj1rCB72rvgEIOH2VEKvLoTFcyf8oawETOECywnanIHZfgwEqLlcaZhaKN3xX1dFaY-gRXYrN3c1h--MTfmFwvwGDr0ve92ZCsdgQR9rQK1OT1wE1d1SwvRqKZDDEBzsF0J2N-iHfHh9OJ504FvY',
    status: 'ACTIVE',
  },
];

export const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 'msg-01',
    sender: 'DISPATCH HQ',
    text: 'Patrol unit 042, please verify outstanding warrant report in Sector 4 (Marine Drive). Match confidence is over 90%.',
    timestamp: '18:02',
  },
  {
    id: 'msg-02',
    sender: 'PATROL UNIT-042',
    text: 'Copy that HQ. Moving towards Sector 4. Encryption link stable.',
    timestamp: '18:05',
  },
  {
    id: 'msg-03',
    sender: 'RADIO CHANNEL 4',
    text: '[TELEM] Broadcast freq spike detected. Signal amplitude +14dB at bearing 182°.',
    timestamp: '18:12',
    isRadioChannel: true,
  },
];
