import * as React from "react";
import { cn } from "../utils/cn";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import Input from "./ui/emailform/Input";
import Label from "./ui/emailform/Label";
import TextArea from "./ui/emailform/TextArea";

type Payload = { name: string; email: string; description: string };
type Status = "idle" | "sending" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Posts to the Google Apps Script webhook (Sheet row + thank-you email).
// Never throws: the Firestore save must not depend on it.
async function sendToSheet(payload: Payload): Promise<void> {
  const url = import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Sheet webhook failed: ", err);
  }
}

export function EmailForm() {
  const [fullName, setFullName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    const payload: Payload = {
      name: fullName.trim(),
      email: email.trim(),
      description: description.trim(),
    };

    if (!payload.name || !payload.email || !payload.description) {
      setStatus("error");
      setMessage("Please fill in all fields.");
      return;
    }
    if (!EMAIL_RE.test(payload.email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      await addDoc(collection(db, "MyRequestData"), payload);
    } catch (err) {
      console.error("Error adding document: ", err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return;
    }

    await sendToSheet(payload);
    setStatus("success");
    setMessage("Thanks! Your message was sent. Check your inbox for a confirmation.");
    setFullName("");
    setEmail("");
    setDescription("");
  };
  
  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-black/50 my-4">
      <h2 className="font-bold text-xl text-neutral-200 headingStyle text-center">
        Have you any project on your mind?
      </h2>
      <p className="text-sm max-w-sm mt-2 text-center text-neutral-300">
        Fill the below form &amp; drop your query. I will cotact you ASAP!
      </p>

      <form
        className="my-8 flex flex-col gap-4 justify-center"
        onSubmit={handleSubmit}
      >
        <LabelInputContainer className="mb-4">
          <Label htmlFor="firstname">Full name</Label>
          <Input
            id="firstname"
            placeholder="Tyler"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="projectmayhem@fc.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="description">
            Give a small decription about your project
          </Label>
          <TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </LabelInputContainer>

        <button
          className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          type="submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : <>Submit &rarr;</>}
          <BottomGradient />
        </button>

        {message && (
          <p
            role="status"
            className={cn(
              "text-sm text-center",
              status === "success" ? "text-green-400" : "text-red-400"
            )}
          >
            {message}
          </p>
        )}

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
