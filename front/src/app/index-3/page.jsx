
import BannerOne from "@/components/BannerOne";
import BlogOne from "@/components/BlogOne";
import CertificateOne from "@/components/CertificateOne";
import CounterOne from "@/components/CounterOne";
import ExploreCourseOne from "@/components/ExploreCourseOne";
import FeaturesOne from "@/components/FeaturesOne";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/Header";
import InstructorOne from "@/components/InstructorOne copy";
import TestimonialsOne from "@/components/TestimonialsOne";

export const metadata = {
  title: "EduAll - LMS, Tutors, Education & Online Course NEXT JS Template",
  description:
    "EduAll is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It’s the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you’re offering online courses, running a tutoring platform, or managing an educational website, EduAll provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

const page = () => {
  return (
    <>
      {/* HeaderOne */}
      <HeaderOne />

     
      {/* BannerOne */}
      <BannerOne />


      {/* FeaturesOne */}
      <FeaturesOne />

      {/* ExploreCourseOne */}
      <ExploreCourseOne />

     

      {/* InstructorOne */}
      <InstructorOne copy />

  

      {/* CounterOne */}
      <CounterOne />

      {/* TestimonialsOne */}
      <TestimonialsOne />

      {/* BlogOne */}
      <BlogOne />

      {/* CertificateOne */}
      <CertificateOne />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default page;
