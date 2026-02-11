"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DesktopCapturerSource {
    id: string;
    name: string;
    thumbnail: string; // Already converted to data URL string
    display_id: string;
    appIcon: string | null; // Already converted to data URL string
}

export const ScreenSharePicker = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [sources, setSources] = useState<DesktopCapturerSource[]>([]);
    const [activeTab, setActiveTab] = useState<"screens" | "windows">("screens");

    useEffect(() => {
        // Check if running in Electron with exposed API
        const electron = (window as any).electron;
        if (!electron) return;

        const handleGetSources = (sources: any[]) => {
            setSources(sources);
            setActiveTab("screens");
            setIsOpen(true);
        };

        // Listen for the event from main process
        const cleanup = electron.ipcRenderer.on("GET_SOURCES", handleGetSources);

        return () => {
            cleanup();
        };
    }, []);

    const handleSelect = (sourceId: string) => {
        const electron = (window as any).electron;
        if (electron) {
            electron.ipcRenderer.send("SOURCE_SELECTED", sourceId);
            setIsOpen(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // User closed the dialog without selecting (Cancel)
            const electron = (window as any).electron;
            if (electron) {
                electron.ipcRenderer.send("SOURCE_SELECTED", null);
            }
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    // Separate screens and windows
    const screens = sources.filter(s => s.id.startsWith("screen"));
    const windows = sources.filter(s => !s.id.startsWith("screen"));

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl bg-[#313338] border-none text-white p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="text-xl font-bold">Ekran Paylaş</DialogTitle>
                </DialogHeader>

                <div className="p-4">
                    <div className="w-full">
                        <div className="flex bg-[#1e1f22] w-full justify-start rounded-lg p-1 mb-4 gap-1">
                            <button
                                onClick={() => setActiveTab("screens")}
                                className={cn(
                                    "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    activeTab === "screens" ? "bg-[#404249] text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-[#404249]/50"
                                )}
                            >
                                Ekranlar
                            </button>
                            <button
                                onClick={() => setActiveTab("windows")}
                                className={cn(
                                    "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    activeTab === "windows" ? "bg-[#404249] text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-[#404249]/50"
                                )}
                            >
                                Uygulamalar
                            </button>
                        </div>

                        {activeTab === "screens" ? (
                            <ScrollArea className="h-[400px] w-full pr-4">
                                <div className="grid grid-cols-2 gap-4 pb-4">
                                    {screens.map((source) => (
                                        <div
                                            key={source.id}
                                            className="group cursor-pointer rounded-lg overflow-hidden border border-transparent hover:border-[#5865F2] hover:bg-[#404249] transition-all p-2"
                                            onClick={() => handleSelect(source.id)}
                                        >
                                            <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-2">
                                                <img
                                                    src={source.thumbnail}
                                                    alt={source.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="text-center font-medium truncate px-1 text-sm text-gray-300 group-hover:text-white">
                                                {source.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <ScrollArea className="h-[400px] w-full pr-4">
                                <div className="grid grid-cols-3 gap-4 pb-4">
                                    {windows.map((source) => (
                                        <div
                                            key={source.id}
                                            className="group cursor-pointer rounded-lg overflow-hidden border border-transparent hover:border-[#5865F2] hover:bg-[#404249] transition-all p-2"
                                            onClick={() => handleSelect(source.id)}
                                        >
                                            <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-2 flex items-center justify-center">
                                                <img
                                                    src={source.thumbnail}
                                                    alt={source.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                {source.appIcon && (
                                                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-transparent">
                                                        <img src={source.appIcon} alt="" className="w-full h-full" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center font-medium truncate px-1 text-xs text-gray-300 group-hover:text-white">
                                                {source.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
