'use client';

import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/Header";
import TutorDetails from "@/components/TutorDetails";
import Animation from "@/helper/Animation";

const CVContent = () => {
  return (
    <>
      {/* Animation */}
      <Animation />

      {/* Header */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"My CV"} />

      {/* TutorDetails */}
      <TutorDetails />

      {/* Footer */}
      <FooterOne />
    </>
  );
};

export default CVContent; 