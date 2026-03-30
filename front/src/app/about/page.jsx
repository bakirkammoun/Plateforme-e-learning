import AboutTwo from "@/components/AboutTwo";
import Breadcrumb from "@/components/Breadcrumb";
import CertificateTwo from "@/components/CertificateTwo";
import FeaturesTwo from "@/components/FeaturesTwo";
import FooterThree from "@/components/FooterThree";
import HeaderOne from "@/components/Header";
import InfoSectionOne from "@/components/InfoSectionOne";
import JoinCommunityOne from "@/components/JoinCommunityOne";
import TestimonialsTwo from "@/components/TestimonialsTwo";

export const metadata = {
  title: "Smartech - LMS, Tutors, Education & Online Course NEXT JS Template",
  description:
    "Smartech is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It’s the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you’re offering online courses, running a tutoring platform, or managing an educational website, Smartech provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

const page = () => {
  return (
    <>
   

      {/* HeaderTwo */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"About Us 02"} />

      {/* FeaturesTwo */}
      <FeaturesTwo />

      {/* InfoSectionOne */}
      <InfoSectionOne />

      {/* AboutTwo */}
      <AboutTwo />

      {/* CertificateTwo */}
      <CertificateTwo />

      {/* JoinCommunityOne */}
      <JoinCommunityOne />

    

      {/* FooterThree */}
      <FooterThree />
    </>
  );
};

export default page;
