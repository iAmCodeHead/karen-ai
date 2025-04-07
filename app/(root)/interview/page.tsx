"use client";

// import Agent from "@/components/Agent";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  generateInterview,
} from "@/lib/actions/interview.action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// const jdFormSchema = () => {
//   return z.object({
//     url: z.string().url(),
//   });
// };

const INTERVIEW_TYPES = [
  "Technical",
  "Behavioral",
  "System Design",
  "Culture Fit",
];

const formSchema = z
  .object({
    jobLink: z.string().optional(),
    jobDescription: z.string().optional(),
    interviewTypes: z
      .array(z.string())
      .min(1, "Please select at least one interview type."),
  })
  .refine((data) => data.jobLink || data.jobDescription, {
    message: "You must provide either a job link or a job description.",
    path: ["jobLink"],
  });

const InterviewListForm = () => {
  const router = useRouter();

  // const formSchema = jdFormSchema();
  // const form = useForm<z.infer<typeof formSchema>>({
  //   resolver: zodResolver(formSchema),
  //   defaultValues: {
  //     url: "",
  //   },
  // });


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interviewTypes: [],
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const { jobLink, jobDescription, interviewTypes } = data;

      if (jobLink) {
        console.log("about to call:");
        const result = await generateInterview(jobLink, interviewTypes);
        console.log(jobLink, interviewTypes, result);
        if (!result.success) {
          toast.error(result.message);
          return;
        }
      }

      if (jobDescription) {
        console.log("jobDescription", jobDescription);
        // const res = await generateJDParamsFromTxt(jobDescription);
        // console.log("res", res);
        // const result = await scrapJobUrl(jobDescription);

        // if (!result.success) {
        //   toast.error(result.message);
        //   return;
        // }
      }

      toast.success(
        "Congratulations! Your interview has been prepared successfully"
      );
      router.push("/");
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  };

  const onError = () => {
    // Display the first available error message in a toast
    const errorMessage =
      errors.jobLink?.message || errors.jobDescription?.message || errors.interviewTypes?.message;
    if (errorMessage) {
      toast.error(errorMessage);
    }
  };
  return (
    <>
      <h3>Interview generation</h3>
      <h6>
        Provide a link to the job or paste the job description below to help
        Karen prepare some mock interview questions for you!
      </h6>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
        {/* Job Link Input */}
        <div>
          <label className="label">Job Link (Optional)</label>
          <input
            type="url"
            {...register("jobLink")}
            placeholder="Paste the job link here..."
            className="
            selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
            focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
            aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive mt-2
            "
          />
        </div>

        <h1 className="justify-items-center">OR</h1>
        {/* Job Description Textarea */}
        <div>
          <label className="label">Job Description (Optional)</label>
          <textarea
            {...register("jobDescription")}
            placeholder="Paste the job description here..."
            className="
            file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground 
              w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] h-40 resize-none mt-2
              aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
               dark:bg-input/30 border-input flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
            "
          />
        </div>

        <div>
          <legend className="label">
            What type interviews do you want to prepare for?
          </legend>

          <div className="flex justify-between mt-2">
            {INTERVIEW_TYPES.map((type) => (
              <div key={type} className="flex items-center mb-4">
                <input
                  id="default-checkbox"
                  type="checkbox"
                  value={type}
                  {...register("interviewTypes")}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button className="btn-secondary flex-1">
            <Link href="/" className="flex w-full justify-center">
              <p className="text-sm font-semibold text-primary-200 text-center">
                Back to dashboard
              </p>
            </Link>
          </Button>
          <div className="w-4"></div>
          <Button className="btn-primary flex-1" type="submit">
            Generate Interview
          </Button>
        </div>
      </form>

      {/* <Agent
        userName={user?.name!}
        userId={user?.id}
        profileImage={user?.profileURL}
        type="generate"
      /> */}
    </>
  );
};

export default InterviewListForm;
