"use client";

/**
 * DeployProgress Component
 *
 * Shows the progress through the 2-step deployment flow.
 */

import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeployStepState, DeployStepId } from "@/lib/deploy/types";


interface DeployProgressProps {
  steps: DeployStepState[];
  currentStep: DeployStepId;
}

// Step Labels

const STEP_LABELS: Record<DeployStepId, string> = {
  "vercel-deploy": "deploy to vercel",
};


export const DeployProgress = ({ steps, currentStep }: DeployProgressProps) => {
  return (
    <div className="space-y-3" role="list" aria-label="Deployment progress">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.status === "completed";
        const isError = step.status === "error";
        const isPending = step.status === "pending";
        const isInProgress = step.status === "in-progress";

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 text-sm",
              isActive && "font-semibold",
              isPending && "text-muted-foreground"
            )}
            role="listitem"
            aria-current={isActive ? "step" : undefined}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {isCompleted && (
                <Check
                  className="w-4 h-4 text-green-600"
                  aria-label="Completed"
                />
              )}
              {isInProgress && (
                <Loader2
                  className="w-4 h-4 animate-spin"
                  aria-label="In progress"
                />
              )}
              {isError && (
                <Circle
                  className="w-4 h-4 text-red-600 fill-red-600"
                  aria-label="Error"
                />
              )}
              {isPending && (
                <Circle
                  className="w-4 h-4 text-muted-foreground"
                  aria-label="Pending"
                />
              )}
            </div>

            {/* Step Label */}
            <span
              className={cn(
                isError && "text-red-600",
                isCompleted && "text-muted-foreground"
              )}
            >
              {STEP_LABELS[step.id]}
            </span>

            {/* Error Message */}
            {isError && step.error && (
              <span className="text-xs text-red-600 ml-auto">
                {step.error}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DeployProgress;
