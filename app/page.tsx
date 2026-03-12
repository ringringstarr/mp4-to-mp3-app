"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export default function Home() {
  const [isConverting, setIsConverting] = useState(false);
  const [message, setMessage] = useState("MP4ファイルを選択してください");
  const ffmpegRef = useRef(new FFmpeg());

  const handleConvert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    setMessage("FFmpegを読み込み中...");
    // サーバー側での実行を防ぎ、ブラウザのみでFFmpegを初期化する
    const [ffmpeg] = useState(() => typeof window !== "undefined" ? new FFmpeg() : null as any);

    try {
      // 初回のみFFmpegのコアファイルを読み込む
      if (!ffmpeg.loaded) {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
      }

      setMessage("MP3へ変換中...");

      // ブラウザの仮想ファイルシステムにMP4を書き込む
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      // Automatorと同じ引数で変換コマンドを実行（音質 q:a 2）
      await ffmpeg.exec(["-i", "input.mp4", "-vn", "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);

      // 変換されたMP3ファイルを読み出す
      const data = await ffmpeg.readFile("output.mp3");
      // @ts-expect-error: ffmpeg.wasmの型定義の不一致を回避
      const url = URL.createObjectURL(new Blob([data], { type: "audio/mp3" }));
      
      // 自動ダウンロード処理
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, "") + ".mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setMessage("変換が完了しました！");
    } catch (error) {
      console.error(error);
      setMessage("エラーが発生しました。コンソールを確認してください。");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">MP4 to MP3 Converter</h1>
        
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={handleConvert}
          disabled={isConverting}
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        
        <p className="text-gray-600 mt-4 h-6">{message}</p>
        
        {isConverting && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
    </main>
  );
}
