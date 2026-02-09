"use client";

import { useAppStore } from "@/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { LogOut, User, Video, Volume2, Mic, MonitorSpeaker, Check, X, Shield, Crown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useMediaDeviceSelect } from "@livekit/components-react";

type Tab = "account" | "voice";

export const UserSettingsModal = () => {
    const {
        isUserSettingsModalOpen,
        setUserSettingsModalOpen,
        user,
        clearUser,
        isAudioEnabled,
        isVideoEnabled,
        isDeafened,
        setAudioEnabled,
        setVideoEnabled,
        setDeafened
    } = useAppStore();

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("account");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await fetch("/api/auth/logout", { method: "POST" });
            clearUser();
            setUserSettingsModalOpen(false);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isUserSettingsModalOpen} onOpenChange={setUserSettingsModalOpen}>
            <DialogContent className="p-0 overflow-hidden bg-[#313338] border-none text-[hsl(var(--foreground))] w-full max-w-[800px] h-[600px] flex gap-0 [&>button]:hidden">
                <DialogTitle className="hidden">User Settings</DialogTitle>
                {/* Sidebar */}
                <div className="w-[220px] bg-[#2B2D31] flex flex-col p-[6px_6px_6px_20px]">
                    <div className="pt-10 px-2 pb-2">
                        <span className="text-xs font-bold text-[#949BA4] uppercase px-2 mb-2 block">
                            User Settings
                        </span>

                        <div className="space-y-[2px]">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={cn(
                                    "w-full text-left px-2.5 py-1.5 rounded text-[15px] font-medium transition-colors",
                                    activeTab === "account"
                                        ? "bg-[#404249] text-white"
                                        : "text-[#B5BAC1] hover:bg-[#35373C] hover:text-[#DBDEE1]"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    My Account
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab("voice")}
                                className={cn(
                                    "w-full text-left px-2.5 py-1.5 rounded text-[15px] font-medium transition-colors",
                                    activeTab === "voice"
                                        ? "bg-[#404249] text-white"
                                        : "text-[#B5BAC1] hover:bg-[#35373C] hover:text-[#DBDEE1]"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    Voice & Video
                                </div>
                            </button>

                            <Separator className="my-2 bg-[#1F2023]" />

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-2.5 py-1.5 rounded text-[15px] font-medium transition-colors text-red-400 hover:bg-[#35373C] hover:text-red-300"
                            >
                                <div className="flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#313338] p-[60px_40px_80px]">
                    <div className="max-w-[800px] h-full overflow-y-auto pr-4 custom-scrollbar">
                        {activeTab === "account" && (
                            <MyAccountTab user={user} handleLogout={handleLogout} isLoading={isLoading} />
                        )}
                        {activeTab === "voice" && (
                            <VoiceVideoTab />
                        )}
                    </div>

                    {/* Close Button (Escape hatch) */}
                    <div className="absolute top-4 right-4 flex flex-col items-center gap-1 group">
                        <button
                            onClick={() => setUserSettingsModalOpen(false)}
                            className="w-9 h-9 rounded-full border-2 border-[#B5BAC1] flex items-center justify-center text-[#B5BAC1] hover:bg-[#B5BAC1] hover:text-[#313338] transition-all"
                        >
                            <X className="w-5 h-5 font-bold" />
                        </button>
                        <span className="text-xs font-medium text-[#B5BAC1] opacity-0 group-hover:opacity-100 transition-opacity">
                            ESC
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MyAccountTab = ({ user, handleLogout, isLoading }: { user: any, handleLogout: () => void, isLoading: boolean }) => {
    const { setUser } = useAppStore();
    const router = useRouter();

    // Editing States
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Form Values
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);

    // Password Values
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // Loading & Errors
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Handlers
    const handleSaveProfile = async (field: "username" | "email") => {
        setError(null);
        setSuccess(null);
        setIsSaving(true);

        try {
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    username: field === "username" ? username : undefined,
                    email: field === "email" ? email : undefined,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            const updatedUser = await res.json();
            setUser(updatedUser);
            setSuccess(`${field === "username" ? "Username" : "Email"} updated successfully.`);
            setIsEditingUsername(false);
            setIsEditingEmail(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmNewPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch("/api/users/change-password", {
                method: "POST",
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setIsChangingPassword(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            <h2 className="text-xl font-bold mb-6 text-white">My Account</h2>

            <div className="bg-[#111214] rounded-lg overflow-hidden mb-8">
                {/* Banner */}
                <div className="h-[100px] bg-indigo-500 w-full relative"></div>

                {/* User Info */}
                <div className="p-4 pt-12 relative bg-[#111214]">
                    <div className="absolute -top-[50px] left-4 p-1.5 bg-[#111214] rounded-full">
                        <UserAvatar src={user.avatar} name={user.username} className="w-[90px] h-[90px] border-[6px] border-[#111214]" />
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-[4px] border-[#111214]" />
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {user.username}
                                <span className="bg-[#5865F2] text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Check className="w-3 h-3" /> APP
                                </span>
                            </h3>
                            <p className="text-sm text-[#B5BAC1]">#{user.id.substring(0, 4)}</p>
                        </div>
                    </div>

                    {/* Profile Fields */}
                    <div className="bg-[#2B2D31] rounded-lg p-4 space-y-4">

                        {/* Username Field */}
                        <div className="flex justify-between items-center">
                            <div className="flex-1 mr-4">
                                <label className="text-xs font-bold text-[#B5BAC1] uppercase mb-1 block">Display Name</label>
                                {isEditingUsername ? (
                                    <Input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-[#1E1F22] border-none text-[#DBDEE1]"
                                    />
                                ) : (
                                    <p className="text-sm text-white">{user.username}</p>
                                )}
                            </div>
                            {isEditingUsername ? (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => { setIsEditingUsername(false); setUsername(user.username); }}
                                        className="text-[#B5BAC1] hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-[#248046] hover:bg-[#1a6334] text-white"
                                        onClick={() => handleSaveProfile("username")}
                                        disabled={isSaving}
                                    >
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="secondary" size="sm"
                                    className="bg-[#4E5058] text-white hover:bg-[#6D6F78]"
                                    onClick={() => setIsEditingUsername(true)}
                                >
                                    Edit
                                </Button>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="flex justify-between items-center">
                            <div className="flex-1 mr-4">
                                <label className="text-xs font-bold text-[#B5BAC1] uppercase mb-1 block">Email</label>
                                {isEditingEmail ? (
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-[#1E1F22] border-none text-[#DBDEE1]"
                                    />
                                ) : (
                                    <p className="text-sm text-white">{email}</p> // Use state email to reflect updates
                                )}
                            </div>
                            {isEditingEmail ? (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => { setIsEditingEmail(false); setEmail(user.email); }}
                                        className="text-[#B5BAC1] hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-[#248046] hover:bg-[#1a6334] text-white"
                                        onClick={() => handleSaveProfile("email")}
                                        disabled={isSaving}
                                    >
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="secondary" size="sm"
                                    className="bg-[#4E5058] text-white hover:bg-[#6D6F78]"
                                    onClick={() => setIsEditingEmail(true)}
                                >
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Password Change Section */}
                    <div className="mt-8">
                        <h3 className="text-md font-bold text-white mb-4 uppercase text-xs">Password & Authentication</h3>

                        {isChangingPassword ? (
                            <div className="bg-[#2B2D31] rounded-lg p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#B5BAC1] uppercase">Current Password</label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-[#1E1F22] border-none text-[#DBDEE1]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#B5BAC1] uppercase">New Password</label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-[#1E1F22] border-none text-[#DBDEE1]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#B5BAC1] uppercase">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="bg-[#1E1F22] border-none text-[#DBDEE1]"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => { setIsChangingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword(""); }}
                                        className="text-[#B5BAC1] hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                                        onClick={handleChangePassword}
                                        disabled={isSaving}
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setIsChangingPassword(true)}
                                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                            >
                                Change Password
                            </Button>
                        )}
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded text-green-500 text-sm">
                            {success}
                        </div>
                    )}

                </div>
            </div>

            <Separator className="my-8 bg-[#3F4147]" />

            <h3 className="text-md font-bold text-white mb-4 uppercase text-xs">Account Removal</h3>
            <Button
                onClick={handleLogout}
                variant="destructive"
                className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                disabled={isLoading}
            >
                {isLoading ? "Logging out..." : "Log Out"}
            </Button>
        </div>
    );
};


const VoiceVideoTab = () => {
    const {
        audioInputDeviceId,
        audioOutputDeviceId,
        videoDeviceId,
        noiseSuppression,
        echoCancellation,
        setAudioInputDeviceId,
        setAudioOutputDeviceId,
        setVideoDeviceId,
        setNoiseSuppression,
        setEchoCancellation,
        inputVolume,
        setInputVolume,
        inputSensitivity,
        setInputSensitivity,
        isInputSensitivityAuto,
        setInputSensitivityAuto,
        inputMode,
        setInputMode,
        pushToTalkKey,
        setPushToTalkKey,
        toggleMuteKey,
        setToggleMuteKey
    } = useAppStore();

    const [devices, setDevices] = useState<{
        audioInput: MediaDeviceInfo[];
        audioOutput: MediaDeviceInfo[];
        videoInput: MediaDeviceInfo[];
    }>({ audioInput: [], audioOutput: [], videoInput: [] });

    // Video Preview State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devs = await navigator.mediaDevices.enumerateDevices();
                setDevices({
                    audioInput: devs.filter(d => d.kind === "audioinput"),
                    audioOutput: devs.filter(d => d.kind === "audiooutput"),
                    videoInput: devs.filter(d => d.kind === "videoinput")
                });
            } catch (error) {
                console.error("Error enumerating devices:", error);
            }
        };

        getDevices();
        navigator.mediaDevices.addEventListener("devicechange", getDevices);
        return () => navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    }, []);

    // Handle Video Preview
    useEffect(() => {
        if (isPreviewing && videoDeviceId) {
            let stream: MediaStream | null = null;
            const startPreview = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: videoDeviceId } }
                    });
                    setPreviewStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Failed to get video stream", err);
                    setIsPreviewing(false);
                }
            };
            startPreview();
            return () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            };
        } else {
            setPreviewStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, [isPreviewing, videoDeviceId]);

    const togglePreview = () => {
        setIsPreviewing(!isPreviewing);
    };

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            <h2 className="text-xl font-bold mb-6 text-white">Voice & Video</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B5BAC1] uppercase block">Input Device (Microphone)</label>
                    <select
                        value={audioInputDeviceId || ""}
                        onChange={(e) => setAudioInputDeviceId(e.target.value)}
                        className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded text-sm border-none outline-none focus:ring-1 focus:ring-[#5865F2]"
                    >
                        <option value="">Default Device</option>
                        {devices.audioInput.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B5BAC1] uppercase block">Output Device (Speakers)</label>
                    <select
                        value={audioOutputDeviceId || ""}
                        onChange={(e) => setAudioOutputDeviceId(e.target.value)}
                        className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded text-sm border-none outline-none focus:ring-1 focus:ring-[#5865F2]"
                    >
                        <option value="">Default Device</option>
                        {devices.audioOutput.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2 mb-8">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase block">Input Volume ({inputVolume}%)</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={inputVolume}
                    onChange={(e) => setInputVolume(Number(e.target.value))}
                    className="w-full accent-[#5865F2] h-2 bg-[#4E5058] rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <Separator className="my-8 bg-[#3F4147]" />

            <h3 className="text-xs font-bold text-[#B5BAC1] uppercase mb-4">Input Mode</h3>
            <div className="space-y-4 mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="inputMode"
                                checked={inputMode === "voice-activity"}
                                onChange={() => setInputMode("voice-activity")}
                                className="accent-[#5865F2] w-5 h-5"
                            />
                            <span className="text-[#DBDEE1] text-sm font-medium">Voice Activity</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="inputMode"
                                checked={inputMode === "push-to-talk"}
                                onChange={() => setInputMode("push-to-talk")}
                                className="accent-[#5865F2] w-5 h-5"
                            />
                            <span className="text-[#DBDEE1] text-sm font-medium">Push to Talk</span>
                        </label>
                    </div>
                </div>

                {inputMode === "voice-activity" && (
                    <div className="space-y-2 p-4 bg-[#2B2D31] rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-[#B5BAC1] uppercase">Input Sensitivity</p>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-[#B5BAC1]">Automatically determine input sensitivity</span>
                                <div
                                    onClick={() => setInputSensitivityAuto(!isInputSensitivityAuto)}
                                    className={`w-10 h-6 rounded-full relative transition-colors ${isInputSensitivityAuto ? "bg-[#23A559]" : "bg-[#80848E]"}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isInputSensitivityAuto ? "left-[18px]" : "left-0.5"}`} />
                                </div>
                            </label>
                        </div>

                        {!isInputSensitivityAuto && (
                            <input
                                type="range"
                                min="0"
                                max="100" // -100dB to 0dB scale potentially, but 0-100 linear is fine for UI
                                value={inputSensitivity}
                                onChange={(e) => setInputSensitivity(Number(e.target.value))}
                                className="w-full accent-[#5865F2] h-2 bg-[#4E5058] rounded-lg appearance-none cursor-pointer"
                            />
                        )}
                        <p className="text-xs text-[#949BA4] mt-1">
                            {isInputSensitivityAuto ? "Your microphone sensitivity is being automatically configured." : `Manual sensitivity: ${inputSensitivity}%`}
                        </p>
                    </div>
                )}

                {inputMode === "push-to-talk" && (
                    <div className="space-y-4 p-4 bg-[#2B2D31] rounded-lg">
                        <ShortcutRecorder
                            label="Shortcut"
                            value={pushToTalkKey}
                            onChange={setPushToTalkKey}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Separator className="my-4 bg-[#3F4147]" />
                    <h3 className="text-xs font-bold text-[#B5BAC1] uppercase mb-2">Keybinds</h3>
                    <ShortcutRecorder
                        label="Toggle Mute"
                        value={toggleMuteKey}
                        onChange={setToggleMuteKey}
                    />
                </div>
            </div>

            <Separator className="my-8 bg-[#3F4147]" />

            <div className="space-y-2 mb-8">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase block">Video Device (Camera)</label>
                <select
                    value={videoDeviceId || ""}
                    onChange={(e) => setVideoDeviceId(e.target.value)}
                    className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded text-sm border-none outline-none focus:ring-1 focus:ring-[#5865F2]"
                >
                    <option value="">Default Device</option>
                    {devices.videoInput.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                        </option>
                    ))}
                </select>

                <div className="mt-4 bg-black rounded-lg aspect-video flex items-center justify-center border border-[#1E1F22] relative overflow-hidden">
                    {isPreviewing ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[#1E1F22] flex flex-col items-center justify-center text-[#B5BAC1] gap-2">
                            <div className="w-16 h-16 bg-[#2B2D31] rounded-full flex items-center justify-center">
                                <Video className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-sm">Video Preview</p>
                        </div>
                    )}

                    <Button
                        size="sm"
                        onClick={togglePreview}
                        className={`absolute bottom-4 ${isPreviewing ? "bg-red-500 hover:bg-red-600" : "bg-[#5865F2] hover:bg-[#4752C4]"} text-white`}
                    >
                        {isPreviewing ? "Stop Preview" : "Test Video"}
                    </Button>
                </div>
            </div>

            <Separator className="my-8 bg-[#3F4147]" />

            <h3 className="text-xs font-bold text-[#B5BAC1] uppercase mb-4">Advanced</h3>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <label className="text-sm font-medium text-[#DBDEE1] block">Noise Suppression</label>
                        <span className="text-xs text-[#949BA4]">Suppress background noise from your microphone.</span>
                    </div>
                    <div
                        onClick={() => setNoiseSuppression(!noiseSuppression)}
                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${noiseSuppression ? "bg-[#23A559]" : "bg-[#80848E]"}`}
                    >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${noiseSuppression ? "left-[18px]" : "left-0.5"}`} />
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <label className="text-sm font-medium text-[#DBDEE1] block">Echo Cancellation</label>
                        <span className="text-xs text-[#949BA4]">Prevents echo when using speakers.</span>
                    </div>
                    <div
                        onClick={() => setEchoCancellation(!echoCancellation)}
                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${echoCancellation ? "bg-[#23A559]" : "bg-[#80848E]"}`}
                    >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${echoCancellation ? "left-[18px]" : "left-0.5"}`} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShortcutRecorder = ({ label, value, onChange }: { label: string, value: string | null, onChange: (val: string | null) => void }) => {
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        if (!isRecording) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            // Ignore Start/Stop recording keys if we had them, but here we just take the first key
            // Use 'code' for physical key location (e.g. KeyA, Space, ControlLeft)
            onChange(e.code);
            setIsRecording(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isRecording, onChange]);

    return (
        <div className="bg-[#1E1F22] p-3 rounded flex justify-between items-center">
            <span className="text-[#DBDEE1] text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <div
                    onClick={() => setIsRecording(true)}
                    className={`
                        min-w-[100px] px-3 py-1.5 rounded border cursor-pointer text-center text-sm font-mono select-none
                        ${isRecording
                            ? "bg-[#313338] border-red-500 text-red-500 animate-pulse"
                            : "bg-[#2B2D31] border-[#1E1F22] text-[#DBDEE1] hover:border-[#4E5058]"
                        }
                    `}
                >
                    {isRecording ? "Recording..." : (value || "Click to Bind")}
                </div>
                {value && (
                    <button onClick={() => onChange(null)} className="text-[#B5BAC1] hover:text-red-400">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
