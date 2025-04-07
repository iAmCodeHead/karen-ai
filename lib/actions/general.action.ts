"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema, overallFeedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function updateGeneralFeedbackOverview(id: string) {
  // console.log("parent id", id);
  const interviewIds = (await getInterviewsByParentId(id)).map((e) => e.id);

  // console.log("inter view ids", interviewIds);
  const feedbackSnapshot = await db
    .collection("feedback")
    .where("interviewId", "in", interviewIds)
    .get();

  const feedbacks = feedbackSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Feedback[];

  // console.log("feedbackSnapshot x", feedbacks);

  const finalAssessments = feedbacks.map((f) => f.finalAssessment);

  const assessmentSummaries = finalAssessments.join("\n ");

  // console.log("assessmentSummaries", assessmentSummaries);

  const { object } = await generateObject({
    model: google("gemini-2.0-flash-001", {
      structuredOutputs: false,
    }),
    schema: overallFeedbackSchema,
    prompt: `
      You are an AI interviewer analyzing a mock interview. A bunch of interviews have been conducted and here is a list of summaries.
      Transcript:
      ${assessmentSummaries}

      Please generate a general summary from the list of individual summaries provided above.
      `,
    system:
      "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on previously structured categories",
  });

  // console.log("object", object);

  const interviewParentRef = db.collection("interviews_list").doc(id);

  const scores = feedbacks.map((f) => f.totalScore);

  const averageScore =
  scores.reduce((acc, score) => acc + score, 0) / scores.length;

  await interviewParentRef.update({ overallFeedback: object.finalAssessment,
    averageScore,
    totalInterviewsTaken: feedbacks.length
  });
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[]> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsListByUserId(
  userId: string
): Promise<InterviewList[]> {
  const interviews = await db
    .collection("interviews_list")
    .where("userid", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as InterviewList[];
}

export async function getInterviewParentById(
  id: string
): Promise<InterviewList | null> {
  const interviewParent = await db.collection("interviews_list").doc(id).get();

  return { ...interviewParent.data(), id: interviewParent.id } as InterviewList | null;
}

export async function getInterviewsByParentId(parentId: string) {
  const interviews = await db
    .collection("interviews")
    .where("interview_listId", "==", parentId)
    .orderBy("createdAt", "desc")
    .get();
  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewParents(): Promise<InterviewParents[]> {
  return [
    {
      id: "1",
      title: "Frontend Engineer Interviews",
      companyName: "Tech Corp",
      overallFeedback:
        "The interviews focused on modern frontend frameworks, performance optimizations, and best practices.",
      createdAt: "2025-03-31T12:00:00Z",
      children: [
        {
          id: "101",
          role: "Frontend Engineer",
          level: "Junior",
          interview_listId: "",
          questions: [
            "What is React Virtual DOM?",
            "Explain the difference between useState and useEffect.",
            "How would you optimize a React application for performance?",
          ],
          techstack: ["React", "JavaScript", "CSS", "Tailwind"],
          createdAt: "2025-03-30T12:00:00Z",
          userId: "user1",
          type: "technical",
          finalized: true,
        },
        {
          id: "102",
          role: "Frontend Engineer",
          level: "Senior",
          interview_listId: "",
          questions: [
            "How would you architect a large-scale React application?",
            "What are React Server Components?",
            "Explain how React Reconciliation works.",
          ],
          techstack: ["React", "TypeScript", "GraphQL", "Next.js"],
          createdAt: "2025-03-29T15:30:00Z",
          userId: "user2",
          type: "architectural",
          finalized: false,
        },
      ],
    },
    {
      id: "2",
      title: "Backend Engineer Interviews",
      companyName: "Cloud Innovations",
      overallFeedback:
        "The company focused on database scalability, API design, and cloud integration.",
      createdAt: "2025-03-28T10:00:00Z",
      children: [
        {
          id: "201",
          role: "Backend Engineer",
          level: "Mid-Level",
          interview_listId: "",
          questions: [
            "What are the advantages of using NestJS?",
            "Explain the differences between SQL and NoSQL databases.",
            "How does dependency injection work in NestJS?",
          ],
          techstack: ["Node.js", "NestJS", "PostgreSQL", "Redis"],
          createdAt: "2025-03-27T10:00:00Z",
          userId: "user3",
          type: "backend",
          finalized: true,
        },
      ],
    },
    {
      id: "3",
      title: "DevOps Engineer Interviews",
      companyName: "ScaleTech",
      overallFeedback:
        "Deep dive into Kubernetes, CI/CD, and cloud security best practices.",
      createdAt: "2025-03-26T08:45:00Z",
      children: [
        {
          id: "301",
          role: "DevOps Engineer",
          level: "Senior",
          interview_listId: "",
          questions: [
            "Explain Kubernetes architecture and its components.",
            "How would you set up CI/CD for a microservices architecture?",
            "What are the best practices for securing a cloud-based infrastructure?",
          ],
          techstack: ["AWS", "Kubernetes", "Docker", "Terraform"],
          createdAt: "2025-03-25T08:45:00Z",
          userId: "user4",
          type: "infrastructure",
          finalized: true,
        },
      ],
    },
    {
      id: "4",
      title: "Full Stack Engineer Interviews",
      companyName: "InnovateX",
      overallFeedback:
        "Balanced focus on frontend and backend skills, API integrations, and problem-solving.",
      createdAt: "2025-03-24T14:20:00Z",
      children: [
        {
          id: "401",
          role: "Full Stack Engineer",
          level: "Mid-Level",
          interview_listId: "",
          questions: [
            "How do you structure a scalable full-stack application?",
            "What are the differences between REST and GraphQL?",
            "Explain server-side rendering vs. client-side rendering.",
          ],
          techstack: ["React", "Node.js", "Express", "MongoDB"],
          createdAt: "2025-03-23T14:20:00Z",
          userId: "user5",
          type: "fullstack",
          finalized: false,
        },
      ],
    },
    {
      id: "5",
      title: "Data Scientist Interviews",
      companyName: "DataVerse",
      overallFeedback:
        "Emphasis on machine learning, big data processing, and statistical analysis.",
      createdAt: "2025-03-22T09:10:00Z",
      children: [
        {
          id: "501",
          role: "Data Scientist",
          level: "Senior",
          interview_listId: "",
          questions: [
            "Explain the differences between supervised and unsupervised learning.",
            "How would you optimize a machine learning model?",
            "What are common challenges in data cleaning?",
          ],
          techstack: ["Python", "TensorFlow", "Pandas", "SQL"],
          createdAt: "2025-03-21T09:10:00Z",
          userId: "user6",
          type: "datascience",
          finalized: true,
        },
      ],
    },
  ];
}
