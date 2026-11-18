import React from 'react';
import { Complaint } from '../../types';
import EnhancedGISMapView from '../gis/EnhancedGISMapView';

interface GISMapAdminProps {
  complaints: Complaint[];
  onSelectComplaint: (c: Complaint) => void;
}

export default function GISMapAdmin({ complaints, onSelectComplaint }: GISMapAdminProps) {
  return (
    <EnhancedGISMapView
      complaints={complaints}
      onSelectComplaint={onSelectComplaint}
      isAdminView={true}
    />
  );
}
