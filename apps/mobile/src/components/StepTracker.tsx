"use client";

import type { PositionStep } from "@/lib/lifi";

interface StepTrackerProps {
  steps: PositionStep[];
}

function StepIcon({ status }: { status: PositionStep["status"] }) {
  if (status === "complete") {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 animate-pulse">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
        <div className="w-3 h-3 rounded-full bg-white" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  // pending
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
    </div>
  );
}

export function StepTracker({ steps }: StepTrackerProps) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Vertical line + icon */}
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {i < steps.length - 1 && (
              <div
                className={`w-0.5 h-8 ${
                  step.status === "complete"
                    ? "bg-emerald-300"
                    : step.status === "verifying"
                    ? "bg-violet-300"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>

          {/* Label + optional link/message */}
          <div className="pt-1 pb-3 min-w-0">
            <span
              className={`text-sm font-semibold block ${
                step.status === "verifying"
                  ? "text-violet-600"
                  : step.status === "active"
                  ? "text-blue-600"
                  : step.status === "complete"
                  ? "text-emerald-600"
                  : step.status === "error"
                  ? "text-red-600"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>

            {step.txLink && (
              <a
                href={step.txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 underline"
              >
                View tx
              </a>
            )}

            {step.status === "error" && step.message && (
              <span className="text-xs text-red-500 block mt-0.5">
                {step.message}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
