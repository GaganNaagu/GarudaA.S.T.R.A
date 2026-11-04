export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('astra_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

const MOCK_DATA: Record<string, any> = {
  '/alerts/stats': {
    total_detection_events: 1842,
    found_persons: 12,
    total_alerts: 29,
    total_missing_persons: 19
  },
  '/alerts': [
    {
      id: 'alt-001',
      case_number: 'MP-2026-0891',
      missing_person_id: 'mp-001',
      camera_id: 'CAM-BLR-METRO-04',
      location: 'Majestic Inter-Terminal Footover Bridge',
      confidence: 0.94,
      status: 'DISPATCHED',
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: 'alt-002',
      case_number: 'MP-2026-0884',
      missing_person_id: 'mp-002',
      camera_id: 'CAM-BLR-MALL-09',
      location: 'Phoenix Marketcity - North Concourse',
      confidence: 0.89,
      status: 'PENDING',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'alt-003',
      case_number: 'MP-2026-0872',
      missing_person_id: 'mp-003',
      camera_id: 'CAM-BLR-AIRPORT-02',
      location: 'Kempegowda Int. Airport - Terminal 2 Arrival Gate',
      confidence: 0.96,
      status: 'RESOLVED',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    }
  ],
  '/missing-persons/': [
    {
      id: 'mp-001',
      case_number: 'MP-2026-0891',
      full_name: 'Aarav Sharma',
      age: 14,
      gender: 'Male',
      description: 'Wearing navy blue school jacket and black backpack with reflective strips.',
      last_seen_location: 'Majestic Metro Station, Platform 3',
      created_at: '2026-10-15T09:30:00Z',
      status: 'Active',
      priority: 'Critical',
      photo_path: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'mp-002',
      case_number: 'MP-2026-0884',
      full_name: 'Sunita Devi',
      age: 68,
      gender: 'Female',
      description: 'Senior citizen diagnosed with mild dementia; wearing crimson maroon saree.',
      last_seen_location: 'Whitefield Main Market, near Post Office',
      created_at: '2026-10-14T15:20:00Z',
      status: 'Active',
      priority: 'High',
      photo_path: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'mp-003',
      case_number: 'MP-2026-0872',
      full_name: 'Rohan Deshmukh',
      age: 22,
      gender: 'Male',
      description: 'College student, wearing grey zipped hoodie and blue denim.',
      last_seen_location: 'KIA Airport Transit Lounge, Gate 14',
      created_at: '2026-10-12T11:00:00Z',
      status: 'Found',
      priority: 'Normal',
      photo_path: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    }
  ],
  '/uploads/': [
    {
      id: 'up-001',
      filename: 'CCTV_FEED_MAJESTIC_NORTH_OCT16.mp4',
      camera_id: 'CAM-BLR-04A',
      sector: 'Sector 4 - Majestic Transport Hub',
      priority: 'CRITICAL',
      status: 'PROCESSED',
      frames_analyzed: 14200,
      faces_detected: 384,
      matches_found: 2,
      created_at: '2026-10-16T18:15:00Z'
    },
    {
      id: 'up-002',
      filename: 'WHITEFIELD_JUNCTION_FEED_H264.mp4',
      camera_id: 'CAM-BLR-09B',
      sector: 'Sector 9 - Whitefield Junction',
      priority: 'HIGH',
      status: 'ANALYZING',
      frames_analyzed: 8940,
      faces_detected: 215,
      matches_found: 1,
      created_at: '2026-10-16T19:00:00Z'
    }
  ],
  '/admin/users': [
    {
      id: '1',
      full_name: 'System Admin',
      email: 'admin@astra.gov',
      role: 'Admin',
      is_active: true,
      badge_number: 'ASTRA-HQ-01'
    },
    {
      id: '2',
      full_name: 'Central Dispatcher',
      email: 'dispatcher@astra.gov',
      role: 'Dispatcher',
      is_active: true,
      badge_number: 'ASTRA-DISP-04'
    },
    {
      id: '3',
      full_name: 'Inspector Vikram Rathore',
      email: 'officer1@astra.gov',
      role: 'Officer',
      is_active: true,
      badge_number: 'KA-POL-4402'
    }
  ],
  '/settings/': {
    system_name: 'GARUDA A.S.T.R.A Tactical Core',
    ai_confidence_threshold: 0.85,
    realtime_alert_notifications: true,
    encryption_level: 'AES-256-GCM',
    drone_stream_enabled: true
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    })
    
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('astra_token')
      window.location.href = '/login'
      throw new Error('Unauthorized - Redirecting to login')
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  } catch (err: any) {
    // Graceful fallback to mock tactical dataset for offline / dev preview
    const cleanEndpoint = endpoint.split('?')[0]
    if (MOCK_DATA[cleanEndpoint]) {
      return MOCK_DATA[cleanEndpoint]
    }
    if (cleanEndpoint.startsWith('/alerts')) {
      return MOCK_DATA['/alerts']
    }
    throw err
  }
}

export async function getAlerts() {
  return fetchApi(`/alerts/?t=${Date.now()}`, { cache: 'no-store' })
}

export async function updateAlertStatus(id: string, status: string) {
  return fetchApi(`/alerts/${id}/status`, { 
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
}

export async function getMissingPersons() {
  return fetchApi('/missing-persons/')
}

export async function createMissingPerson(data: any) {
  return fetchApi('/missing-persons/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function uploadMissingPersonImage(id: string, file: File) {
  const formData = new FormData()
  formData.append('image', file)
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('astra_token') : null
  const response = await fetch(`${API_URL}/missing-persons/${id}/image`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  })
  
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('astra_token')
    window.location.href = '/login'
    throw new Error('Unauthorized - Redirecting to login')
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

export async function getStats() {
  return fetchApi('/alerts/stats')
}

export async function getUsers() {
  return fetchApi('/admin/users')
}

export async function getSettings() {
  return fetchApi('/settings/')
}

export async function updateSettings(data: any) {
  return fetchApi('/settings/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function uploadFootage(file: File, cameraId: string, sector: string, priority: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (cameraId) formData.append('camera_id', cameraId)
  if (sector) formData.append('sector', sector)
  if (priority) formData.append('priority', priority)
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('astra_token') : null
  const response = await fetch(`${API_URL}/uploads/`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  })
  
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('astra_token')
    window.location.href = '/login'
    throw new Error('Unauthorized - Redirecting to login')
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

export async function getUploads() {
  return fetchApi('/uploads/')
}

export function uploadFootageWithProgress(
  file: File, 
  cameraId: string, 
  sector: string, 
  priority: string,
  onProgress: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    if (cameraId) formData.append('camera_id', cameraId)
    if (sector) formData.append('sector', sector)
    if (priority) formData.append('priority', priority)
    
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/uploads/`)
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('astra_token') : null
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress(percentComplete)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('astra_token')
        window.location.href = '/login'
        reject(new Error('Unauthorized - Redirecting to login'))
        return
      }
      
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`API error: ${xhr.status} ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error occurred during upload'))
    }

    xhr.send(formData)
  })
}

export async function analyzeVideo(id: string) {
  return fetchApi(`/uploads/${id}/analyze`, { method: 'POST' })
}

export async function batchAnalyzeVideos() {
  return fetchApi('/uploads/batch-analyze', { method: 'POST' })
}

export async function searchPerson(id: string) {
  return fetchApi(`/search/person/${id}`, { method: 'POST' })
}

export async function massSearch() {
  return fetchApi('/search/mass', { method: 'POST' })
}
