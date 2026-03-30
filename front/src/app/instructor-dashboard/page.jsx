'use client';

import { useEffect, useState } from 'react';
import SupervisedStudents from '@/components/SupervisedStudents';
import HeaderInstructor from '@/components/Header';

const InstructorDashboard = () => {
  return (
    <>
      <HeaderInstructor />
      <main className="bg-light min-vh-100">
        <div className="container py-80">
          <div className="row">
            <div className="col-12">
              <h1 className="mb-4">Tableau de bord de l'instructeur</h1>
              <SupervisedStudents />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default InstructorDashboard; 