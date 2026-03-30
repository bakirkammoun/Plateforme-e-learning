"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const RouteScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const progressPath = document.querySelector(".progress-wrap path");
    const pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "none";
    progressPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 10ms linear";

    const updateProgress = () => {
      const scroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = pathLength - (scroll * pathLength) / height;
      progressPath.style.strokeDashoffset = progress;
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);

    const handleScroll = () => {
      const progressWrap = document.querySelector(".progress-wrap");
      if (progressWrap) {
        if (window.scrollY > 50) {
          progressWrap.classList.add("active-progress");
        } else {
          progressWrap.classList.remove("active-progress");
        }
      }
    };

    const handleClick = (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    const progressWrap = document.querySelector(".progress-wrap");
    if (progressWrap) {
      window.addEventListener("scroll", handleScroll);
      progressWrap.addEventListener("click", handleClick);
    }

    return () => {
      const progressWrap = document.querySelector(".progress-wrap");
      if (progressWrap) {
        window.removeEventListener("scroll", handleScroll);
        progressWrap.removeEventListener("click", handleClick);
      }
    };
  }, []);

  return (
    <>
      <div className='progress-wrap'>
        <svg
          className='progress-circle svg-content'
          width='100%'
          height='100%'
          viewBox='-1 -1 102 102'
        >
          <path d='M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98' />
        </svg>
      </div>
    </>
  );
};

export default RouteScrollToTop;
