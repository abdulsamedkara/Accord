"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function RegisterForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email: email || undefined, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            router.push("/");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-[hsl(var(--card))] rounded-lg p-8 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                            Email
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-[hsl(var(--input))] border-none"
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                            Username <span className="text-red-400">*</span>
                        </label>
                        <Input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-[hsl(var(--input))] border-none"
                            required
                            minLength={3}
                            maxLength={32}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                            Password <span className="text-red-400">*</span>
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-[hsl(var(--input))] border-none"
                            required
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="discord"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating account..." : "Continue"}
                    </Button>

                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[hsl(var(--primary))] hover:underline">
                            Log In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
