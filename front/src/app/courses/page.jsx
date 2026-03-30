'use client';

import CourseAllOne from "@/components/CourseAllOne";
import PageBanner from "@/components/PageBanner";

const CoursesGridView = () => {
  return (
    <>
      <PageBanner
        title="Nos Formations"
        pageName="Formations"
        bannerImage="/assets/images/banner-img.jpg"
      />
      <CourseAllOne />
    </>
  );
};

export default CoursesGridView; 