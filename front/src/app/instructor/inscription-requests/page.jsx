'use client';

import { useEffect, useState } from 'react';
import HeaderInstructor from '@/components/HeaderInstructor';
import InscriptionRequests from '@/components/InscriptionRequests';

const InscriptionRequestsPage = () => {
  return (
    <>
      <HeaderInstructor />
      <div className="container py-80">
        <div className="row">
          <div className="col-12">
            <InscriptionRequests />
          </div>
        </div>
      </div>
    </>
  );
};

export default InscriptionRequestsPage; 