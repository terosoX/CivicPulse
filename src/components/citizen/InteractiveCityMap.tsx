import React from 'react';
import { Complaint } from '../../types';
import EnhancedGISMapView from '../gis/EnhancedGISMapView';

interface InteractiveCityMapProps {
  complaints: Complaint[];
  onSelectComplaint: (c: Complaint) => void;
}

export default function InteractiveCityMap({ complaints, onSelectComplaint }: InteractiveCityMapProps) {
  return (
    <EnhancedGISMapView
      complaints={complaints}
      onSelectComplaint={onSelectComplaint}
      isAdminView={false}
    />
  );
}
