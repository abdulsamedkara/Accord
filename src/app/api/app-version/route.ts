import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        // ⚠️ Bu versiyonu her yeni Setup.exe oluşturduğunuzda güncelleyin!
        // package.json'daki version ile AYNI olmalı.
        version: "1.0.3",

        // Setup.exe'nin indirme linki
        // GitHub Releases kullanın: Repo > Releases > New Release > .exe'yi yükleyin
        // Örnek: https://github.com/kullaniciadi/accord/releases/download/v1.0.0/Accord-Setup.exe
        downloadUrl: "https://github.com/abdulsamedkara/Accord/releases/download/v1.0.3/Accord-Setup.exe"
    });
}
