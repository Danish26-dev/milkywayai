import React, { useEffect, useState } from 'react';
import {
  Building2,
  MapPin,
  Scale,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { facilityVehicleService } from '../../services';
import { Facility } from '../../types/models';

export const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await facilityVehicleService.getFacilities();
        setFacilities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#26352D]" />
            <h1 className="text-2xl font-bold font-sans text-[#202521]">
              Registered Dairy Facilities
            </h1>
          </div>
          <p className="text-xs text-[#202521]/70 mt-1 font-normal">
            Collection centers, chilling hubs, processing units, and packaging depots across the jurisdiction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((fac) => {
          const isFlagged = fac.status === 'FLAGGED' || fac.status === 'INSPECTION_PENDING';
          return (
            <div
              key={fac.id}
              className={`bg-[#FFFDF7] p-5 rounded-xl border shadow-xs transition-all ${
                isFlagged ? 'border-[#9E4939]/40' : 'border-[#202521]/15'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#66734A] uppercase tracking-wider font-bold block">
                    {fac.type.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-base font-bold text-[#202521] font-sans">
                    {fac.name}
                  </h3>
                  <span className="text-xs font-mono text-[#202521]/60">
                    Code: {fac.code} • {fac.district}, {fac.state}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    fac.status === 'FLAGGED'
                      ? 'bg-[#9E4939] text-[#FFFDF7]'
                      : fac.status === 'INSPECTION_PENDING'
                      ? 'bg-[#B78632] text-[#FFFDF7]'
                      : 'bg-[#66734A]/10 text-[#66734A]'
                  }`}
                >
                  {fac.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#202521]/10 text-xs font-mono">
                <div>
                  <span className="text-[#202521]/60 block text-[10px]">Daily Capacity</span>
                  <span className="font-bold text-[#202521]">{fac.dailyCapacityLitres.toLocaleString()} L</span>
                </div>
                <div>
                  <span className="text-[#202521]/60 block text-[10px]">Current Intake</span>
                  <span className="font-bold text-[#202521]">{fac.currentIntakeLitres.toLocaleString()} L</span>
                </div>
                <div>
                  <span className="text-[#202521]/60 block text-[10px]">Active Batches</span>
                  <span className="font-bold text-[#202521]">{fac.activeBatchCount}</span>
                </div>
                <div>
                  <span className="text-[#202521]/60 block text-[10px]">Anomaly Rate</span>
                  <span className={`font-bold ${fac.historicalAnomalyRatePercent > 3 ? 'text-[#9E4939]' : 'text-[#66734A]'}`}>
                    {fac.historicalAnomalyRatePercent}%
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
