import { useState, useEffect } from 'react'
import {
  Edit2, Info, Plus, Sprout, Trash2, Wifi, WifiOff, RefreshCw,
  Cpu, Copy, Check, Send, Droplets, Thermometer, CloudRain,
  Waves, Activity, ShieldCheck, Key, ExternalLink, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import Card from '../common/Card'
import { Badge, ConfirmModal, EmptyState, Modal, SectionHeader } from './AdminUi'
import { adminAPI } from '../../services/api'

// =========================================================
// 1. DEDICATED SENSORS FLEET MANAGER (REAL HARDWARE & TELEMETRY)
// =========================================================
function AdminSensorsFleet() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // 'edit' | 'add' | 'code'
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceToDelete, setDeviceToDelete] = useState(null)
  const [testingPingId, setTestingPingId] = useState(null)
  const [copiedToken, setCopiedToken] = useState(null)

  // Form state for Add/Edit
  const [form, setForm] = useState({
    name: '',
    deviceId: '',
    token: '',
    location: '',
    crop: '',
    soilPin: 34,
    rainPin: 35,
    waterPin: 32,
    dhtPin: 4,
    dhtType: 'DHT11',
  })

  const loadDevices = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await adminAPI.getIotDevices()
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setDevices(res.data.data)
      }
    } catch {
      // Keep existing state
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  // Initial fetch and auto-refresh every 3.5 seconds for live telemetry
  useEffect(() => {
    let active = true
    loadDevices()
    const timer = setInterval(() => {
      if (active) loadDevices()
    }, 3500)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(id)
    toast.success('Token copied to clipboard!')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleOpenAdd = () => {
    setForm({
      name: `Farm Node ${devices.length + 1}`,
      deviceId: `ESP32_FARM_${devices.length + 1}`,
      token: 'gv031CJtWA7mauVredG4',
      location: 'North Field Acre 1',
      crop: 'Wheat (گندم)',
      soilPin: 34,
      rainPin: 35,
      waterPin: 32,
      dhtPin: 4,
      dhtType: 'DHT11',
    })
    setActiveModal('add')
  }

  const handleOpenEdit = (dev) => {
    setSelectedDevice(dev)
    setForm({
      id: dev.id,
      name: dev.name || '',
      deviceId: dev.deviceId || '',
      token: dev.token || dev.deviceKey || '',
      location: dev.location || '',
      crop: dev.crop || '',
      soilPin: dev.pins?.soilPin ?? 34,
      rainPin: dev.pins?.rainPin ?? 35,
      waterPin: dev.pins?.waterPin ?? 32,
      dhtPin: dev.pins?.dhtPin ?? 4,
      dhtType: dev.pins?.dhtType || 'DHT11',
    })
    setActiveModal('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (activeModal === 'edit' && selectedDevice) {
        await adminAPI.updateIotDevice(selectedDevice.id, {
          name: form.name,
          deviceId: form.deviceId,
          token: form.token,
          location: form.location,
          crop: form.crop,
          pins: {
            soilPin: Number(form.soilPin),
            rainPin: Number(form.rainPin),
            waterPin: Number(form.waterPin),
            dhtPin: Number(form.dhtPin),
            dhtType: form.dhtType,
          },
        })
        toast.success('Device configuration updated!')
      } else if (activeModal === 'add') {
        await adminAPI.createIotDevice({
          name: form.name,
          deviceId: form.deviceId,
          token: form.token,
          location: form.location,
          crop: form.crop,
          pins: {
            soilPin: Number(form.soilPin),
            rainPin: Number(form.rainPin),
            waterPin: Number(form.waterPin),
            dhtPin: Number(form.dhtPin),
            dhtType: form.dhtType,
          },
        })
        toast.success('New IoT node added to fleet!')
      }
      setActiveModal(null)
      loadDevices()
    } catch (err) {
      toast.error('Failed to save device: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDelete = async () => {
    if (!deviceToDelete) return
    try {
      await adminAPI.deleteIotDevice(deviceToDelete.id)
      toast.success('Device removed from fleet')
      setDeviceToDelete(null)
      loadDevices()
    } catch (err) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const handleSendTestPing = async (dev) => {
    setTestingPingId(dev.id)
    try {
      await adminAPI.testDevicePing(dev.id)
      toast.success(`Heartbeat packet sent to ${dev.name}! Device is now LIVE.`)
      loadDevices()
    } catch (err) {
      toast.error('Failed test packet: ' + err.message)
    } finally {
      setTestingPingId(null)
    }
  }

  const liveCount = devices.filter((d) => d.isHardwareLive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-emerald-600" />
            <span>IoT Sensors Fleet &amp; ESP32 Hardware</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry ingestion, ESP32 device tokens, and multi-sensor field calibration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadDevices(true)}
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Sensor Node
          </Button>
        </div>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Fleet Status
            </span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {liveCount} / {devices.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nodes Live</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {liveCount > 0 ? '🟢 Streaming real sensor telemetry' : '⚪ Waiting for ESP32 WiFi connection'}
          </p>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Primary Token
            </span>
            <Key className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="font-mono text-sm font-bold text-blue-900 dark:text-blue-200 truncate">
              {devices[0]?.token || 'gv031CJtWA7mauVredG4'}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configured on Main Field ESP32
          </p>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Sensors Attached
            </span>
            <Droplets className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">4 Hardware</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Soil (34), Rain (35), Water (32), DHT11 (4)
          </p>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Cloud Ingestion
            </span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white truncate">
              /api/v1/:token/telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ThingsBoard &amp; SmartKisan Compatible
          </p>
        </Card>
      </div>

      {/* Sensor Nodes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading sensors fleet...</div>
        ) : devices.length === 0 ? (
          <Card>
            <EmptyState icon={Cpu} title="No sensor devices registered" />
          </Card>
        ) : (
          devices.map((dev) => {
            const cr = dev.currentReadings || {}
            const pins = dev.pins || { soilPin: 34, rainPin: 35, waterPin: 32, dhtPin: 4, dhtType: 'DHT11' }
            const isLive = Boolean(dev.isHardwareLive)
            const tokenVal = dev.token || dev.deviceKey || 'gv031CJtWA7mauVredG4'

            return (
              <Card key={dev.id} className="overflow-hidden border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 transition-all">
                {/* Node Header */}
                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${isLive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {dev.name}
                        </h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold">
                          {dev.deviceId}
                        </span>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            LIVE ESP32
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20">
                            STANDBY / SIMULATED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Location: <span className="font-medium text-slate-700 dark:text-slate-300">{dev.location}</span> • Crop: <span className="font-medium text-slate-700 dark:text-slate-300">{dev.crop}</span> • Owner: <span className="font-medium text-slate-700 dark:text-slate-300">{dev.ownerName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Node Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedDevice(dev)
                        setActiveModal('code')
                      }}
                      leftIcon={<Cpu className="h-3.5 w-3.5 text-emerald-600" />}
                    >
                      ESP32 Code
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={testingPingId === dev.id}
                      onClick={() => handleSendTestPing(dev)}
                      leftIcon={<Send className={`h-3.5 w-3.5 ${testingPingId === dev.id ? 'animate-spin' : ''}`} />}
                    >
                      {testingPingId === dev.id ? 'Testing...' : 'Test Packet'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dev)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                      title="Edit Node"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceToDelete(dev)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      title="Delete Node"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Token Bar */}
                <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Access Token:</span>
                    <code className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-white/10 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                      {tokenVal}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText(tokenVal, dev.id)}
                      className="p-1 rounded text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Copy Token"
                    >
                      {copiedToken === dev.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    <span>Last Telemetry: {dev.lastPing ? new Date(dev.lastPing).toLocaleTimeString() : 'No ping recorded yet'}</span>
                  </div>
                </div>

                {/* Real Sensors Live Readings Grid */}
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* 1. Soil Moisture Sensor */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-emerald-600" />
                        Soil Moisture
                      </span>
                      <span className="font-mono text-[10px]">Pin {pins.soilPin}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {cr.soilMoisture !== undefined ? `${cr.soilMoisture}%` : '—'}
                      </span>
                      {cr.soilRaw !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500">
                          ADC: {cr.soilRaw}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Capacitive Sensor
                    </div>
                  </div>

                  {/* 2. Air Temperature */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                        Temperature
                      </span>
                      <span className="font-mono text-[10px]">Pin {pins.dhtPin}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {cr.temperature !== undefined ? `${cr.temperature}°C` : '—'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {pins.dhtType || 'DHT11'}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                      Ambient Temp
                    </div>
                  </div>

                  {/* 3. Air Humidity */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold flex items-center gap-1">
                        <CloudRain className="h-3.5 w-3.5 text-sky-500" />
                        Humidity
                      </span>
                      <span className="font-mono text-[10px]">Pin {pins.dhtPin}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {cr.humidity !== undefined ? `${cr.humidity}%` : '—'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        RH%
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                      Relative Humidity
                    </div>
                  </div>

                  {/* 4. Rain Sensor */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold flex items-center gap-1">
                        <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                        Rain Sensor
                      </span>
                      <span className="font-mono text-[10px]">Pin {pins.rainPin}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className={`text-sm font-extrabold ${cr.rainDetected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {cr.rainDetected ? '🌧️ WET / RAIN' : '☀️ DRY'}
                      </span>
                      {cr.rainRaw !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500">
                          ADC: {cr.rainRaw}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                      Rain Detection Board
                    </div>
                  </div>

                  {/* 5. Water Level Sensor */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold flex items-center gap-1">
                        <Waves className="h-3.5 w-3.5 text-cyan-500" />
                        Water Level
                      </span>
                      <span className="font-mono text-[10px]">Pin {pins.waterPin}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {cr.waterLevel !== undefined ? `${cr.waterLevel}%` : '—'}
                      </span>
                      {cr.waterRaw !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500">
                          ADC: {cr.waterRaw}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
                      Tank / Reservoir
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Add / Edit Node Modal */}
      <Modal
        open={activeModal === 'add' || activeModal === 'edit'}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'edit' ? 'Edit IoT Sensor Node' : 'Register New ESP32 Node'}
      >
        <form onSubmit={handleSave} className="space-y-4 px-5 py-5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Node Name
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Abrar's Main Field Node"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Device ID
              </label>
              <input
                required
                type="text"
                value={form.deviceId}
                onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                className="input-field font-mono"
                placeholder="e.g. ESP32_FARM_1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Access Token / Device Secret Key
            </label>
            <input
              required
              type="text"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              className="input-field font-mono"
              placeholder="e.g. gv031CJtWA7mauVredG4"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This token must match the <code className="font-bold">token</code> constant in your ESP32 Arduino sketch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Field Location
              </label>
              <input
                required
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input-field"
                placeholder="e.g. North Field Acre 1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Crop Monitored
              </label>
              <input
                required
                type="text"
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                className="input-field"
                placeholder="e.g. Wheat (گندم)"
              />
            </div>
          </div>

          {/* Sensor Pins Mapping */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Hardware GPIO Pin Mapping
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Soil Pin (ADC)
                </label>
                <input
                  type="number"
                  value={form.soilPin}
                  onChange={(e) => setForm({ ...form, soilPin: e.target.value })}
                  className="input-field font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Rain Pin (ADC)
                </label>
                <input
                  type="number"
                  value={form.rainPin}
                  onChange={(e) => setForm({ ...form, rainPin: e.target.value })}
                  className="input-field font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Water Pin (ADC)
                </label>
                <input
                  type="number"
                  value={form.waterPin}
                  onChange={(e) => setForm({ ...form, waterPin: e.target.value })}
                  className="input-field font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  DHT Pin
                </label>
                <input
                  type="number"
                  value={form.dhtPin}
                  onChange={(e) => setForm({ ...form, dhtPin: e.target.value })}
                  className="input-field font-mono text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit">
              {activeModal === 'edit' ? 'Save Changes' : 'Register Node'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ESP32 Code Viewer & Guide Modal */}
      <Modal
        open={activeModal === 'code' && Boolean(selectedDevice)}
        onClose={() => setActiveModal(null)}
        title={`ESP32 Firmware Code — ${selectedDevice?.name || 'Node'}`}
      >
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold mb-1">✅ Pre-configured for your physical ESP32:</p>
            <p>
              Your token <code className="font-bold underline">{selectedDevice?.token || 'gv031CJtWA7mauVredG4'}</code> and pins (Soil 34, Rain 35, Water 32, DHT11 4) are already set. Simply upload this sketch in Arduino IDE.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Arduino C++ Sketch (Copy &amp; Flash):
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const code = getEsp32Sketch(selectedDevice?.token || 'gv031CJtWA7mauVredG4')
                  navigator.clipboard.writeText(code)
                  toast.success('ESP32 code copied to clipboard!')
                }}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy Code
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {getEsp32Sketch(selectedDevice?.token || 'gv031CJtWA7mauVredG4')}
            </pre>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Ingestion Endpoints Supported by SmartKisan Backend:
            </p>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
              <li>POST https://smartkisan-bbjf.onrender.com/api/v1/{selectedDevice?.token || 'gv031CJtWA7mauVredG4'}/telemetry</li>
              <li>POST https://smartkisan.online/api/v1/{selectedDevice?.token || 'gv031CJtWA7mauVredG4'}/telemetry</li>
              <li>POST /api/iot/telemetry (with token or deviceKey)</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deviceToDelete)}
        title="Delete Sensor Node"
        message={deviceToDelete ? `Are you sure you want to delete ${deviceToDelete.name}? Live telemetry from this node will stop.` : ''}
        confirmLabel="Delete"
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function getEsp32Sketch(token) {
  return `#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>

// ==========================================
// SMARTKISAN IOT SENSOR NODE FIRMWARE
// ==========================================

// ------------ SENSOR PINS ------------
#define SOIL_PIN 34   // Capacitive Soil Moisture Sensor (Analog ADC1)
#define RAIN_PIN 35   // Rain Drop Board (Analog ADC1)
#define WATER_PIN 32  // Water Level Float / Depth Sensor (Analog ADC1)

#define DHT_PIN 4     // DHT11 Data Pin
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// ------------ WIFI CREDENTIALS ------------
const char* ssid     = "Junejo";
const char* password = "12340987";

// ------------ SMARTKISAN ACCESS TOKEN ------------
const char* token = "${token}";

// SmartKisan Cloud Telemetry Endpoint
const char* serverURL = "https://smartkisan-bbjf.onrender.com/api/v1/";
// Or when running on domain: "https://smartkisan.online/api/v1/";

// ------------ TIMING ------------
const unsigned long interval = 2000; // Telemetry upload every 2s
unsigned long lastSend = 0;

// ------------ CALIBRATION ------------
const int SOIL_DRY_RAW   = 3500;
const int SOIL_WET_RAW   = 1500;
const int RAIN_THRESHOLD = 2500;
const int WATER_EMPTY_RAW = 500;
const int WATER_FULL_RAW  = 3000;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(SOIL_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(WATER_PIN, INPUT);

  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to Wi-Fi...");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("Wi-Fi not connected; will retry in loop.");
  }

  lastSend = millis() - interval;
}

void sendTelemetry() {
  // Soil moisture
  int soilRaw = analogRead(SOIL_PIN);
  int soilMoisture = map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);

  // Rain sensor
  int rainRaw = analogRead(RAIN_PIN);
  bool rainDetected = rainRaw < RAIN_THRESHOLD;

  // Water level sensor
  int waterRaw = analogRead(WATER_PIN);
  int waterLevel = map(waterRaw, WATER_EMPTY_RAW, WATER_FULL_RAW, 0, 100);
  waterLevel = constrain(waterLevel, 0, 100);

  // DHT11
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();

  // Build JSON Payload
  String payload = "{";
  payload += "\\"soilRaw\\":" + String(soilRaw);
  payload += ",\\"soilMoisture\\":" + String(soilMoisture);
  payload += ",\\"rainRaw\\":" + String(rainRaw);
  payload += ",\\"rainDetected\\":";
  payload += rainDetected ? "true" : "false";
  payload += ",\\"waterRaw\\":" + String(waterRaw);
  payload += ",\\"waterLevel\\":" + String(waterLevel);
  if (!isnan(temperature)) {
    payload += ",\\"temperature\\":" + String(temperature, 1);
  }
  if (!isnan(humidity)) {
    payload += ",\\"humidity\\":" + String(humidity, 1);
  }
  payload += "}";

  Serial.println("\\n----- SMARTKISAN SENSOR TELEMETRY -----");
  Serial.printf("Soil: %d%% (Raw: %d) | Temp: %.1f C | Hum: %.1f%%\\n", soilMoisture, soilRaw, temperature, humidity);
  Serial.printf("Rain: %s (Raw: %d) | Water: %d%% (Raw: %d)\\n", rainDetected ? "WET" : "DRY", rainRaw, waterLevel, waterRaw);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected; skipping upload.");
    return;
  }

  String url = String(serverURL) + token + "/telemetry";
  WiFiClientSecure client;
  client.setInsecure(); // Disable TLS cert verification for embedded device

  HTTPClient http;
  http.setConnectTimeout(5000);
  http.setTimeout(5000);

  if (!http.begin(client, url)) {
    Serial.println("HTTPS connection setup failed.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  int responseCode = http.POST(payload);

  Serial.printf("SmartKisan Server HTTP Response: %d\\n", responseCode);
  if (responseCode >= 200 && responseCode < 300) {
    Serial.println(">>> Sensor readings successfully streamed to Cloud! <<<");
  } else {
    Serial.println("Upload failed. Code: " + String(responseCode));
    if (responseCode > 0) Serial.println(http.getString());
  }
  http.end();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(100);
    return;
  }

  if (millis() - lastSend >= interval) {
    lastSend = millis();
    sendTelemetry();
  }

  delay(10);
}`
}

// =========================================================
// 2. CROPS DATABASE (CROP GUIDE)
// =========================================================
const CROPS = [
  { id: 1, name: 'Rice', season: 'Kharif', duration: '120 days', waterReq: 'High' },
  { id: 2, name: 'Wheat', season: 'Rabi', duration: '100 days', waterReq: 'Medium' },
  { id: 3, name: 'Maize', season: 'Kharif', duration: '90 days', waterReq: 'Medium' },
]

function CropsList() {
  const [items, setItems] = useState(CROPS)
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const save = (e) => {
    e.preventDefault()
    if (form.id) setItems((p) => p.map((i) => (i.id === form.id ? form : i)))
    else setItems((p) => [...p, { ...form, id: Math.max(0, ...p.map((i) => i.id)) + 1 }])
    toast.success(form.id ? 'Changes saved' : 'Crop added')
    setForm(null)
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Crop Database"
        subtitle="Crops shown to farmers in the Crop Guide."
        actions={
          <Button size="sm" onClick={() => setForm({})} leftIcon={<Plus className="h-4 w-4" />}>
            Add crop
          </Button>
        }
      />
      <Card noPadding className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState icon={Sprout} title="No crops yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Crop</th>
                  <th className="px-5 py-3">Season</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Water Need</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                    <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-900 dark:text-white">{i.name}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-200">{i.season}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-200">{i.duration}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-200">{i.waterReq}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button onClick={() => setForm(i)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label={`Edit ${i.name}`}>
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setToDelete(i)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" aria-label={`Delete ${i.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={`${form?.id ? 'Edit' : 'Add'} Crop`}>
        {form && (
          <form onSubmit={save} className="space-y-4 px-5 py-5 text-sm">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">Crop name</label>
              <input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">Season</label>
              <select required value={form.season || ''} onChange={(e) => setForm({ ...form, season: e.target.value })} className="input-field">
                <option value="">Select...</option>
                <option>Kharif</option>
                <option>Rabi</option>
                <option>Zaid</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">Duration</label>
              <input required value={form.duration || ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" placeholder="e.g. 100 days" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">Water need</label>
              <input required value={form.waterReq || ''} onChange={(e) => setForm({ ...form, waterReq: e.target.value })} className="input-field" placeholder="e.g. Medium" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit">{form.id ? 'Save changes' : 'Add crop'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete Crop"
        message={toDelete ? `Delete ${toDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          setItems((p) => p.filter((i) => i.id !== toDelete.id))
          toast.success('Deleted')
          setToDelete(null)
        }}
      />
    </div>
  )
}

// =========================================================
// 3. SYSTEM SETTINGS
// =========================================================
function SettingRow({ label, text, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      {children}
    </div>
  )
}

function SettingToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-slate-200 dark:bg-white/10'}`}
    >
      <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SettingsPanel() {
  const [s, setS] = useState({ email: true, backup: false, retention: '90 days' })
  return (
    <div className="space-y-5">
      <SectionHeader title="System Settings" subtitle="Platform-wide preferences." />
      <Card className="divide-y divide-slate-100 !py-2 dark:divide-white/10">
        <SettingRow label="Email notifications" text="Receive email alerts for system events">
          <SettingToggle checked={s.email} onChange={() => setS({ ...s, email: !s.email })} label="Email notifications" />
        </SettingRow>
        <SettingRow label="Automatic backup" text="Back up database every day">
          <SettingToggle checked={s.backup} onChange={() => setS({ ...s, backup: !s.backup })} label="Automatic backup" />
        </SettingRow>
        <SettingRow label="Data retention" text="Keep historical telemetry for">
          <select value={s.retention} onChange={(e) => setS({ ...s, retention: e.target.value })} aria-label="Data retention" className="input-field !w-auto">
            <option>30 days</option>
            <option>90 days</option>
            <option>1 year</option>
          </select>
        </SettingRow>
      </Card>
    </div>
  )
}

// =========================================================
// MAIN SYSTEM DISPATCHER
// =========================================================
export default function AdminSystem({ section }) {
  if (section === 'settings') return <SettingsPanel />
  if (section === 'sensors') return <AdminSensorsFleet />
  return <CropsList />
}
