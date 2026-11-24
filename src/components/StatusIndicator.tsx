import React from 'react';
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { DonationStatus, RequestStatus } from '../types/foodbridge';

interface DonationStatusProps {
  status: DonationStatus;
}

export const DonationStatusLabel: React.FC<DonationStatusProps> = ({ status }) => {
  switch (status) {
    case 'Available':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Available</span>
        </span>
      );
    case 'Pending Approval':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Pending Approval</span>
        </span>
      );
    case 'Requested':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Requested</span>
        </span>
      );
    case 'In Transit':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] whitespace-nowrap">
          <Truck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>In Transit</span>
        </span>
      );
    case 'Delivered':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] whitespace-nowrap">
          <PackageCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Delivered</span>
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Rejected</span>
        </span>
      );
  }
};

interface RequestStatusProps {
  status: RequestStatus;
}

export const RequestStatusLabel: React.FC<RequestStatusProps> = ({ status }) => {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Pending Review</span>
        </span>
      );
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Approved</span>
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] whitespace-nowrap">
          <PackageCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Completed</span>
        </span>
      );
    case 'Declined':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Declined</span>
        </span>
      );
  }
};
