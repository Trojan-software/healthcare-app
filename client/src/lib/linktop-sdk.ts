/**
 * Linktop HC03 Health Monitor SDK — Web Bluetooth port
 * Based on official Flutter SDK v1.0 (HC03_Flutter_V1.0 / smartring_flutter)
 *
 * Source-verified constants extracted from arm64-v8a/app.so:
 *   Filter/Service UUID : 0000ff27-0000-1000-8000-00805f9b34fb
 *   Write  characteristic: 0000FFF1-0000-1000-8000-00805F9B34FB
 *   Notify characteristic: 0000FFF4-0000-1000-8000-00805F9B34FB
 *
 * Detection types (Flutter SDK `Detection` enum):
 *   OX=blood oxygen, ECG=electrocardiogram, BP=blood pressure,
 *   BT=temperature, BG=blood glucose, BATTERY=battery
 */

// ─── BLE UUIDs (source-verified from HC03 Flutter SDK ARM binary) ─────────────
const FILTER_UUID          = '0000ff27-0000-1000-8000-00805f9b34fb'; // Advertising / primary service
const WRITE_CHAR_UUID      = '0000fff1-0000-1000-8000-00805f9b34fb'; // Write characteristic (FFF1)
const NOTIFY_CHAR_UUID     = '0000fff4-0000-1000-8000-00805f9b34fb'; // Notify characteristic (FFF4)

// Fallback service UUIDs tried in order if FF27 service lookup fails
const FALLBACK_SERVICES = [
  '0000fff0-0000-1000-8000-00805f9b34fb', // FFF0 service (hosts FFF1/FFF4)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Alternative
  '00001822-0000-1000-8000-00805f9b34fb', // Legacy
];

// ─── Protocol constants (Flutter SDK baseCommon.dart) ─────────────────────────
const PROTO = {
  // Packet layout
  PKT_LEN:          10,
  IDX_START:        0,
  IDX_LENGTH:       1,   // 2 bytes LE
  IDX_BT_EDITION:   3,
  IDX_TYPE:         4,
  IDX_HDR_CRC:      5,
  IDX_CONTENT:      6,

  // Framing
  START_REQ:        0x01,
  START_RES:        0x02,
  END_REQ:          0xFF,
  BT_EDITION:       0x04,

  // ── Request types (Detection enum) ──────────────────────────────────────────
  BATTERY:          0x0F,
  BATTERY_QUERY:    0x00,

  BP:               0x01,  // Blood pressure
  BP_CALIBRATE:     0x01,
  BP_START_QUICK:   0x04,
  BP_START_ARM:     0x05,
  BP_START_WRIST:   0x06,
  BP_STOP:          0x07,

  TEMPERATURE:      0x02,  // BT
  TEMP_START:       0x00,
  TEMP_STOP:        0x01,

  BG:               0x03,  // Blood glucose
  BG_GET_VER:       0x01,
  BG_CHECK_PAPER:   0x02,
  BG_ADC_START:     0x03,
  BG_ADC_STOP:      0x04,

  OX:               0x04,  // Blood oxygen (SpO2)
  OX_START:         0x00,
  OX_STOP:          0x01,

  ECG:              0x05,  // Electrocardiogram
  ECG_START:        0x01,
  ECG_STOP:         0x02,

  // ── Response types (request | 0x80) ─────────────────────────────────────────
  RES_BATTERY:      0x8F,
  RES_BP:           0x81,
  RES_TEMPERATURE:  0x82,
  RES_BG:           0x83,
  RES_OX:           0x84,
  RES_ECG:          0x85,
} as const;

// ─── Enums ────────────────────────────────────────────────────────────────────
export enum BatteryState {
  UNKNOWN     = 0,
  NORMAL      = 1,
  CHARGING    = 2,
  CHARGE_FULL = 3,
  LOW_BATTERY = 4,
}

export enum MeasureType {
  BATTERY        = 0x0F,
  ECG            = 0x05,
  SPO2           = 0x04,
  BLOOD_PRESSURE = 0x01,
  TEMPERATURE    = 0x02,
  BLOOD_GLUCOSE  = 0x03,
}

