"use client";

import { useState, useEffect, useRef } from "react";

const POLL_INTERVAL = 250; // ms
const MAX_FSR = 4095; // Adjust this if your ADC range is different

interface FSRData {
  value: number;
  exceeded: boolean;
}

type Role = "none" | "patient" | "doctor";

export default function AppRouter() {
  const [role, setRole] = useState<Role>("none");

  if (role === "none") {
    return <LoginScreen setRole={setRole} />;
  }

  if (role === "patient") {
    return <PatientDashboard setRole={setRole} />;
  }

  if (role === "doctor") {
    return <DoctorDashboard setRole={setRole} />;
  }

  return null;
}

// ---------------------------------------------------------
// COMPONENT: LOGIN SCREEN
// ---------------------------------------------------------
function LoginScreen({ setRole }: { setRole: (v: Role) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "doctor" && password === "doctor") {
      setRole("doctor");
      setError(null);
    } else if (username === "patient" && password === "patient") {
      setRole("patient");
      setError(null);
    } else {
      setError("INVALID CREDENTIALS");
    }
  };

  return (
    <main className="min-h-[100vh] flex flex-col items-center justify-center p-6 bg-neo-white border-t-[6px] border-neo-black">
      <div className="neo-card max-w-sm w-full relative">
        <div className="absolute -top-3 -right-3 neo-badge neo-badge-idle rotate-12 z-20">AUTH_MODE</div>
        <div className="neo-card-header">System Access</div>

        <h1 className="text-[40px] mb-8 leading-tight tracking-tighter mix-blend-difference">
          ORTHOFORCE<br />
          <span className="text-neo-blue">PORTAL</span>
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block font-space text-[11px] font-bold uppercase tracking-[0.12em] mb-2">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              className="w-full bg-neo-white border-[3px] border-neo-black p-3 font-plex text-base outline-none focus:neo-shadow transition-shadow placeholder:text-neo-gray"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="(doctor or patient)"
              required
            />
          </div>

          <div>
            <label className="block font-space text-[11px] font-bold uppercase tracking-[0.12em] mb-2">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              className="w-full bg-neo-white border-[3px] border-neo-black p-3 font-plex text-base outline-none focus:neo-shadow transition-shadow placeholder:text-neo-gray"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div className="neo-alert danger neo-shadow p-3 text-xs uppercase animate-bounce mt-2">
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            className="bg-neo-yellow text-neo-black border-[3px] border-neo-black neo-shadow py-3 px-6 font-space font-bold text-[13px] uppercase tracking-[0.08em] hover:-translate-y-0.5 hover:translate-x-[-2px] hover:neo-shadow-lg active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#0A0A0A] transition-all mt-4"
          >
            Authenticate →
          </button>
        </form>
      </div>
    </main>
  );
}

