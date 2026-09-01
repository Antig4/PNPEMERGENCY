import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { LiveGISMap } from '../components/LiveGISMap';
import { IncidentDetailModal } from '../components/IncidentDetailModal';
import { incidentService } from '../services/incidentService';
import { patrolService } from '../services/patrolService';
import { stationService } from '../services/stationService';
import { Incident, PatrolOfficer, PoliceStation } from '../types';

export const LiveMap: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMapData();
    const interval = setInterval(loadMapData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadMapData = async () => {
    setIsLoading(true);
    try {
      const [incList, patList, stnList] = await Promise.all([
        incidentService.getIncidents(),
        patrolService.getPatrols(),
        stationService.getStations(),
      ]);
      setIncidents(incList);
      setPatrols(patList);
      setStations(stnList);
    } catch (e) {
      console.warn('LiveMap fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Full Screen Live GIS Map"
        subtitle="Real-time Geographic Spatial Monitoring & Patrol Navigation Tracks"
        onRefresh={loadMapData}
        isRefreshing={isLoading}
      />

      <div className="flex-1 p-6 overflow-hidden">
        <LiveGISMap
          incidents={incidents}
          patrols={patrols}
          stations={stations}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          enableHeatmap={true}
        />
      </div>

      <IncidentDetailModal
        incident={selectedIncident}
        patrols={patrols}
        stations={stations}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={loadMapData}
        onVerify={async (id) => {
          await incidentService.verifyIncident(id);
        }}
        onCancel={async (id, reason) => {
          await incidentService.cancelIncident(id, reason);
        }}
        onReassign={async (id, patrolId, reason) => {
          await incidentService.reassignIncident(id, patrolId, reason);
        }}
        onRequestAssistance={async (id, stationId, notes) => {
          await incidentService.requestAssistance(id, stationId, notes);
        }}
      />
    </div>
  );
};
