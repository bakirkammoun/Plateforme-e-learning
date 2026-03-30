import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import EventsList from '../../components/Dashboard/EventsList';

const Events = () => {
  return (
    <>
      <Breadcrumb pageName="Événements" />
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <EventsList />
      </div>
    </>
  );
};

export default Events; 