// ---------------------------------------------------------
// COMPONENT: PATIENT DASHBOARD (BENTO GRID + FSR)
// ---------------------------------------------------------
function PatientDashboard({ setRole }: { setRole: (v: Role) => void }) {
  const [data, setData] = useState<FSRData>({ value: 0, exceeded: false });
  const [error, setError] = useState<string | null>(null);

  // Connection State
  const [ipAddress, setIpAddress] = useState<string>("172.21.228.211");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  // Threshold State
  const [thresholdOn, setThresholdOn] = useState<string>("");
  const [thresholdOff, setThresholdOff] = useState<string>("");
  const [thresholdStatus, setThresholdStatus] = useState<{type: "idle"|"success"|"error", msg: string}>({type: "idle", msg: ""});
  const [isUpdatingThresholds, setIsUpdatingThresholds] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectToDevice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!ipAddress) {
      setError("PLEASE ENTER AN IP ADDRESS");
      return;
    }

    setConnectionStatus("connecting");
    setError(null);
    setData({ value: 0, exceeded: false });
    setThresholdStatus({type: "idle", msg: ""});

    // Use the full URL if given (like ngrok), otherwise assume it's an IP and prepend http://
    const cleanIP = ipAddress.trim();
    const baseEndpoint = cleanIP.startsWith("http") ? cleanIP : `/api/esp32/${cleanIP}`;

    // First attempt to grab thresholds right at connection
    try {
        const threshRes = await fetch(`${baseEndpoint}/threshold`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            }
        });
        if(threshRes.ok) {
            const threshJson = await threshRes.json();
             setThresholdOn(threshJson.thresholdOn?.toString() || "");
             setThresholdOff(threshJson.thresholdOff?.toString() || "");
        }
    } catch(err) {
        // Just log it, don't fail the whole connection yet, wait for FSR polling to fail
        console.error("Failed to fetch initial thresholds", err);
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${baseEndpoint}/fsr`, { 
            cache: "no-store", 
            mode: 'cors',
            headers: {
                "ngrok-skip-browser-warning": "true",
            }
        });
        if (!response.ok) throw new Error("Network response was not ok");

        const json: FSRData = await response.json();
        setData(json);
        setConnectionStatus("connected");
        setError(null);
      } catch (err) {
        setConnectionStatus("disconnected");
        setError("CONNECTION FAILED OR LOST. CHECK IP OR TARGET DEVICE STATUS.");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // Initial fetch to establish connectivity visually
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
  };

  const disconnectDevice = () => {
    setConnectionStatus("disconnected");
    if (intervalRef.current) clearInterval(intervalRef.current);
    setData({ value: 0, exceeded: false });
    setError(null);
    setThresholdStatus({type:"idle", msg:""});
  };

  const handleUpdateThresholds = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if(connectionStatus !== "connected") {
          setThresholdStatus({type: "error", msg: "Connect to target first."});
          return;
      }
      
      const onVal = parseInt(thresholdOn);
      const offVal = parseInt(thresholdOff);

      if (isNaN(onVal) || isNaN(offVal)) {
          setThresholdStatus({type: "error", msg: "Invalid numbers."});
          return;
      }

      if (offVal >= onVal) {
          setThresholdStatus({type: "error", msg: "OFF must be < ON limit."});
          return;
      }

      setIsUpdatingThresholds(true);
      setThresholdStatus({type: "idle", msg: "Syncing..."});

      try {
          const cleanIP = ipAddress.trim();
          const updateEndpoint = cleanIP.startsWith("http") ? `${cleanIP}/threshold` : `/api/esp32/${cleanIP}/threshold`;
          const res = await fetch(updateEndpoint, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true"
              },
              body: JSON.stringify({ thresholdOn: onVal, thresholdOff: offVal })
          });

          if(!res.ok) {
              const errJson = await res.json().catch(()=>({}));
              throw new Error(errJson.error || "Update failed");
          }

          const data = await res.json();
          setThresholdOn(data.thresholdOn.toString());
          setThresholdOff(data.thresholdOff.toString());
          setThresholdStatus({type: "success", msg: "Thresholds Synced."});
          
      } catch(err: any) {
          setThresholdStatus({type: "error", msg: err.message || "Network Error"});
      } finally {
          setIsUpdatingThresholds(false);
      }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const percentage = Math.min(100, Math.max(0, (data.value / MAX_FSR) * 100));

  return (
    <main className="max-w-[1400px] mx-auto min-h-screen px-6 py-6 md:p-12 border-t-[6px] border-neo-black flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-[4px] border-neo-black pb-6 gap-4">
        <div>
          <div className="neo-badge neo-badge-normal mb-3">PATIENT_MODE</div>
          <h1 className="text-[40px] md:text-[64px] leading-none mb-2">My Therapy</h1>
          <p className="font-plex text-lg">Daily Orthoforce Tracking Interface</p>
        </div>
        <button
           onClick={() => { disconnectDevice(); setRole("none"); }}
          className="bg-transparent text-neo-black border-[3px] border-neo-black py-2 px-6 font-space font-bold text-[13px] uppercase hover:bg-neo-red hover:text-neo-white hover:border-neo-black transition-colors neo-shadow hover:-translate-y-0.5"
        >
          Logout User
        </button>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[minmax(180px,auto)] gap-6">

        {/* HERO TILE: FSR Monitor (col-span-12 or 8) */}
        <div className={`neo-card col-span-1 md:col-span-8 flex flex-col justify-between ${data.exceeded ? "bg-neo-red/10 border-neo-red" : ""}`}>
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-space font-bold uppercase tracking-widest text-lg">Real-Time Sensor</h2>
            <div className={`neo-badge ${connectionStatus === "connecting" ? "neo-badge-idle neo-blink" : data.exceeded ? "neo-badge-exceeded neo-blink" : connectionStatus === "connected" ? "neo-badge-normal" : "neo-badge-idle"}`}>
              {connectionStatus === "connecting" ? "⟳ CONNECTING" : data.exceeded ? "⚠ LIMIT EXCEEDED" : connectionStatus === "connected" ? "✓ CONNECTED" : "✗ IDLE"}
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">
             <div className="text-center md:text-left">
              <div className="font-space text-[80px] md:text-[140px] font-bold leading-none text-neo-black tracking-tighter tabular-nums truncate">
                {connectionStatus === "connected" ? data.value : "---"}
              </div>
              <div className="font-space text-[11px] font-bold uppercase tracking-[0.12em] text-neo-black mt-2 opacity-60">
                ↑ Raw Force Signal
              </div>
            </div>

            <div className="w-full md:w-1/2 mt-4 md:mt-0 flex flex-col justify-end">
              <div className="font-space text-[11px] font-bold uppercase tracking-[0.12em] text-neo-black mb-2 flex justify-between">
                <span>Force Applied</span>
                <span>{connectionStatus === "connected" ? percentage.toFixed(1) : 0}%</span>
              </div>
              <div className="neo-progress-container mb-1 h-8">
                <div
                  className={`neo-progress-fill ${data.exceeded ? "exceeded" : ""}`}
                  style={{ width: `${connectionStatus === "connected" ? percentage : 0}%` }}
                />
              </div>
               {data.exceeded && connectionStatus === "connected" && (
                  <div className="neo-alert danger border-[2px] p-2 mt-4 text-[11px] text-center w-full animate-bounce">
                    ⚠ RELEASE PRESSURE IMMEDIATELY
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* SIDE TILE: Connection Panel */}
        <div className="neo-card bg-neo-white col-span-1 md:col-span-4 flex flex-col justify-between">
          <h2 className="font-space font-bold uppercase tracking-widest text-lg border-b-[2px] border-neo-black pb-2 mb-4">Device Config</h2>
          
          {connectionStatus === "disconnected" ? (
             <form onSubmit={connectToDevice} className="flex flex-col gap-4 flex-1 justify-end">
                <div>
                  <label className="block font-space text-[11px] font-bold uppercase tracking-[0.12em] mb-2">Target IP Address</label>
                  <input
                    type="text"
                    className="w-full bg-neo-paper border-[3px] border-neo-black p-3 font-plex text-[14px] outline-none focus:neo-shadow"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="172.21.228.211"
                    required
                  />
                  {error && <div className="text-neo-red font-bold text-[10px] font-space mt-2 uppercase">✗ {error}</div>}
                </div>
                <button type="submit" className="w-full bg-neo-yellow text-neo-black border-[3px] border-neo-black neo-shadow py-3 px-4 font-space font-bold text-[13px] uppercase hover:neo-shadow-lg transition-all active:translate-y-1">
                  Connect Target
                </button>
             </form>
          ) : (
            <div className="flex flex-col gap-4 flex-1 justify-end">
                <div>
                  <label className="block font-space text-[11px] font-bold uppercase tracking-[0.12em] mb-2">Active Link</label>
                  <div className="w-full bg-neo-black text-neo-green font-plex p-3 border-[3px] border-neo-black text-sm break-all">
                     {ipAddress}
                  </div>
                </div>
                 <button onClick={disconnectDevice} className="w-full bg-transparent text-neo-black border-[3px] border-neo-black py-3 px-4 font-space font-bold text-[13px] uppercase hover:bg-neo-black hover:text-neo-white transition-all">
                  Disconnect Link
                </button>
            </div>
          )}
        </div>

        {/* BOTTOM TILE 1: Dynamic Threshold Control */}
        <div className="neo-card bg-neo-paper col-span-1 md:col-span-4 border-neo-black flex flex-col">
          <h2 className="font-space font-bold uppercase tracking-widest text-lg border-b-[2px] border-neo-black pb-2 mb-4">⚠ Force Limits</h2>
          
          <form onSubmit={handleUpdateThresholds} className="flex-1 flex flex-col justify-end gap-3">
             <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block font-space text-[10px] font-bold uppercase tracking-[0.12em] mb-1">Force ON Limit</label>
                    <input 
                       type="number" 
                       required
                       disabled={connectionStatus !== "connected"}
                       placeholder="e.g. 1400"
                       value={thresholdOn}
                       onChange={e=>setThresholdOn(e.target.value)}
                       className="w-full bg-neo-white border-[3px] border-neo-black p-2 font-plex text-[14px] outline-none focus:neo-shadow disabled:opacity-50" 
                    />
                </div>
                <div className="flex-1">
                    <label className="block font-space text-[10px] font-bold uppercase tracking-[0.12em] mb-1">Force OFF Limit</label>
                    <input 
                       type="number" 
                       required
                       disabled={connectionStatus !== "connected"}
                       placeholder="e.g. 1150"
                       value={thresholdOff}
                       onChange={e=>setThresholdOff(e.target.value)}
                       className="w-full bg-neo-white border-[3px] border-neo-black p-2 font-plex text-[14px] outline-none focus:neo-shadow disabled:opacity-50" 
                    />
                </div>
             </div>
             
             <div className="flex items-center gap-3 mt-1">
                 <button 
                   type="submit" 
                   disabled={connectionStatus !== "connected" || isUpdatingThresholds}
                   className="bg-neo-blue text-neo-white border-[3px] border-neo-black py-2 px-4 font-space font-bold text-[11px] uppercase hover:bg-neo-yellow hover:text-neo-black disabled:opacity-50 transition-colors"
                 >
                   Sync Limits →
                 </button>
                 
                 {thresholdStatus.type !== "idle" && (
                    <span className={`font-space text-[10px] font-bold uppercase ${thresholdStatus.type === 'error' ? 'text-neo-red' : 'text-neo-green'}`}>
                        {thresholdStatus.type === 'error' ? `✗ ${thresholdStatus.msg}` : `✓ ${thresholdStatus.msg}`}
                    </span>
                 )}
             </div>
          </form>
        </div>

         {/* BOTTOM TILE 2: Timer */}
         <div className="neo-card bg-neo-black text-neo-white col-span-1 md:col-span-4 flex flex-col pb-4">
          <h2 className="font-space font-bold uppercase tracking-widest text-lg border-b-[2px] border-neo-white pb-2 mb-4">Session Duration</h2>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <span className="font-space text-[56px] font-bold leading-none tabular-nums tracking-tighter shadow-neo-yellow drop-shadow-[4px_4px_0px_#FFE500] text-neo-white">12:45</span>
            {connectionStatus === "connected" && <span className="font-space text-[11px] font-bold uppercase mt-4 bg-neo-white text-neo-black px-3 py-1 neo-blink">Active Session</span>}
          </div>
        </div>

         {/* BOTTOM TILE 3: Instructions */}
         <div className="neo-card bg-neo-yellow col-span-1 md:col-span-4">
          <h2 className="font-space font-bold uppercase tracking-widest text-lg border-b-[2px] border-neo-black pb-2 mb-4">Provider Notes</h2>
          <ul className="font-plex text-sm font-bold flex flex-col gap-3 mt-4 list-none p-0">
             <li className="flex gap-2 items-start"><span className="text-xl leading-none">◆</span> Apply consistent pressure for 5 seconds.</li>
             <li className="flex gap-2 items-start"><span className="text-xl leading-none">◆</span> Rest for 10 seconds between reps.</li>
             <li className="flex gap-2 items-start text-neo-red"><span className="text-xl leading-none">⚠</span> Stop if sharp pain occurs.</li>
          </ul>
        </div>
        
      </div>
    </main>
  );
}

// ---------------------------------------------------------
// COMPONENT: DOCTOR OVERVIEW (BENTO GRID)
// ---------------------------------------------------------
function DoctorDashboard({ setRole }: { setRole: (v: Role) => void }) {
  // Mock Data for Doctor
  const activeAlerts = [
    { id: 1, patient: "John Doe", time: "10:02 AM", reason: "Force Limit Exceeded x3" },
    { id: 2, patient: "Jane Smith", time: "09:45 AM", reason: "Device Disconnected" }
  ];

  return (
    <main className="max-w-[1400px] mx-auto min-h-screen px-6 py-6 md:p-12 border-t-[6px] border-neo-black flex flex-col gap-8 bg-neo-paper">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-[4px] border-neo-black pb-6 gap-4">
        <div>
          <div className="neo-badge neo-badge-idle bg-neo-black text-neo-white mb-3">CLINICIAN_MODE</div>
          <h1 className="text-[40px] md:text-[64px] leading-none mb-2 text-neo-blue mix-blend-multiply">Fleet Command</h1>
          <p className="font-plex text-lg font-bold">Total Active Devices: 24</p>
        </div>
        <button
          onClick={() => setRole("none")}
          className="bg-neo-black text-neo-white border-[3px] border-neo-black py-2 px-6 font-space font-bold text-[13px] uppercase hover:bg-neo-red hover:text-neo-white hover:border-neo-black transition-colors neo-shadow hover:-translate-y-0.5"
        >
          Logout Admin
        </button>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[minmax(200px,auto)] gap-6">

        {/* HERO TILE: Active Alerts */}
        <div className="neo-card col-span-1 md:col-span-8 bg-neo-white flex flex-col">
           <div className="flex justify-between items-center border-b-[3px] border-neo-black pb-4 mb-4">
            <h2 className="font-space font-bold uppercase tracking-widest text-2xl text-neo-red">Critical Alert Log [2]</h2>
            <button className="bg-neo-yellow text-neo-black border-2 border-neo-black text-[10px] font-space font-bold uppercase px-3 py-1 hover:neo-shadow cursor-pointer transition-shadow">Acknowledge All</button>
          </div>
          
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="border-[3px] border-neo-black p-4 bg-neo-paper flex justify-between items-center group hover:bg-neo-black hover:text-neo-white transition-colors cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="neo-badge neo-badge-exceeded min-w-[80px] text-center">{alert.time}</div>
                  <span className="font-space font-bold text-lg uppercase">{alert.patient}</span>
                </div>
                <div className="font-plex text-sm font-bold uppercase border-l-[3px] border-neo-black pl-4 group-hover:border-neo-white text-neo-red group-hover:text-neo-yellow">
                  {alert.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE TILE: System Health */}
        <div className="neo-card col-span-1 md:col-span-4 bg-neo-black text-neo-white shadow-[6px_6px_0px_#C8C8C8] flex flex-col border-neo-gray">
          <h2 className="font-space font-bold uppercase tracking-widest text-lg border-b-[2px] border-neo-white pb-2 mb-4">Node Status</h2>
          
          <div className="flex-1 flex flex-col justify-end gap-6">
            <div>
              <div className="flex justify-between font-space text-[12px] uppercase font-bold text-neo-gray mb-1">
                <span>Online Nodes</span>
                <span className="text-neo-green">21/24</span>
              </div>
              <div className="w-full h-[12px] bg-neo-white border-[2px] border-neo-gray overflow-hidden">
                <div className="h-full bg-neo-green w-[87%]"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between font-space text-[12px] uppercase font-bold text-neo-gray mb-1">
                <span>Therapy Compliance</span>
                <span className="text-neo-blue">62%</span>
              </div>
              <div className="w-full h-[12px] bg-neo-white border-[2px] border-neo-gray overflow-hidden">
                <div className="h-full bg-neo-blue w-[62%]"></div>
              </div>
            </div>
            
            <div className="bg-neo-paper text-neo-black p-3 font-plex text-xs font-bold border-l-4 border-neo-red mt-auto uppercase">
               3 nodes require firmware recalibration (IDs: #OF-412, #OF-901, #OF-023)
            </div>
          </div>
        </div>
        
        {/* BOTTOM WIDE TILE: Patient Directory */}
        <div className="neo-card col-span-1 md:col-span-12 bg-neo-white flex flex-col overflow-x-auto">
          <h2 className="font-space font-bold uppercase tracking-widest text-lg border-b-[2px] border-neo-black pb-2 mb-6 flex items-center justify-between">
            <span>Global Roster</span>
            <input type="text" placeholder="SERACH PATIENTS..." className="text-sm font-plex font-normal border-2 border-neo-black px-2 py-1 outline-none w-64 focus:shadow-[2px_2px_0px_#FFE500]" />
          </h2>
          
          <table className="w-full font-plex text-left border-collapse border-[3px] border-neo-black">
            <thead>
              <tr className="bg-neo-paper border-b-[3px] border-neo-black">
                <th className="p-3 font-space uppercase text-xs">Patient ID</th>
                <th className="p-3 font-space uppercase text-xs border-l-[3px] border-neo-black">Name</th>
                <th className="p-3 font-space uppercase text-xs border-l-[3px] border-neo-black">Status</th>
                <th className="p-3 font-space uppercase text-xs border-l-[3px] border-neo-black">Last Session</th>
                <th className="p-3 font-space uppercase text-xs border-l-[3px] border-neo-black">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-[2px] border-neo-black hover:bg-neo-yellow/20 transition-colors">
                <td className="p-3 text-sm font-bold">#PT-8812</td>
                <td className="p-3 font-bold uppercase border-l-[3px] border-neo-black">John Doe</td>
                <td className="p-3 border-l-[3px] border-neo-black"><span className="neo-badge neo-badge-idle !text-[9px]">OFFLINE</span></td>
                <td className="p-3 text-sm font-bold border-l-[3px] border-neo-black">Today, 09:12 AM</td>
                <td className="p-3 border-l-[3px] border-neo-black"><button className="font-space text-[10px] uppercase font-bold border-b-2 border-neo-blue text-neo-blue hover:bg-neo-blue hover:text-neo-white px-1">Review Logs →</button></td>
              </tr>
              <tr className="border-b-[2px] border-neo-black hover:bg-neo-yellow/20 transition-colors">
                <td className="p-3 text-sm font-bold">#PT-4091</td>
                <td className="p-3 font-bold uppercase border-l-[3px] border-neo-black">Jane Smith</td>
                <td className="p-3 border-l-[3px] border-neo-black"><span className="neo-badge neo-badge-normal !text-[9px] neo-blink">ACTIVE</span></td>
                <td className="p-3 text-sm font-bold border-l-[3px] border-neo-black">Current</td>
                <td className="p-3 border-l-[3px] border-neo-black"><button className="font-space text-[10px] uppercase font-bold border-b-2 border-neo-blue text-neo-blue hover:bg-neo-blue hover:text-neo-white px-1">Review Logs →</button></td>
              </tr>
              <tr className="hover:bg-neo-yellow/20 transition-colors">
                <td className="p-3 text-sm font-bold">#PT-1033</td>
                <td className="p-3 font-bold uppercase border-l-[3px] border-neo-black">Mark Evans</td>
                <td className="p-3 border-l-[3px] border-neo-black"><span className="neo-badge neo-badge-exceeded !text-[9px]">WARNING</span></td>
                <td className="p-3 text-sm font-bold border-l-[3px] border-neo-black">Yesterday</td>
                <td className="p-3 border-l-[3px] border-neo-black"><button className="font-space text-[10px] uppercase font-bold border-b-2 border-neo-blue text-neo-blue hover:bg-neo-blue hover:text-neo-white px-1">Review Logs →</button></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
