import React, { useEffect, useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { facilityVehicleService } from '../../services';
import { Vehicle } from '../../types/models';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const v = await facilityVehicleService.getVehicles();
        setVehicles(v);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#26352D]" />
          <h1 className="text-2xl font-bold font-sans text-[#202521]">
            Milk Tankers & GPS Transit
          </h1>
        </div>
        <p className="text-xs text-[#202521]/70 mt-1 font-normal">
          Active insulated road tankers, temperature monitor telemetry, and highway route velocity compliance.
        </p>
      </div>

      <div className="space-y-3">
        {vehicles.map((veh) => {
          const inTransit = veh.currentStatus === 'IN_TRANSIT';
          return (
            <div
              key={veh.id}
              className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base font-mono text-[#202521]">
                    {veh.registrationNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      inTransit
                        ? 'bg-[#66734A] text-[#FFFDF7]'
                        : veh.currentStatus === 'DISCHARGING'
                        ? 'bg-[#B78632] text-[#FFFDF7]'
                        : 'bg-[#F4F1E8] text-[#202521]'
                    }`}
                  >
                    {veh.currentStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#202521]/60 mt-1">
                  Tanker Capacity: {veh.tankerCapacityLitres.toLocaleString()} L • Last ping: {new Date(veh.lastPingTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {veh.assignedRoute && (
                  <div className="text-xs text-[#202521]/80 mt-2 font-mono flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-[#66734A]" />
                    <span>Route: <strong>{veh.assignedRoute.originFacilityId}</strong> → <strong>{veh.assignedRoute.destinationFacilityId}</strong> ({veh.assignedRoute.distanceKm} km, ~{veh.assignedRoute.expectedTransitDurationMinutes}m)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-[#202521]/60 block">Sensors</span>
                  <span className={veh.temperatureSensorActive ? 'text-[#66734A] font-bold' : 'text-[#9E4939] font-bold'}>
                    {veh.temperatureSensorActive ? 'Temp Active (4.2°C)' : 'Temp Sensor Fault'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#202521]/60 block">GPS Telemetry</span>
                  <span className={veh.gpsTrackerActive ? 'text-[#66734A] font-bold' : 'text-[#9E4939] font-bold'}>
                    {veh.gpsTrackerActive ? 'Tracked' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
