import { createClient, RedisClientType } from "redis";

let redis: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
    if (!redis) {
        redis = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
        });

        redis.on("error", (err) => console.error("Redis Client Error:", err));
        redis.on("connect", () => console.log("Redis connected"));

        await redis.connect();
    }

    return redis;
}

// ═══════════════════════════════════════════════════════════════
// Presence Management
// ═══════════════════════════════════════════════════════════════

const PRESENCE_TTL = 60; // seconds

export async function setUserOnline(userId: string): Promise<void> {
    const client = await getRedisClient();
    await client.set(`presence:${userId}`, "online", { EX: PRESENCE_TTL });
}

export async function setUserOffline(userId: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(`presence:${userId}`);
}

export async function getUserStatus(userId: string): Promise<string | null> {
    const client = await getRedisClient();
    return client.get(`presence:${userId}`);
}

export async function getOnlineUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const client = await getRedisClient();
    const pipeline = client.multi();

    for (const userId of userIds) {
        pipeline.get(`presence:${userId}`);
    }

    const results = await pipeline.exec();
    return userIds.filter((_, index) => results[index] === "online");
}

// ═══════════════════════════════════════════════════════════════
// Typing Indicators (with auto-expiry)
// ═══════════════════════════════════════════════════════════════

const TYPING_TTL = 5; // seconds

export async function setTyping(channelId: string, userId: string, username: string): Promise<void> {
    const client = await getRedisClient();
    const key = `typing:${channelId}`;

    await client.hSet(key, userId, JSON.stringify({ userId, username, timestamp: Date.now() }));
    await client.expire(key, TYPING_TTL);
}

export async function removeTyping(channelId: string, userId: string): Promise<void> {
    const client = await getRedisClient();
    await client.hDel(`typing:${channelId}`, userId);
}

export async function getTypingUsers(channelId: string): Promise<{ userId: string; username: string }[]> {
    const client = await getRedisClient();
    const result = await client.hGetAll(`typing:${channelId}`);

    const now = Date.now();
    const users: { userId: string; username: string }[] = [];

    for (const value of Object.values(result)) {
        try {
            const data = JSON.parse(value);
            // Only include if within TTL
            if (now - data.timestamp < TYPING_TTL * 1000) {
                users.push({ userId: data.userId, username: data.username });
            }
        } catch {
            // Ignore invalid entries
        }
    }

    return users;
}

// ═══════════════════════════════════════════════════════════════
// Unread Count Cache
// ═══════════════════════════════════════════════════════════════

export async function incrementUnread(channelId: string, userIds: string[]): Promise<void> {
    const client = await getRedisClient();
    const pipeline = client.multi();

    for (const userId of userIds) {
        pipeline.incr(`unread:${userId}:${channelId}`);
    }

    await pipeline.exec();
}

export async function clearUnread(userId: string, channelId: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(`unread:${userId}:${channelId}`);
}

export async function getUnreadCount(userId: string, channelId: string): Promise<number> {
    const client = await getRedisClient();
    const count = await client.get(`unread:${userId}:${channelId}`);
    return count ? parseInt(count, 10) : 0;
}

export async function getUnreadCounts(userId: string, channelIds: string[]): Promise<Record<string, number>> {
    if (channelIds.length === 0) return {};

    const client = await getRedisClient();
    const pipeline = client.multi();

    for (const channelId of channelIds) {
        pipeline.get(`unread:${userId}:${channelId}`);
    }

    const results = await pipeline.exec();
    const counts: Record<string, number> = {};

    channelIds.forEach((channelId, index) => {
        const count = results[index] as string | null;
        counts[channelId] = count ? parseInt(count, 10) : 0;
    });

    return counts;
}