/** Blood-glucose test-strip paper states (Flutter SDK BloodGlucosePaperState) */
export enum BloodGlucosePaperState {
  UNKNOWN         = 0,
  NOT_INSERTED    = 1,  // "The test paper is not inserted."
  INSERTED        = 2,  // "Test strip inserted."
  CHECKING        = 3,  // Performing check / ADC in progress
  USED            = 4,  // "The test paper has been used, please replace it."
  READY           = 5,  // paperReady — ready to measure
  RESULT_READY    = 6,  // Final glucose value available
}

// ─── Data types ───────────────────────────────────────────────────────────────
export interface DeviceInfo {
  name: string;
  id: string;
  firmwareVersion?: string;
}

export interface BatteryData {
  state: number;   // BatteryState enum
  level: number;   // 0-100 %
}

/**
 * ECG result data (Flutter SDK getEcgData)
 * Field names match the Flutter SDK exactly.
 */
export interface ECGData {
  heartRate: number;       // HR — beats per minute
  smoothedWave: number;    // Wave sample value for real-time plot
  rrMax: number;           // RR peak-to-peak max (ms)
  rrMin: number;           // RR peak-to-peak min (ms)
  hrv: number;             // Heart rate variability
  mood: number;            // Mood index 1-100
  heartAge: number;        // Estimated heart age
  stress: number;          // Stress index
  respiratoryRate: number; // Breath rate (previously `breathRate` — renamed to match SDK)
  r2rInterval: number;     // R-to-R interval (ms)
  fingerTouch: boolean;    // Finger detected on sensor
}

/**
 * Blood-oxygen (SpO2) data (Flutter SDK getBloodOxygen / BloodOxygenData)
 */
export interface SpO2Data {
  oxygenLevel: number;       // bloodOxygen value 0-100 %
  heartRate: number;         // Heart rate from PPG
  waveValue?: number;        // BloodOxygenWaveData — single wave sample
  fingerDetection?: boolean; // bloodOxygenCatchTouched / FingerDetection
}

export interface BloodPressureData {
  systolic: number;   // mmHg
  diastolic: number;  // mmHg
  heartRate: number;  // bpm
}

export interface TemperatureData {
  temperature: number; // °C
}

/**
 * Blood glucose data (Flutter SDK getBloodGlucoseData)
 * Includes paper/strip state so the UI can guide the user through the workflow.
 */
export interface BloodGlucoseData {
  value: number;                     // Glucose concentration
  unit: 'mg/dL' | 'mmol/L';
  paperState?: BloodGlucosePaperState;
  paperMessage?: string;             // Human-readable strip status message
}

export type MeasurementData =
  | { type: 'battery';       data: BatteryData }
  | { type: 'ecg';           data: ECGData }
  | { type: 'spo2';          data: SpO2Data }
  | { type: 'bloodPressure'; data: BloodPressureData }
  | { type: 'temperature';   data: TemperatureData }
  | { type: 'bloodGlucose';  data: BloodGlucoseData };

type MeasurementCallback = (data: MeasurementData) => void;
type ConnectionCallback  = (connected: boolean, device?: DeviceInfo) => void;

// ─── SDK class ────────────────────────────────────────────────────────────────
class LinktopSDK {
  private device:            BluetoothDevice | null                          = null;
  private server:            BluetoothRemoteGATTServer | null                = null;
  private writeChar:         BluetoothRemoteGATTCharacteristic | null        = null;
  private notifyChar:        BluetoothRemoteGATTCharacteristic | null        = null;
  private isConnected:       boolean                                         = false;
  private deviceInfo:        DeviceInfo | null                               = null;

  private measurementCbs:    Map<string, MeasurementCallback>                = new Map();
  private connectionCbs:     Set<ConnectionCallback>                         = new Set();

  // Packet reassembly state
  private cacheType:         number                                          = 0;
  private cacheData:         number[]                                        = [];

  // SpO2 AC/DC sample buffer for offline calculation
  private spo2Samples:       { red: number; ir: number }[]                   = [];

  // ── Public API ──────────────────────────────────────────────────────────────

  isSupported(): boolean {
    return !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
  }

