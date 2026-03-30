'use client';

import { Suspense } from 'react';
import CVView from '@/components/cv/CVView';

const CVViewPage = ({ params }) => {
  console.log('CVViewPage rendered with params:', params);

  if (!params?.cvId) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        ID du CV manquant
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    }>
      <CVView cvId={params.cvId} />
    </Suspense>
  );
};

export default CVViewPage; 