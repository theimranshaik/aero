import { useState, useEffect } from 'react';

type FlightArray = [
  string, string | null, string, number | null, number | null, 
  number | null, boolean, number | null, number | null, number | null, ...any[]
];

interface Flight {
  id: string;
  callsign: string;
  country: string;
  altitude: number;
  speed: number;
  heading: number;
}

export default function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Force coordinates to London Heathrow area to check UI layout
  // useEffect(() => {
  //   setCoords({ lat: 51.4700, lon: -0.4543 });
  // }, []);

  // Force coordinates to Rajiv Gandhi International Airport (Hyderabad) to check UI layout
  // useEffect(() => {
  //   setCoords({ lat: 17.2403, lon: 78.4294 });
  // }, []);
  
  // 1. Get Home Coordinates (UNCOMMENT FOR PRODUCTION USE)
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GEOLOCATION_NOT_SUPPORTED");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        // Fallback to London Heathrow area if location is denied
        setCoords({ lat: 51.4700, lon: -0.4543 });
      }
    );
  }, []);

  // 2. Poll Authenticated OpenSky API
  useEffect(() => {
    if (!coords) return;

    const fetchFlights = async () => {
      const offset = 3; // Covers roughly a 200 km radius
      // const offset = 4.0; // Expands the radius dramatically across the region
      const lamin = coords.lat - offset;
      const lamax = coords.lat + offset;
      const lomin = coords.lon - offset;
      const lomax = coords.lon + offset;

      // Pull credentials from your .env.local file
      const username = import.meta.env.VITE_OPENSKY_USERNAME;
      const password = import.meta.env.VITE_OPENSKY_PASSWORD;

      // Construct Basic Auth Header
      const headers: HeadersInit = {};
      if (username && password) {
        const credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }

      try {
        const response = await fetch(
          `/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`,
          { headers }
        );
        
        if (response.status === 429) {
          throw new Error("RATE_LIMIT_EXCEEDED_TRY_LATER");
        }
        if (!response.ok) {
          throw new Error("SERVER_ERROR");
        }
        
        const data = await response.json();
        
        if (!data.states) {
          setFlights([]);
          setLoading(false);
          return;
        }

        const mappedFlights: Flight[] = data.states.map((f: FlightArray) => ({
          id: f[0],
          callsign: f[1]?.trim() || "N/A",
          country: f[2],
          altitude: f[7] ? Math.round(f[7] * 3.28084) : 0, // Meters to Feet
          speed: f[9] ? Math.round(f[9] * 1.94384) : 0,    // M/S to Knots
          heading: f[10] ? Math.round(f[10]) : 0,
        }));

        setFlights(mappedFlights);
        setError(null);
      } catch (err: any) {
        setError(err.message || "FAILED_TO_FETCH");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 15000); // Polls every 15 seconds

    return () => clearInterval(interval);
  }, [coords]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#111111] font-sans antialiased p-8 md:p-24 selection:bg-black selection:text-white">
      {/* Swiss Header Grid */}
      <header className="grid grid-cols-1 md:grid-cols-3 gap-8 items-baseline border-b-2 border-black pb-12 mb-16">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter m-0 uppercase leading-none">
          Aero.
        </h1>
        <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 self-end">
          {coords ? `${coords.lat.toFixed(4)}°N // ${coords.lon.toFixed(4)}°E` : "LOCATING..."}
        </div>
        <div className="text-right text-sm font-medium max-w-xs justify-self-start md:justify-self-end self-end">
          Real-time overhead airspace tracking. Minimal telemetry data updated every 15 seconds.
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {loading && (
          <div className="text-3xl font-bold tracking-tight animate-pulse uppercase">
            Scanning skies...
          </div>
        )}

        {error && (
          <div className="font-mono text-xs text-red-600 uppercase tracking-wider">
            Error // {error}
          </div>
        )}

        {!loading && !error && flights.length === 0 && (
          <div className="py-20 text-center border border-dashed border-neutral-300">
            <p className="text-xl font-medium text-neutral-400 uppercase tracking-tight">
              Airspace clear overhead
            </p>
          </div>
        )}

        {flights.length > 0 && (
          <div className="grid grid-cols-1 gap-y-12">
            <div className="hidden md:grid grid-cols-5 text-xs font-mono uppercase tracking-widest text-neutral-400 pb-2 border-b border-neutral-200">
              <div>Ident / Callsign</div>
              <div>Origin Country</div>
              <div>Altitude (FT)</div>
              <div>Speed (KT)</div>
              <div>Heading</div>
            </div>

            <div className="divide-y divide-neutral-200">
              {flights.map((flight) => (
                <div 
                  key={flight.id} 
                  className="grid grid-cols-2 md:grid-cols-5 gap-y-2 md:gap-y-0 py-6 items-baseline transition-colors hover:bg-neutral-50 px-2"
                >
                  <div className="text-3xl font-black tracking-tight col-span-2 md:col-span-1">
                    {flight.callsign}
                  </div>
                  
                  <div className="text-sm font-medium text-neutral-600 md:text-black">
                    <span className="md:hidden text-xs font-mono text-neutral-400 block uppercase">Country</span>
                    {flight.country}
                  </div>
                  
                  <div className="text-lg md:text-xl font-bold tracking-tight font-mono">
                    <span className="md:hidden text-xs font-mono text-neutral-400 block uppercase">Altitude</span>
                    {flight.altitude.toLocaleString()}
                  </div>
                  
                  <div className="text-lg md:text-xl font-bold tracking-tight font-mono">
                    <span className="md:hidden text-xs font-mono text-neutral-400 block uppercase">Speed</span>
                    {flight.speed}
                  </div>
                  
                  <div className="text-sm font-mono text-neutral-500 md:text-black">
                    <span className="md:hidden text-xs font-mono text-neutral-400 block uppercase">Heading</span>
                    {flight.heading}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-32 pt-6 border-t border-neutral-200 flex justify-between text-xs font-mono text-neutral-400 uppercase">
        <div>Data: OpenSky Network</div>
        <div>Count: {flights.length} Traffic Objects</div>
      </footer>
    </div>
  );
}