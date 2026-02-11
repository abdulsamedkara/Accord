import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface ServerIdPageProps {
    params: {
        serverId: string;
    }
};

const ServerIdPage = async ({
    params
}: ServerIdPageProps) => {
    const profile = await getCurrentUser();

    if (!profile) {
        return redirect("/login");
    }

    const server = await db.server.findUnique({
        where: {
            id: params.serverId,
            members: {
                some: {
                    userId: profile.id
                }
            }
        },
        include: {
            channels: {
                where: {
                    name: "general"
                },
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });

    const initialChannel = server?.channels[0];

    if (initialChannel?.name !== "general") {
        // If no general channel, try to find any channel
        const anyChannel = await db.channel.findFirst({
            where: {
                serverId: params.serverId
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        if (anyChannel) {
            return redirect(`/servers/${params.serverId}/channels/${anyChannel.id}`);
        }

        return null;
    }

    return redirect(`/servers/${params.serverId}/channels/${initialChannel.id}`);
}

export default ServerIdPage;