  async connect(): Promise<DeviceInfo> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    console.log('[HC03] Requesting BLE device...');
    this.device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'HC'          },  // HC03, HC02, …
        { namePrefix: 'Hc03'        },  // "Hc03 Flutter" (official device name)
        { services: [FILTER_UUID]   },  // Advertised service 0000ff27
      ],
      optionalServices: [
        FILTER_UUID,
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '00001822-0000-1000-8000-00805f9b34fb',
      ],
    });

    console.log('[HC03] Device selected:', this.device.name);

    this.device.addEventListener('gattserverdisconnected', () => {
      console.log('[HC03] GATT disconnected');
      this.onDisconnect();
    });

    console.log('[HC03] Connecting GATT…');
    this.server = await this.device.gatt!.connect();
    await this.delay(500);

    // ── Service discovery ───────────────────────────────────────────────────
    const serviceUUIDs = [FILTER_UUID, ...FALLBACK_SERVICES];
    let service: BluetoothRemoteGATTService | null = null;

    for (const uuid of serviceUUIDs) {
      try {
        service = await this.server.getPrimaryService(uuid);
        console.log('[HC03] Service found:', uuid);
        break;
      } catch {
        console.log('[HC03] Service not found:', uuid);
      }
    }

    if (!service) throw new Error('No compatible service found on HC03 device');

    // ── Write characteristic (FFF1) ─────────────────────────────────────────
    const writeUUIDs = [
      WRITE_CHAR_UUID,
      '0000ffe1-0000-1000-8000-00805f9b34fb',
      '0000fff2-0000-1000-8000-00805f9b34fb',
    ];
    for (const uuid of writeUUIDs) {
      try {
        this.writeChar = await service.getCharacteristic(uuid);
        console.log('[HC03] Write char found:', uuid);
        break;
      } catch { /* try next */ }
    }
    if (!this.writeChar) throw new Error('Write characteristic not found');

    // ── Notify characteristic (FFF4) ────────────────────────────────────────
    const notifyUUIDs = [
      NOTIFY_CHAR_UUID,
      '0000ffe1-0000-1000-8000-00805f9b34fb',
      '0000fff1-0000-1000-8000-00805f9b34fb',
    ];
    for (const uuid of notifyUUIDs) {
      try {
        this.notifyChar = await service.getCharacteristic(uuid);
        console.log('[HC03] Notify char found:', uuid);
        break;
      } catch { /* try next */ }
    }
    if (!this.notifyChar) throw new Error('Notify characteristic not found');

    await this.notifyChar.startNotifications();
    this.notifyChar.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (target.value) {
        const bytes = Array.from(new Uint8Array(target.value.buffer));
        console.log('[HC03] RX:', bytes.map(b => b.toString(16).padStart(2, '0')).join(' '));
        this.parseData(bytes);
      }
    });

    this.isConnected = true;
    this.deviceInfo  = { name: this.device.name || 'HC03', id: this.device.id };

    console.log('[HC03] Connected:', this.deviceInfo);
    this.connectionCbs.forEach(cb => cb(true, this.deviceInfo!));

    await this.delay(300);
    await this.queryBattery(); // Confirm comms

    return this.deviceInfo;
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.onDisconnect();
  }

  // ── Detection control ──────────────────────────────────────────────────────

  async queryBattery(): Promise<void> {
    await this.send(this.buildCmd(PROTO.BATTERY, [PROTO.BATTERY_QUERY]));
  }

  async startEcg(): Promise<void> {
    await this.send(this.buildCmd(PROTO.ECG, [PROTO.ECG_START]));
    console.log('[HC03] ECG started');
  }

  async stopEcg(): Promise<void> {
    await this.send(this.buildCmd(PROTO.ECG, [PROTO.ECG_STOP]));
    console.log('[HC03] ECG stopped');
  }

  async startBloodOxygen(): Promise<void> {
    this.spo2Samples = [];
    await this.send(this.buildCmd(PROTO.OX, [PROTO.OX_START]));
    console.log('[HC03] SpO2 started');
  }

  async stopBloodOxygen(): Promise<void> {
    await this.send(this.buildCmd(PROTO.OX, [PROTO.OX_STOP]));
    console.log('[HC03] SpO2 stopped');
  }

  async startBloodPressure(): Promise<void> {
    await this.send(this.buildCmd(PROTO.BP, [PROTO.BP_CALIBRATE]));
    await this.delay(200);
    await this.send(this.buildCmd(PROTO.BP, [PROTO.BP_START_QUICK]));
    console.log('[HC03] Blood pressure started');
  }

  async stopBloodPressure(): Promise<void> {
    await this.send(this.buildCmd(PROTO.BP, [PROTO.BP_STOP]));
    console.log('[HC03] Blood pressure stopped');
  }

  async startTemperature(): Promise<void> {
    await this.send(this.buildCmd(PROTO.TEMPERATURE, [PROTO.TEMP_START]));
    console.log('[HC03] Temperature started');
  }

  async stopTemperature(): Promise<void> {
    await this.send(this.buildCmd(PROTO.TEMPERATURE, [PROTO.TEMP_STOP]));
    console.log('[HC03] Temperature stopped');
  }

  /**
   * Blood glucose measurement flow (Flutter SDK):
   *   1. GET_VER — read test-strip version/model
   *   2. CHECK_PAPER — check strip insertion
   *   3. ADC_START — begin ADC sampling
   * The device will emit paper-state notifications before the final value.
   */
  async startBloodGlucose(): Promise<void> {
    await this.send(this.buildCmd(PROTO.BG, [PROTO.BG_GET_VER]));
    await this.delay(200);
    await this.send(this.buildCmd(PROTO.BG, [PROTO.BG_CHECK_PAPER]));
    await this.delay(200);
    await this.send(this.buildCmd(PROTO.BG, [PROTO.BG_ADC_START]));
    console.log('[HC03] Blood glucose started');
  }

  async stopBloodGlucose(): Promise<void> {
    await this.send(this.buildCmd(PROTO.BG, [PROTO.BG_ADC_STOP]));
    console.log('[HC03] Blood glucose stopped');
  }

  // ── Aliases matching older hook interface ──────────────────────────────────
  /** @deprecated Use startEcg() */       async startECG():    Promise<void> { return this.startEcg(); }
  /** @deprecated Use stopEcg() */        async stopECG():     Promise<void> { return this.stopEcg(); }
  /** @deprecated Use startBloodOxygen */ async startSpO2():   Promise<void> { return this.startBloodOxygen(); }
  /** @deprecated Use stopBloodOxygen */  async stopSpO2():    Promise<void> { return this.stopBloodOxygen(); }

  // ── Callback registration ──────────────────────────────────────────────────

  onMeasurement(id: string, cb: MeasurementCallback): void  { this.measurementCbs.set(id, cb); }
  offMeasurement(id: string): void                          { this.measurementCbs.delete(id); }
  onConnectionChange(cb: ConnectionCallback): void          { this.connectionCbs.add(cb); }
  offConnectionChange(cb: ConnectionCallback): void         { this.connectionCbs.delete(cb); }
  getConnectionStatus(): boolean                            { return this.isConnected; }
  getDeviceInfo(): DeviceInfo | null                        { return this.deviceInfo; }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async send(data: Uint8Array): Promise<void> {
    if (!this.writeChar) throw new Error('Device not connected');
    console.log('[HC03] TX:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
    await this.writeChar.writeValueWithoutResponse(data);
    await this.delay(50);
  }

  private onDisconnect(): void {
    this.isConnected = false;
    this.deviceInfo  = null;
    this.server      = null;
    this.writeChar   = null;
    this.notifyChar  = null;
    this.cacheType   = 0;
    this.cacheData   = [];
    this.connectionCbs.forEach(cb => cb(false));
  }

  // ── Packet builder (baseCommon.obtainCommandData) ──────────────────────────
  private buildCmd(type: number, content: number[]): Uint8Array {
    const total = PROTO.PKT_LEN + content.length - 1;
    const buf = new Uint8Array(total);
    const view = new DataView(buf.buffer);

    view.setUint8(PROTO.IDX_START,       PROTO.START_REQ);
    view.setUint16(PROTO.IDX_LENGTH,     content.length, true);
    view.setUint8(PROTO.IDX_BT_EDITION,  PROTO.BT_EDITION);
    view.setUint8(PROTO.IDX_TYPE,        type);

    const hdrCrc = this.crcHead(Array.from(buf.slice(0, PROTO.IDX_HDR_CRC)));
    view.setUint8(PROTO.IDX_HDR_CRC, hdrCrc);

    for (let i = 0; i < content.length; i++) {
      view.setUint8(PROTO.IDX_CONTENT + i, content[i]);
    }

    const tailIdx = total - 3;
    const tailCrc = this.crcTail(Array.from(buf.slice(0, tailIdx)));
    view.setUint16(tailIdx, tailCrc, true);
    view.setUint8(total - 1, PROTO.END_REQ);

    return buf;
  }

  /** XOR of all bytes (encryHead) */
  private crcHead(data: number[]): number {
    return data.reduce((acc, b) => (acc ^ (b & 0xff)) & 0xff, 0);
  }

  /** 16-bit CRC (encryTail) */
  private crcTail(data: number[]): number {
    let r = 0xffff;
    for (const b of data) {
      const t = b & 0xff;
      r = ((r >> 8) & 0xff) | (r << 8);
      r &= 0xffff;
      r ^= t;
      r &= 0xffff;
      r ^= (r & 0xff) >> 4;
      r &= 0xffff;
      r ^= (r << 8) << 4;
      r &= 0xffff;
      r ^= ((r & 0xff) << 4) << 1;
      r &= 0xffff;
    }
    return r;
  }

  // ── Packet parser (parseData) ──────────────────────────────────────────────
  /**
   * Entry point for all incoming BLE data — mirrors Flutter SDK parseData().
   * ALL measurement types (including ECG) arrive as framed packets.
   */
  private parseData(raw: number[]): void {
    if (raw.length < 6) {
      console.log('[HC03] Packet too short:', raw.length);
      return;
    }

    const view      = new DataView(new Uint8Array(raw).buffer);
    const startByte = view.getUint8(PROTO.IDX_START);
    const length    = view.getUint16(PROTO.IDX_LENGTH, true);
    const edition   = view.getUint8(PROTO.IDX_BT_EDITION);
    const type      = view.getUint8(PROTO.IDX_TYPE);
    const hdrCrc    = view.getUint8(PROTO.IDX_HDR_CRC);

    const calcCrc   = this.crcHead(raw.slice(0, PROTO.IDX_HDR_CRC));
    const isValidHdr = startByte === PROTO.START_RES &&
                       edition   === PROTO.BT_EDITION &&
                       hdrCrc    === calcCrc;

    if (isValidHdr) {
      const isFull = length <= raw.length - PROTO.IDX_CONTENT - 3;

      if (isFull) {
        // Self-contained packet
        const content = raw.slice(PROTO.IDX_CONTENT, PROTO.IDX_CONTENT + length);
        this.dispatchContent(type, content);
      } else {
        // First fragment — cache it
        this.cacheType = type;
        this.cacheData = raw;
      }
    } else if (this.cacheType !== 0) {
      // Continuation fragment
      const merged      = [...this.cacheData, ...raw];
      const mergedView  = new DataView(new Uint8Array(merged).buffer);
      const fullLen     = mergedView.getUint16(PROTO.IDX_LENGTH, true);
      const fullType    = mergedView.getUint8(PROTO.IDX_TYPE);
      const content     = merged.slice(PROTO.IDX_CONTENT, PROTO.IDX_CONTENT + fullLen);
      this.cacheType    = 0;
      this.cacheData    = [];
      this.dispatchContent(fullType, content);
    } else {
      console.log('[HC03] Unframed / continuation without head, discarding');
    }
  }

  /** Route parsed content to the appropriate handler */
  private dispatchContent(type: number, data: number[]): void {
    console.log('[HC03] Dispatching type=0x' + type.toString(16), 'len=' + data.length);

    switch (type) {
      case PROTO.RES_BATTERY:     this.parseBattery(data);       break;
      case PROTO.RES_OX:          this.parseBloodOxygen(data);   break;
      case PROTO.RES_TEMPERATURE: this.parseTemperature(data);   break;
      case PROTO.RES_BP:          this.parseBloodPressure(data); break;
      case PROTO.RES_BG:          this.parseBloodGlucose(data);  break;
      case PROTO.RES_ECG:         this.parseEcg(data);           break;
      // Some devices send ECG data with the request type (0x05) rather than response type (0x85)
      case PROTO.ECG:             this.parseEcg(data);           break;
      default:
        console.log('[HC03] Unknown response type: 0x' + type.toString(16));
    }
  }

  // ── Individual measurement parsers ─────────────────────────────────────────

  /** Battery — [state, level%] */
  private parseBattery(data: number[]): void {
    if (data.length < 2) return;
    const state = data[0];
    const level = data[1];
    console.log('[HC03] Battery state=' + state + ' level=' + level + '%');
    this.emit({ type: 'battery', data: { state, level } });
  }

  /**
   * Blood oxygen (SpO2) — Flutter SDK getBloodOxygen
   *
   * Short result packet:  [bloodOxygen, heartRate]
   * Wave packet (≥3 B):   raw PPG samples for self-calculating SpO2
   * Finger-touch packet:  [0x00, fingerFlag]
   */
  private parseBloodOxygen(data: number[]): void {
    console.log('[HC03] SpO2 raw:', data);

    if (data.length === 0) return;

    // Finger-detection notification — protocol specifies exactly 2 bytes: [0x00, fingerFlag].
    // Must check length === 2, NOT >= 2, because wave packets also have first byte 0x00
    // whenever the high byte of the 16-bit wave value is zero (wave value < 256).
    // Using >= 2 would swallow valid wave packets and leave the buffer empty forever.
    if (data.length === 2 && data[0] === 0x00) {
      const fingerDetection = data[1] !== 0;
      this.emit({ type: 'spo2', data: { oxygenLevel: 0, heartRate: 0, fingerDetection } });
      return;
    }

    // Wave data packet (BloodOxygenWaveData) — always 3+ bytes
    if (data.length >= 3) {
      const waveValue = ((data[0] & 0xff) << 8) | (data[1] & 0xff);

      // Accumulate red/IR pair samples for offline SpO2 calculation
      if (data.length >= 4) {
        this.spo2Samples.push({ red: waveValue, ir: ((data[2] & 0xff) << 8) | (data[3] & 0xff) });
      } else {
        this.spo2Samples.push({ red: waveValue, ir: waveValue });
      }

      this.emit({ type: 'spo2', data: { oxygenLevel: 0, heartRate: 0, waveValue, fingerDetection: true } });

      // Every 50 samples calculate a running SpO2 estimate
      if (this.spo2Samples.length >= 50) {
        const result = this.calcSpO2();
        if (result.oxygenLevel >= 70 && result.oxygenLevel <= 100) {
          this.emit({ type: 'spo2', data: { ...result, fingerDetection: true } });
        }
        this.spo2Samples = [];
      }
      return;
    }

    // Direct result: [bloodOxygen, heartRate]
    if (data.length >= 2) {
      const oxygenLevel  = data[0];
      const heartRate    = data[1];
      if (oxygenLevel >= 70 && oxygenLevel <= 100 && heartRate >= 40 && heartRate <= 220) {
        console.log('[HC03] SpO2 result O2=' + oxygenLevel + '% HR=' + heartRate);
        this.emit({ type: 'spo2', data: { oxygenLevel, heartRate, fingerDetection: true } });
      }
    }
  }

  /**
   * ECG — Flutter SDK getEcgData
   *
   * The HC03 uses the native NSK Algo ECG library. On-device calculation runs on
   * the native layer and the result arrives in the notify callback as a framed
   * packet with type 0x85.
   *
   * Packet layout (content bytes after header):
   *   [0]     subtype  — 0x01=wave, 0x02=result
   *   Wave   : [1..N]  signed 16-bit LE wave samples (smoothedWave)
   *   Result : [1]  HR, [2] HRV, [3] mood, [4] stress,
   *            [5] breathRate/respiratoryRate, [6] heartAge,
   *            [7-8] rrMax LE, [9-10] rrMin LE, [11-12] r2rInterval LE
   *            [13] fingerTouch (0=no, 1=yes)
   */
  private parseEcg(data: number[]): void {
    console.log('[HC03] ECG content:', data);

    if (data.length < 2) return;

    const subtype = data[0];

    if (subtype === 0x01) {
      // Wave data — single signed 16-bit sample (big-endian, centered around 0)
      // Must be interpreted as signed int16: values above 0x7FFF are negative.
      const rawU16 = ((data[1] & 0xff) << 8) | (data[2] ?? 0);
      const smoothedWave = rawU16 > 0x7fff ? rawU16 - 0x10000 : rawU16;
      this.emit({ type: 'ecg', data: {
        heartRate: 0, smoothedWave, rrMax: 0, rrMin: 0, hrv: 0,
        mood: 0, heartAge: 0, stress: 0, respiratoryRate: 0,
        r2rInterval: 0, fingerTouch: true,
      }});
    } else if (subtype === 0x02 && data.length >= 8) {
      // Computed ECG result
      const hr             = data[1];
      const hrv            = data[2];
      const mood           = data[3];
      const stress         = data[4];
      const respiratoryRate = data[5];
      const heartAge       = data[6] ?? 0;
      const rrMax          = data.length > 8  ? (data[7]  | (data[8]  << 8)) : 0;
      const rrMin          = data.length > 10 ? (data[9]  | (data[10] << 8)) : 0;
      const r2rInterval    = data.length > 12 ? (data[11] | (data[12] << 8)) : 0;
      const fingerTouch    = data.length > 13 ? data[13] !== 0 : true;

      if (hr >= 30 && hr <= 240) {
        console.log('[HC03] ECG result HR=' + hr + ' HRV=' + hrv + ' mood=' + mood);
        this.emit({ type: 'ecg', data: {
          heartRate: hr, smoothedWave: 0, rrMax, rrMin, hrv,
          mood, heartAge, stress, respiratoryRate, r2rInterval, fingerTouch,
        }});
      }
    } else {
      // Fallback: treat first byte as HR directly (some firmware variants)
      const hr           = data[0];
      const smoothedWave = data.length > 2 ? ((data[1] << 8) | data[2]) : 0;
      if (hr >= 30 && hr <= 240) {
        this.emit({ type: 'ecg', data: {
          heartRate: hr, smoothedWave,
          rrMax: 0, rrMin: 0,
          hrv:         data.length > 3 ? data[3] : 0,
          stress:      data.length > 4 ? data[4] : 0,
          mood:        data.length > 5 ? data[5] : 0,
          respiratoryRate: data.length > 6 ? data[6] : 0,
          heartAge:    0, r2rInterval: 0, fingerTouch: true,
        }});
      }
    }
  }

  /** Temperature — [intPart, decPart] → e.g. [36, 60] = 36.60 °C */
  private parseTemperature(data: number[]): void {
    console.log('[HC03] Temperature raw:', data);
    if (data.length < 2) return;

    const temperature = parseFloat((data[0] + data[1] / 100).toFixed(2));
    if (temperature >= 30 && temperature <= 45) {
      console.log('[HC03] Temperature=' + temperature + '°C');
      this.emit({ type: 'temperature', data: { temperature } });
    }
  }

  /**
   * Blood pressure — Flutter SDK getBloodPressureData / BloodPressureResult
   *
   * Response layout:
   *   [0]  subtype: 0x01=calibration ack, 0x02=pressure reading, 0x03=final result
   *   For readings: [1]=systolic, [2]=diastolic, [3]=heartRate
   */
  private parseBloodPressure(data: number[]): void {
    console.log('[HC03] BP raw:', data);
    if (data.length < 2) return;

    const subtype = data[0];

    if (subtype === 0x01) {
      console.log('[HC03] BP calibration ack');
      return;
    }

    // subtype 0x02 or 0x03 — actual reading
    if (data.length >= 4) {
      const systolic  = data[1];
      const diastolic = data[2];
      const heartRate = data[3];

      if (systolic >= 50 && systolic <= 250 && diastolic >= 30 && diastolic <= 180) {
        console.log('[HC03] BP SYS=' + systolic + ' DIA=' + diastolic + ' HR=' + heartRate);
        this.emit({ type: 'bloodPressure', data: { systolic, diastolic, heartRate } });
      }
    }
  }

  /**
   * Blood glucose — Flutter SDK getBloodGlucoseData / BloodGlucosePaperData
   *
   * Response layout:
   *   [0]  subtype:
   *        0x01 = version info (ignore)
   *        0x02 = paper/strip state notification
   *        0x03 = glucose measurement result
   *
   * Strip state (subtype 0x02, [1]):
   *   0x00 = not inserted  ("The test paper is not inserted.")
   *   0x01 = inserted      ("Test strip inserted.")
   *   0x02 = used/spent    ("The test paper has been used, please replace it.")
   *   0x03 = ready         (paperReady — ADC ready to start)
   *
   * Result (subtype 0x03): [1]=high byte, [2]=low byte  → value = (high<<8|low)/10 mg/dL
   */
  private parseBloodGlucose(data: number[]): void {
    console.log('[HC03] BG raw:', data);
    if (data.length < 2) return;

    const subtype = data[0];

    if (subtype === 0x01) {
      // Version response — ignore
      return;
    }

    if (subtype === 0x02) {
      // Paper/strip state notification
      const stateCode = data[1] ?? 0;
      const stateMap: Record<number, { state: BloodGlucosePaperState; message: string }> = {
        0x00: { state: BloodGlucosePaperState.NOT_INSERTED, message: 'The test paper is not inserted.' },
        0x01: { state: BloodGlucosePaperState.INSERTED,     message: 'Test strip inserted.' },
        0x02: { state: BloodGlucosePaperState.USED,         message: 'The test paper has been used. Please replace it with a new one.' },
        0x03: { state: BloodGlucosePaperState.READY,        message: 'Strip ready. Applying blood sample…' },
      };
      const info = stateMap[stateCode] ?? { state: BloodGlucosePaperState.UNKNOWN, message: 'Unknown strip state.' };
      console.log('[HC03] BG paper state:', info.message);
      this.emit({ type: 'bloodGlucose', data: { value: 0, unit: 'mg/dL', paperState: info.state, paperMessage: info.message } });
      return;
    }

    if (subtype === 0x03 && data.length >= 3) {
      // Glucose result
      const raw   = ((data[1] & 0xff) << 8) | (data[2] & 0xff);
      const value = Math.round(raw / 10);  // Device sends × 10 mg/dL

      if (value >= 20 && value <= 600) {
        console.log('[HC03] Glucose=' + value + ' mg/dL');
        this.emit({ type: 'bloodGlucose', data: { value, unit: 'mg/dL', paperState: BloodGlucosePaperState.RESULT_READY } });
      }
      return;
    }

    // Older firmware — no subtype, just [high, low]
    if (data.length >= 2) {
      const value = Math.round(((data[0] & 0xff) << 8 | (data[1] & 0xff)) / 10);
      if (value >= 20 && value <= 600) {
        console.log('[HC03] Glucose (legacy)=' + value + ' mg/dL');
        this.emit({ type: 'bloodGlucose', data: { value, unit: 'mg/dL', paperState: BloodGlucosePaperState.RESULT_READY } });
      }
    }
  }

  // ── SpO2 AC/DC calculation (offline fallback) ──────────────────────────────
  private calcSpO2(): SpO2Data {
    if (this.spo2Samples.length === 0) return { oxygenLevel: 0, heartRate: 0 };

    let redDc = 0, irDc = 0;
    for (const s of this.spo2Samples) { redDc += s.red; irDc += s.ir; }
    redDc /= this.spo2Samples.length;
    irDc  /= this.spo2Samples.length;

    let redAc = 0, irAc = 0;
    for (const s of this.spo2Samples) {
      redAc += Math.abs(s.red - redDc);
      irAc  += Math.abs(s.ir  - irDc);
    }
    redAc /= this.spo2Samples.length;
    irAc  /= this.spo2Samples.length;

    const R          = irAc > 0 ? (redAc / redDc) / (irAc / irDc) : 1;
    const oxygenLevel = Math.min(100, Math.max(70, Math.round(110 - 25 * R)));

    return { oxygenLevel, heartRate: 0 };
  }

  private emit(measurement: MeasurementData): void {
    this.measurementCbs.forEach(cb => cb(measurement));
  }
}

export const linktopSdk = new LinktopSDK();
export default linktopSdk;
