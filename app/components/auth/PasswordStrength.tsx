"use client";

interface PasswordStrengthProps {
    password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const getPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[a-z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;
        return strength;
    };

    const strength = getPasswordStrength(password);
    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = ["", "bg-error", "bg-warning", "bg-warning", "bg-success", "bg-success"];

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${level <= strength ? colors[strength] : "bg-border"
                            }`}
                    />
                ))}
            </div>
            <p
                className={`text-xs ${strength >= 4 ? "text-success" : strength >= 2 ? "text-warning" : "text-error"
                    }`}
            >
                {labels[strength]} password
            </p>
        </div>
    );
}
