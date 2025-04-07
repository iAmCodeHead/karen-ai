"use server";

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import OpenAI from 'openai';
import webcrawlerapi from "webcrawlerapi-js";
import { getRandomInterviewCover } from '../utils';
import { db } from "@/firebase/admin";
import { getCurrentUser } from './auth.action';

export async function scrapJobUrl(url: string) {
    console.log(url);
    return {
        success: true,
        message: "Job description has been scrapped successfully!",
    };
}

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
  });
  
  const messages = [
    {
        role: 'system',
        content: "You are a smart recruiter. Users will give you a job description. Your job is to extract the following information: company, role, level (Junior, Mid-level or Senior). If it is a technical role, extract the techstack as well. If it is not a technical role, extract the tools listed in the job description as techstack. return all the extracted information in a json format. Please do not make up any of the information, if you cannot find it, return the value as null. Thanks <3"
    },
  ];

export async function generateJDParamsFromUrl(url:string) {
    try {
        const client = new webcrawlerapi.WebcrawlerClient(
            "a93e980435a265fabc14"
            );

        const response = await client.scrape({
        input: {
            "url": url,
            "prompt": "You are a smart web crawler. Users will give you a web url containing a job description. Your job is to visit the url and extract the following information: company, role, level (Junior, Mid-level or Senior). If it is a technical role, extract the techstack as well and add a property names 'technical' as boolean and set it to 'true'. If it is not a technical role, extract the tools listed in the job description as techstack and return 'technical' as 'false'. return all the extracted information in a json format. Please do not make up any of the information, if you cannot find it, return the value as null. Thanks <3" ,
        },
        crawler_id: "webcrawler/ai",
    })
    console.log(response);

    return response;

    } catch (error) {
        console.log(error);
    }
}

export async function generateInterview(url:string, interviewTypes: string[]) {
  try {

    const user = await getCurrentUser();

    if(!user) throw new Error('Unable to fetch loged in user details!');
    
    const crawedInfo = await generateJDParamsFromUrl(url);

    const interviewParent = {
      jobLink: url,
      companyName: crawedInfo.company,
      role: crawedInfo.role,
      level: crawedInfo.level,
      metadata: JSON.stringify({...crawedInfo, interviewTypes}),
      createdAt: new Date().toISOString(),
      userid: user.id,
      totalInterviewsTaken: 0,
      totalInterviewsGenerated: interviewTypes.length,
    }
  
    const res = await db.collection("interviews_list").add(interviewParent);
  
    const input: InterviewP[] = interviewTypes.map((e) => {
      return {
        type: e,
        role: crawedInfo.role as string,
        level: crawedInfo.level as string,
        techstack: crawedInfo.techstack as string[],
        userid: user.id,
        isTechnical: crawedInfo.isTechnical as boolean,
        interviewListId: res.id,
      }
    });
  
    await Promise.all(input.map(e => prepareInterviewQuestions(e)));
  
    // return Response.json({ success: true }, { status: 200 });
    return {
      success: true,
      message: "Job description has been scrapped successfully!",
  };
  } catch (error) {
    console.error("Error:", error);
    // return Response.json({ success: false, error: error }, { status: 500 });
    return {
      success: false,
      message: "Job description has been scrapped successfully!",
  };
  }
};

export async function generateJDParamsFromTxt(jd: string) {
  try {
    console.log('got called:', jd);
    const prompt = { 
        role: 'user', 
        content: jd, 
    };
    messages.push(prompt)
    console.log('msg', messages.push(prompt), messages);
    const res = await openai.responses.create({
        instructions: messages[0].content,
        input: `Here is a job description: ${jd}`,
        model: 'gpt-4o-mini',
    });

    console.log('reser', res);
  return res;
} catch (e) {
    console.log(e);
}
}

/**
 * after getting company name and all, save to db
 * and pass data to the prepareInterviewQuestions func
 * generate interview questions and tie it to the parent data that was initially created.
 * 
 */

export async function prepareInterviewQuestions(request: InterviewP) {
    const { type, role, level, techstack, userid, isTechnical, interviewListId } = request;
  
    const levelPrompt = level !== null ? `The job experience level is ${level}` : 'Job experice level is unknown, so you are free to curate a mix of questions across all levels';

    const techstackPrompt = isTechnical ? `The tech stack used in the job is: ${techstack.join(", ")}` : `The tools required on the job is: ${techstack.join(", ")}`;

    try {
      const { text: questions } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `Prepare questions for a job interview.
          The job role is ${role}.
          ${levelPrompt}.
          ${techstackPrompt}.
          The focus of the questions should lean towards: ${type}.
          The amount of questions required is a maximum of: five.
          Please return only the questions, without any additional text.
          The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
          Return the questions formatted like this:
          ["Question 1", "Question 2", "Question 3"]
          
          Thank you! <3
      `,
      });
  
      const interview = {
        role: role,
        type: type,
        level: level,
        techstack,
        questions: JSON.parse(questions),
        userId: userid,
        interview_listId: interviewListId,
        finalized: true,
        coverImage: getRandomInterviewCover(),
        createdAt: new Date().toISOString(),
      };
  
      await db.collection("interviews").add(interview);
  
      return Response.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("Error:", error);
      return Response.json({ success: false, error: error }, { status: 500 });
    }
  }