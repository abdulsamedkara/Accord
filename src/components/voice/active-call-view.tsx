"use client";

import { useTracks, VideoTrack, useParticipants, ConfigContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { Maximize2, Minimize2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ActiveCallView = () => {
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const cameraTracks = useTracks([Track.Source.Camera]);

    // If someone is sharing screen, use Focus Layout
    if (screenShareTracks.length > 0) {
        return <ScreenShareFocusView screenShareTrack={screenShareTracks[0]} cameraTracks={cameraTracks} />;
    }

    // Otherwise standard Grid Layout
    return (
        <div className="flex h-full w-full flex-wrap gap-4 p-4 justify-center items-center content-center">
            {cameraTracks.map((track) => (
                <div key={track.participant.identity} className="relative group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 aspect-video w-full max-w-[480px]">
                    <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                        {track.participant.identity}
                    </div>
                </div>
            ))}
            {/* If no cameras, show placeholder or audio visualizations */}
            {cameraTracks.length === 0 && (
                <div className="flex flex-col items-center justify-center text-zinc-500">
                    <p>No video participants</p>
                </div>
            )}
        </div>
    );
};

interface ScreenShareFocusViewProps {
    screenShareTrack: any; // TrackReferenceOrPlaceholder
    cameraTracks: any[];
}

const ScreenShareFocusView = ({ screenShareTrack, cameraTracks }: ScreenShareFocusViewProps) => {
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

    return (
        <div className="flex flex-col h-full w-full">
            {/* Main Stage (Screen Share) */}
            <div
                ref={containerRef}
                className="flex-1 relative bg-black min-h-0 flex items-center justify-center"
            >
                <VideoTrack
                    trackRef={screenShareTrack}
                    className="max-h-full max-w-full object-contain"
                />

                {/* Fullscreen Toggle */}
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Bottom Bar (Participants) */}
            <div className="h-[120px] bg-zinc-950 flex gap-2 p-2 overflow-x-auto justify-center border-t border-zinc-800">
                {cameraTracks.map((track: any) => (
                    <div key={track.participant.identity} className="relative aspect-video h-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[10px] text-white truncate max-w-[90%]">
                            {track.participant.identity}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
