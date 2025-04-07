import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const InterviewList = ({
    id,
    role,
    companyName,
    overallFeedback,
    averageScore,
    totalInterviewsGenerated,
    totalInterviewsTaken,
    createdAt,
}: Partial<InterviewList>) => {
  return (
    <div className="w-full max-sm:w-full min-h-36 shadow-lg rounded-2xl card-interview-list flex flex-col justify-between">
        <Link href={`interview-list/${id}`}>
              {/* Title Section */}
                <h3 className="mt-5 capitalize">{ role } - { companyName }</h3>

            <p className="line-clamp-2 mt-2">
                { overallFeedback || "You haven't taken this interview yet. Take it now to improve your skills."}
            </p>
            {/* Lower Section */}
            <div className="flex justify-between items-center text-gray-600 text-sm mt-4">
            {/* Date (Left) */}
            <div className="flex flex-row gap-2">
                <Image
                src="/calendar.svg"
                width={22}
                height={22}
                alt="calendar"
                />
                <p>{ dayjs(createdAt).format("MMM D, YYYY") }</p>
            </div>
            {/* <span className="text-gray-500">Mar 31, 2025</span> */}

            {/* Score (Center) */}
            <div className="flex flex-row gap-2 items-center">
                <Image src="/star.svg" width={22} height={22} alt="star" />
                <p>{ averageScore ?? '--' }/100</p>
            </div>
            {/* <span className="text-lg font-bold text-blue-600">85/100</span> */}

            {/* Progress Status (Right) */}
            <p>
(                { totalInterviewsTaken } / {  totalInterviewsGenerated })
            </p>
            <div className="flex flex-row gap-2 items-center w-25 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full w-0" style={{ width: (totalInterviewsTaken! / totalInterviewsGenerated!) * 100 }}></div>
            </div>
            {/* <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded-lg">
            Completed
            </span> */}
            </div>
        </Link>
    </div>
  );
};

export default InterviewList;
