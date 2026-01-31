import { Check } from "lucide-react";

interface Step {
    id: number;
    label: string;
    key: string;
}

interface ProgressStepsProps {
    steps: Step[];
    currentStep: number;
}

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
    return (
        <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${step.id <= currentStep
                                ? "bg-primary text-white"
                                : "bg-border text-text-muted"
                            }`}
                    >
                        {step.id < currentStep ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            step.id
                        )}
                    </div>
                    <span
                        className={`hidden sm:block font-medium transition-colors ${step.id <= currentStep ? "text-foreground" : "text-text-muted"
                            }`}
                    >
                        {step.label}
                    </span>
                    {index < steps.length - 1 && (
                        <div
                            className={`w-12 sm:w-24 h-0.5 mx-2 transition-colors ${step.id < currentStep ? "bg-primary" : "bg-border"
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
