import { useState } from 'react'
import {
  Cpu, Copy, Check, X, RefreshCw, Send, Radio, Shield, Key, Wifi, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import { iotAPI } from '../../services/api'

export default function Esp32ConnectModal({ isOpen, onClose, deviceInfo, isHardwareLive, onRefresh }) {
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [resettingKey, setResettingKey] = useState(false)
  const [activeTab, setActiveTab] = useState('credentials') // 'credentials' | 'code' | 'wiring'

  if (!isOpen) return null

  const backendUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api/iot/telemetry'
    : 'https://smartkisan-bbjf.onrender.com/api/iot/telemetry'

  const deviceId = deviceInfo?.deviceId || 'ESP32_FARM_1'
  const deviceKey = deviceInfo?.deviceKey || deviceInfo?.token || 'gv031CJtWA7mauVredG4'

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'key') setCopiedKey(true)
    if (type === 'id') setCopiedId(true)
    if (type === 'url') setCopiedUrl(true)
    if (type === 'code') setCopiedCode(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => {
      setCopiedKey(false)
      setCopiedId(false)
      setCopiedUrl(false)
      setCopiedCode(false)
    }, 2000)
  }

  const handleSendTestPacket = async () => {
    setSendingTest(true)
    try {
      const testPayload = {
        deviceId: deviceId,
        deviceKey: deviceKey,
        soilMoisture: +(42 + Math.random() * 8).toFixed(1),
        temperature: +(26 + Math.random() * 4).toFixed(1),
        humidity: +(60 + Math.random() * 10).toFixed(1),
        lightIntensity: Math.round(45000 + Math.random() * 5000),
        rainfall: 0,
        waterLevel: 85,
        pressure: 1013.2,
      }
      await iotAPI.sendTelemetry(testPayload)
      toast.success('Test telemetry packet sent! Hardware mode is now LIVE.')
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error('Failed to send test packet: ' + (err.response?.data?.message || err.message))
    } finally {
      setSendingTest(false)
    }
  }

  const handleResetKey = async () => {
    if (!window.confirm('Regenerate secret device key? You will need to update this key in your ESP32 code.')) return
    setResettingKey(true)
    try {
      await iotAPI.resetDeviceKey(deviceId)
      toast.success('New secret device key generated!')
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error('Failed to regenerate key: ' + err.message)
    } finally {
      setResettingKey(false)
    }
  }

  const esp32CodeSnippet = `/*
 * SmartKisan ESP32 IoT Node Firmware
 * Multi-Tenant Isolated Hardware Ingestion
 * 
 * Target Board: ESP32 Dev Module
 * Node ID: ${deviceId}
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// 1. Enter Your Local WiFi Credentials
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// 2. SmartKisan Cloud Ingestion Endpoint & Private Key
const char* serverUrl = "${backendUrl}";
const char* deviceId  = "${deviceId}";
const char* deviceKey = "${deviceKey}";

// 3. Sensor Pin Mapping (Hardware Setup)
#define SOIL_PIN     34 // ADC1 Analog: Capacitive Soil Moisture Sensor
#define RAIN_PIN     35 // ADC1 Analog: Rain Detection Board
#define WATER_PIN    32 // ADC1 Analog: Water Level Sensor
#define DHT_PIN      4  // Digital IO: DHT11 Sensor
#define DHT_TYPE     DHT11

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n[SmartKisan] Booting Farm IoT Sensor Node...");

  analogReadResolution(12);
  pinMode(SOIL_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(WATER_PIN, INPUT);
  dht.begin();

  // Connect to Farm WiFi
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n[WiFi] Connected successfully! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read raw ADC values (0 - 4095)
    int rawSoil  = analogRead(SOIL_PIN);
    int rawLight = analogRead(LDR_PIN);
    int rawRain  = analogRead(RAIN_PIN);
    int rawWater = analogRead(WATER_PIN);

    // Calibrate raw readings into percentage & standard agronomic units
    float soilMoisture   = constrain(map(rawSoil, 3200, 1200, 0, 100), 0, 100);
    float temperature    = 27.5 + (random(-10, 10) / 10.0); // Or DHT22.readTemperature()
    float humidity       = 62.0 + (random(-15, 15) / 10.0); // Or DHT22.readHumidity()
    float lightIntensity = map(rawLight, 0, 4095, 0, 85000);
    float rainfall       = map(rawRain, 4095, 0, 0, 100);
    float waterLevel     = map(rawWater, 0, 4095, 0, 100);
    float pressure       = 1013.25;

    // Build JSON Payload
    String json = "{\\"deviceId\\":\\"" + String(deviceId) + "\\","
                + "\\"deviceKey\\":\\"" + String(deviceKey) + "\\","
                + "\\"soilMoisture\\":" + String(soilMoisture, 1) + ","
                + "\\"temperature\\":" + String(temperature, 1) + ","
                + "\\"humidity\\":" + String(humidity, 1) + ","
                + "\\"lightIntensity\\":" + String((int)lightIntensity) + ","
                + "\\"rainfall\\":" + String(rainfall, 1) + ","
                + "\\"waterLevel\\":" + String(waterLevel, 1) + ","
                + "\\"pressure\\":" + String(pressure, 1) + "}";

    Serial.println("[Telemetry] Sending: " + json);

    WiFiClientSecure client;
    client.setInsecure(); // Secure SSL bypass for IoT client

    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", deviceKey);

    int httpResponseCode = http.POST(json);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("[HTTP] Status: %d | Response: %s\\n", httpResponseCode, response.c_str());
    } else {
      Serial.printf("[HTTP Error] Failed to POST: %s\\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[WiFi] Reconnecting...");
    WiFi.reconnect();
  }

  // Telemetry Interval (e.g. Every 5 seconds)
  delay(5000);
}
`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 dark:bg-night-raised dark:ring-white/10 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Connect ESP32 Sensor Hardware
                {isHardwareLive ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-400">
                    STANDBY
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup your physical micro-controller to stream real-time field telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Isolation Banner */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 px-5 py-3 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <Shield className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Isolated Multi-Tenant Security:</strong> Your sensor telemetry is private. Only you can view your field data. Other farmers or admin accounts have no access to your stream.
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-5 pt-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Key size={16} />
            Device Credentials
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Cpu size={16} />
            Arduino C++ Code
          </button>
          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'wiring'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Radio size={16} />
            GPIO Pinout Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isHardwareLive 
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${isHardwareLive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isHardwareLive ? 'Hardware Active: Receiving Real Telemetry' : 'Waiting for ESP32 Packets'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isHardwareLive 
                        ? `Last packet received: ${new Date(deviceInfo?.lastHardwarePing || Date.now()).toLocaleTimeString()}`
                        : 'No hardware packet in the last 30s. Showing realistic baseline data.'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  loading={sendingTest}
                  onClick={handleSendTestPacket}
                  className="shrink-0"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send Test Packet
                </Button>
              </div>

              {/* 1. Ingestion Endpoint */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  HTTP POST Telemetry Ingestion URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={backendUrl}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(backendUrl, 'url')}
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>

              {/* 2. Device ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assigned Device ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={deviceId}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(deviceId, 'id')}
                  >
                    {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>

              {/* 3. Secret Device Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Private Device Secret Key (Keep Confidential)
                  </label>
                  <button
                    onClick={handleResetKey}
                    disabled={resettingKey}
                    className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} className={resettingKey ? 'animate-spin' : ''} />
                    Regenerate Key
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={deviceKey}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(deviceKey, 'key')}
                  >
                    {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-configured with your Device ID & Key. Copy & paste into Arduino IDE.
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => copyToClipboard(esp32CodeSnippet, 'code')}
                >
                  {copiedCode ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                  {copiedCode ? 'Code Copied!' : 'Copy ESP32 Sketch'}
                </Button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                <code>{esp32CodeSnippet}</code>
              </pre>
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="p-3">Sensor / Module</th>
                      <th className="p-3">ESP32 Pin</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">Capacitive Soil Moisture</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">GPIO 34</td>
                      <td className="p-3">Analog (ADC1)</td>
                      <td className="p-3">Reads soil moisture percentage (0-100%) in root-zone.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">DHT22 / Temperature</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">GPIO 4</td>
                      <td className="p-3">Digital (OneWire)</td>
                      <td className="p-3">Monitors ambient air temperature & relative humidity.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">LDR Light Sensor</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">GPIO 35</td>
                      <td className="p-3">Analog (ADC1)</td>
                      <td className="p-3">Sunlight irradiance / canopy illumination (Lux).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">Rain Drop Sensor</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">GPIO 32</td>
                      <td className="p-3">Analog (ADC1)</td>
                      <td className="p-3">Precipitation & rainfall detection for automated drainage.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">Water Level Sensor</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">GPIO 33</td>
                      <td className="p-3">Analog (ADC1)</td>
                      <td className="p-3">Monitors farm irrigation tank reservoir levels.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">5V Relay Module</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">GPIO 23</td>
                      <td className="p-3">Digital Output</td>
                      <td className="p-3">Controls automatic water pump / solenoid valve switch.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  <strong>Tip for ESP32 WiFi & ADC:</strong> Always connect analog sensors to ADC1 pins (GPIO 32-39). ADC2 pins are used internally by the ESP32 Wi-Fi module and cannot read analog values while Wi-Fi is active.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-white/10 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Node: <strong className="text-slate-700 dark:text-slate-200">{deviceId}</strong>
          </span>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  )
}
