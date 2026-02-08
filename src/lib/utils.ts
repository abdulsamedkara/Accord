import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function generateInviteCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return `Today at ${date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })}`;
    } else if (days === 1) {
        return `Yesterday at ${date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })}`;
    } else {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }
}

export function getAvatarUrl(avatar: string | null | undefined, username: string): string {
    if (avatar) return avatar;
    // Generate a consistent color based on username
    const colors = [
        "5865F2", // Discord Blurple
        "57F287", // Green
        "FEE75C", // Yellow
        "EB459E", // Fuchsia
        "ED4245", // Red
    ];
    const colorIndex = username.charCodeAt(0) % colors.length;
    const initial = username.charAt(0).toUpperCase();

    // Return a placeholder with initial
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" fill="#${colors[colorIndex]}"/>
      <text x="50%" y="50%" dy=".1em" fill="white" font-family="Arial" font-size="64" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`
    )}`;
}
