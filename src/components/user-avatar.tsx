import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    src?: string | null;
    className?: string;
    name?: string;
}

export const UserAvatar = ({
    src,
    className,
    name
}: UserAvatarProps) => {
    return (
        <Avatar className={cn(
            "h-7 w-7 md:h-10 md:w-10",
            className
        )}>
            <AvatarImage src={src || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                {name ? name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
        </Avatar>
    );
}
