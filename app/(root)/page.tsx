import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getInterviewsListByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";
import InterviewList from "@/components/InterviewList";

async function Home() {
  
  const user = await getCurrentUser();

  let hasPastInterviews = false;
  let hasUpcomingInterviews = false;
  let userInterviews: Interview[] = [];
  let allInterview: Interview[] = [];
  let interviewlists: InterviewList[] = [];

  if (user) {
    const [uI, aI, pIs] = await Promise.all([
      getInterviewsByUserId(user.id),
      getLatestInterviews({ userId: user.id }),
      getInterviewsListByUserId(user.id),
    ]);
    userInterviews = uI;
    allInterview = aI;
    interviewlists = pIs;
  }

  hasPastInterviews = userInterviews.length > 0;
  hasUpcomingInterviews = allInterview.length > 0;

  console.log(hasPastInterviews, hasUpcomingInterviews, interviewlists);

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Create Mock Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <h2>Your Interviews</h2>
          { interviewlists.length ?
              interviewlists.map((each) => (
                <InterviewList 
                  key={each.id}
                  id={each.id}
                  role={each.role}
                  companyName={each.companyName}
                  overallFeedback={each.overallFeedback}
                  averageScore={each.averageScore}
                  totalInterviewsGenerated={each.totalInterviewsGenerated}
                  totalInterviewsTaken={each.totalInterviewsTaken}
                  createdAt={each.createdAt}
                />
              ))
              :
              <p>You do not have any interviews!</p>
            }

      {/* <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>
        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section> */}

      {/* <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            allInterview?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section> */}
    </>
  );
}

export default Home;
