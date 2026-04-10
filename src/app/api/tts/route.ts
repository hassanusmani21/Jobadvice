import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const projectRoot = process.cwd();
const kokoroPythonPath = join(projectRoot, ".venv-kokoro", "bin", "python");
const kokoroScriptPath = join(projectRoot, "scripts", "kokoro_tts.py");
const maxSpeechTextLength = 15000;

const resolveLocaleSupport = (locale: string) => {
  const normalizedLocale = locale.toLowerCase();

  if (normalizedLocale.startsWith("hi")) {
    return "hi";
  }

  if (normalizedLocale.startsWith("en")) {
    return "en";
  }

  return null;
};

const isKokoroConfigured = async () => {
  try {
    await Promise.all([
      access(kokoroPythonPath, constants.X_OK),
      access(kokoroScriptPath, constants.R_OK),
    ]);
    return true;
  } catch {
    return false;
  }
};

const runKokoro = async (text: string, locale: string) =>
  new Promise<Buffer>((resolve, reject) => {
    const subprocess = spawn(
      kokoroPythonPath,
      [kokoroScriptPath, "--locale", locale, "--text", text],
      {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    subprocess.stdout.on("data", (chunk: Buffer | string) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    subprocess.stderr.on("data", (chunk: Buffer | string) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    subprocess.on("error", (error) => {
      reject(error);
    });

    subprocess.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }

      const stderrOutput = Buffer.concat(stderrChunks)
        .toString("utf8")
        .trim()
        .slice(0, 500);

      reject(
        new Error(stderrOutput || `kokoro_process_failed:${String(code ?? "unknown")}`),
      );
    });
  });

export async function GET() {
  return NextResponse.json({
    enabled: await isKokoroConfigured(),
    provider: "kokoro",
    supportedLocales: ["en-IN", "en-GB", "en-US", "hi-IN"],
  });
}

export async function POST(request: NextRequest) {
  if (!(await isKokoroConfigured())) {
    return NextResponse.json(
      { error: "Kokoro voice is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    locale?: string;
    text?: string;
  };
  const inputText = typeof body.text === "string" ? body.text.trim() : "";
  const locale = typeof body.locale === "string" ? body.locale : "en-IN";
  const supportedLocale = resolveLocaleSupport(locale);

  if (!inputText) {
    return NextResponse.json(
      { error: "Text is required." },
      { status: 400 },
    );
  }

  if (!supportedLocale) {
    return NextResponse.json(
      {
        error: "Kokoro does not support this language yet.",
      },
      { status: 422 },
    );
  }

  if (inputText.length > maxSpeechTextLength) {
    return NextResponse.json(
      { error: "Text is too long for a single speech request." },
      { status: 400 },
    );
  }

  try {
    const audioBuffer = await runKokoro(inputText, locale);
    const audioBytes = new Uint8Array(audioBuffer);
    return new NextResponse(audioBytes, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "audio/wav",
      },
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 500) : "Unknown Kokoro error.";
    return NextResponse.json(
      {
        error: "Kokoro voice request failed.",
        detail,
      },
      { status: 500 },
    );
  }
}
