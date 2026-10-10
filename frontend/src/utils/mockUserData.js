const fieldNames = [
  'North Field',
  'South Field',
  'East Field',
  'West Field',
  'Riverside Plot',
  'Hilltop Plot',
]

const cropPool = [
  'Rice',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Soybean',
  'Mustard',
  'Barley',
]

const soilTypes = [
  'Clay Loam',
  'Sandy Loam',
  'Alluvial',
  'Loamy',
  'Black Cotton Soil',
]

const sensorTypes = [
  'Soil Moisture',
  'Weather Station',
  'Irrigation Controller',
  'Temperature',
  'pH Sensor',
]

const activityTypes = [
  'Logged in to dashboard',
  'Updated field boundaries',
  'Requested irrigation advice',
  'Viewed soil test results',
  'Enrolled in a workshop',
  'Posted in Farmer Network',
  'Updated crop status',
  'Reviewed weather forecast',
]

// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed

  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0

    let t = Math.imul(a ^ (a >>> 15), 1 | a)

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Generate farm data for a specific user
// ---------------------------------------------------------------------------

export function generateUserFarmData(userId) {
  const seed = Number(userId) || 1
  const rand = mulberry32(seed * 9973)

  // -------------------------------------------------------------------------
  // Fields
  // -------------------------------------------------------------------------

  const fieldCount = 1 + Math.floor(rand() * 3)

  const fields = Array.from({ length: fieldCount }).map((_, idx) => {
    const size = +(1 + rand() * 8).toFixed(1)

    return {
      id: `${userId}-field-${idx + 1}`,
      name: fieldNames[(seed + idx) % fieldNames.length],
      size,
      unit: 'acres',
      crop: cropPool[(seed + idx * 2) % cropPool.length],
      soilType: soilTypes[(seed + idx) % soilTypes.length],
      soilHealth: Math.round(50 + rand() * 45),
      moisture: Math.round(30 + rand() * 60),
      status: rand() > 0.25 ? 'active' : 'fallow',
    }
  })

  // -------------------------------------------------------------------------
  // Sensors
  // -------------------------------------------------------------------------

  const sensorCount = 2 + Math.floor(rand() * 3)

  const sensors = Array.from({ length: sensorCount }).map((_, idx) => ({
    id: `${userId}-sensor-${idx + 1}`,
    name: `${sensorTypes[(seed + idx) % sensorTypes.length]} ${idx + 1}`,
    type: sensorTypes[(seed + idx) % sensorTypes.length],
    location: fields[idx % fields.length]?.name || 'Main Field',
    status: rand() > 0.15 ? 'active' : 'maintenance',
    battery: `${Math.round(50 + rand() * 50)}%`,
    lastReading:
      `2026-07-2${1 + (idx % 8)}` +
      ` 0${8 + (idx % 4)}:30`,
  }))

  // -------------------------------------------------------------------------
  // Crops
  // -------------------------------------------------------------------------

  const cropCount = 2 + Math.floor(rand() * 3)

  const crops = Array.from({ length: cropCount }).map((_, idx) => ({
    id: `${userId}-crop-${idx + 1}`,
    name: cropPool[(seed + idx * 3) % cropPool.length],
    season: ['Kharif', 'Rabi', 'Zaid'][(seed + idx) % 3],
    plantedOn: `2026-0${1 + (idx % 6)}-1${idx % 9}`,
    expectedYield: `${(1.5 + rand() * 2).toFixed(1)} tons/acre`,
    status: ['Growing', 'Harvested', 'Planned'][(seed + idx) % 3],
  }))

  // -------------------------------------------------------------------------
  // Recent Activities
  // -------------------------------------------------------------------------

  const activityCount = 4 + Math.floor(rand() * 4)

  const activities = Array.from({ length: activityCount })
    .map((_, idx) => ({
      id: `${userId}-activity-${idx + 1}`,
      description:
        activityTypes[(seed + idx * 5) % activityTypes.length],
      timestamp:
        `2026-07-${String(27 - idx).padStart(2, '0')} ` +
        `${String(9 + (idx % 10)).padStart(2, '0')}:` +
        `${String((idx * 13) % 60).padStart(2, '0')}`,
    }))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  // -------------------------------------------------------------------------
  // Return complete farm dataset
  // -------------------------------------------------------------------------

  return {
    fields,
    sensors,
    crops,
    activities,
  }
}