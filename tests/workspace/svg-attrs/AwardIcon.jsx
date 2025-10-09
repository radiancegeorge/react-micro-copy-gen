import React from 'react';
export const AwardIcon = ({ width, height, fill, onClick }) => {
  return (
    <svg
      onClick={onClick}
      width={width || '24'}
      height={height || '25'}
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.25781 11.2011V16.1711C4.25781 17.9911 4.25781 17.9911 5.97781 19.1511L10.7078 21.8811C11.4178 22.2911 12.5778 22.2911 13.2878 21.8811L18.0178 19.1511C19.7378 17.9911 19.7378 17.9911 19.7378 16.1711V11.2011C19.7378 9.38109 19.7378 9.38109 18.0178 8.22109L13.2878 5.49109C12.5778 5.08109 11.4178 5.08109 10.7078 5.49109L5.97781 8.22109C4.25781 9.38109 4.25781 9.38109 4.25781 11.2011Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 7.80969V5.17969C17.5 3.17969 16.5 2.17969 14.5 2.17969H9.5C7.5 2.17969 6.5 3.17969 6.5 5.17969V7.73969"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
export default AwardIcon;
