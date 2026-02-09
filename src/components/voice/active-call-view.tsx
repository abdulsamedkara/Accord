"use client";

import { useTracks, VideoTrack, useParticipants, useParticipantContext } from "@livekit/components-react";
import { Track, Participant, RoomEvent, ParticipantEvent } from "livekit-client";
import { Maximize2, Minimize2, Mic, MicOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ActiveCallView = () => {
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const participants = useParticipants();

    // If someone is sharing screen, use Focus Layout
    if (screenShareTracks.length > 0) {
        return <ScreenShareFocusView screenShareTrack={screenShareTracks[0]} participants={participants} />;
    }

    // Standard Grid Layout
    return (
        <div className="flex h-full w-full flex-wrap gap-4 p-4 justify-center items-center content-center overflow-y-auto">
            {participants.map((participant) => (
                <ParticipantTile key={participant.identity} participant={participant} />
            ))}
            {participants.length === 0 && (
                <div className="flex flex-col items-center justify-center text-zinc-500 animate-pulse">
                    <p>Waiting for others to join...</p>
                </div>
            )}
        </div>
    );
};

// --- Sub Components ---

interface ParticipantTileProps {
    participant: Participant;
    className?: string;
    mini?: boolean;
}

const ParticipantTile = ({ participant, className, mini = false }: ParticipantTileProps) => {
    // We need to listen to updates for this participant (speaking, tracks, etc)
    // In a real app we might use useParticipantContext but since we are mapping manually, we can use a forceUpdate or specific hooks. 
    // Actually LiveKit's useParticipantInfo hook is useful, but let's manual listener for "speaking" to be instant.

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(true);

    // We can use useTracks to get specifically THIS participant's camera
    // But useTracks returns based on a filter.
    // Let's use the track references directly from the participant object or a filtered hook.
    // The easiest way to get a track ref for <VideoTrack> is to find it in the participant's publications.

    // Using a simple state sync for track updates
    const [videoTrackRef, setVideoTrackRef] = useState<any>(null);

    useEffect(() => {
        const updateState = () => {
            setIsSpeaking(participant.isSpeaking);
            setIsMuted(participant.isMicrophoneEnabled === false);
            setIsCameraOff(participant.isCameraEnabled === false);

            const cameraPub = participant.getTrackPublication(Track.Source.Camera);
            // Construct a track reference for VideoTrack component
            if (cameraPub && cameraPub.track) {
                setVideoTrackRef({
                    participant: participant,
                    source: Track.Source.Camera,
                    publication: cameraPub
                });
            } else {
                setVideoTrackRef(null);
            }
        };

        updateState();

        participant.on(ParticipantEvent.ParticipantMetadataChanged, updateState);
        participant.on(ParticipantEvent.TrackMuted, updateState);
        participant.on(ParticipantEvent.TrackUnmuted, updateState);
        participant.on(ParticipantEvent.IsSpeakingChanged, updateState);
        participant.on(ParticipantEvent.TrackPublished, updateState);
        participant.on(ParticipantEvent.TrackUnpublished, updateState);
        participant.on(ParticipantEvent.TrackSubscribed, updateState);
        participant.on(ParticipantEvent.TrackUnsubscribed, updateState);

        return () => {
            participant.off(ParticipantEvent.ParticipantMetadataChanged, updateState);
            participant.off(ParticipantEvent.TrackMuted, updateState);
            participant.off(ParticipantEvent.TrackUnmuted, updateState);
            participant.off(ParticipantEvent.IsSpeakingChanged, updateState);
            participant.off(ParticipantEvent.TrackPublished, updateState);
            participant.off(ParticipantEvent.TrackUnpublished, updateState);
            participant.off(ParticipantEvent.TrackSubscribed, updateState);
            participant.off(ParticipantEvent.TrackUnsubscribed, updateState);
        };
    }, [participant]);

    return (
        <div
            className={cn(
                "relative group overflow-hidden transition-all duration-300",
                // Glassmorphism Base
                "bg-zinc-900/40 backdrop-blur-md border border-white/5",
                // Shape & Shadow
                "rounded-2xl shadow-2xl",
                // Speaking Glow (Green Ring + Shadow)
                isSpeaking
                    ? "ring-2 ring-emerald-500/80 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] scale-[1.01] z-10"
                    : "hover:border-white/10 hover:bg-zinc-900/60",
                // Size (Responsive Grid or Mini)
                mini ? "w-[200px] aspect-video flex-shrink-0" : "w-full max-w-[560px] aspect-video",
                className
            )}
        >
            {/* Video Layer */}
            {!isCameraOff && videoTrackRef ? (
                <VideoTrack
                    trackRef={videoTrackRef}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                /* Avatar / No Video Fallback */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/50">
                    {/* Avatar Pulse if Speaking */}
                    <div className={cn(
                        "relative w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl transition-all duration-300",
                        // Dynamic Gradient based on username length or random logic could be cool, standardizing on primary for now
                        "bg-gradient-to-br from-indigo-500 to-purple-600",
                        isSpeaking && "scale-110 ring-4 ring-emerald-500/30 shadow-[0_0_40px_rgba(99,102,241,0.6)]"
                    )}>
                        {/* Image or Initials */}
                        {/* We don't have avatar url directly on Participant easily without metadata, using initials fallback */}
                        {participant.identity?.substring(0, 2).toUpperCase()}
                    </div>
                </div>
            )}

            {/* Overlay Gradient (Top and Bottom for readability) */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            {/* Status (Top Right) */}
            <div className="absolute top-3 right-3 flex gap-2">
                {isMuted && (
                    <div className="bg-red-500/90 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm">
                        <MicOff className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>

            {/* Info Bar (Bottom Left) */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-full">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors border max-w-full",
                        isSpeaking
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-100"
                            : "bg-black/40 border-white/5 text-zinc-100"
                    )}>
                        {/* Small Speaking Dot */}
                        <div className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            isSpeaking ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-transparent"
                        )} />

                        <span className="text-xs font-semibold truncate leading-none">
                            {participant.identity} {participant.isLocal && "(You)"}
                        </span>
                    </div>
                </div>
            </div>

            {/* "Speaking" Visualizer Effect (Optional - just a subtle highlight) */}
            {isSpeaking && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 blur-sm" />
            )}
        </div>
    );
};


// --- Screen Share View ---

interface ScreenShareFocusViewProps {
    screenShareTrack: any;
    participants: Participant[];
}

const ScreenShareFocusView = ({ screenShareTrack, participants }: ScreenShareFocusViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", onFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
    }, []);

    // Filter out the local participant if we wanted, but showing everyone is fine in the bottom bar
    // Actually typically the person sharing screen is NOT in the bottom bar, but for now let's show everyone.

    return (
        <div className="flex flex-col h-full w-full bg-black">
            {/* Main Stage (Screen Share) */}
            <div
                ref={containerRef}
                className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden"
            >
                {/* Dotted Background Pattern for professional feel */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                <VideoTrack
                    trackRef={screenShareTrack}
                    className="max-h-full max-w-full object-contain shadow-2xl"
                />

                {/* Fullscreen Toggle */}
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-6 right-6 p-2.5 bg-black/60 hover:bg-zinc-800 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Bottom Bar (Participants) */}
            <div className="h-[160px] bg-zinc-950/90 backdrop-blur-sm flex gap-3 p-4 overflow-x-auto justify-center border-t border-zinc-800/50">
                {participants.map((participant) => (
                    <ParticipantTile
                        key={participant.identity}
                        participant={participant}
                        mini={true}
                        className="w-[200px]"
                    />
                ))}
            </div>
        </div>
    );
};
