"""
Generate an AI voiceover for docs/cruxiq-demo.webm and mux it in.

Uses Microsoft Edge neural TTS (free, no API key) via the `edge-tts` package,
then ffmpeg to place each narration segment at its scene's timestamp and
combine with the video.

Setup (one-time):
    pip install edge-tts
    winget install ffmpeg        # then reopen the terminal

Run:
    python docs/generate_voiceover.py
Output:
    docs/cruxiq-demo-voiced.mp4

Tweak VOICE / RATE / SEGMENTS below to taste. Preview voices with:
    edge-tts --list-voices | findstr en-IN
"""
import asyncio
import os
import subprocess
import sys
import tempfile

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO_IN = os.path.join(HERE, "cruxiq-demo.webm")
VIDEO_OUT = os.path.join(HERE, "cruxiq-demo-voiced.mp4")

# en-IN neural voices suit the audience; alternatives: en-US-GuyNeural, en-GB-RyanNeural
VOICE = "en-IN-PrabhatNeural"
RATE = "+8%"          # slightly brisk to fit each scene window

# (start_seconds, narration) — starts match the caption timings in the video.
# Each line must be speakable within its scene (see gaps between starts).
SEGMENTS = [
    (2.0,  "This is CruxIQ. A cement CFO in Rajasthan opens it and sees one number first: "
           "forty-six crore rupees of gas-cost exposure over the next thirty days."),
    (11.5, "Every score is auditable. Click WHY, and you trace it from GDELT headlines, "
           "through LLM extraction, to deterministic scoring. No black box."),
    (21.5, "The output is one decision: BUY NOW, at sixty-six percent confidence. "
           "And it lands on the CFO's phone over WhatsApp — under ninety seconds from news to alert."),
    (37.0, "One click switches to boardroom mode. Same data, presentation ready."),
    (45.5, "March twenty twenty-six: the IGX benchmark spiked sixty-nine percent in a single month. "
           "Spot buyers paid six hundred seventy-two rupees more per unit."),
    (56.5, "CruxIQ flagged Hormuz RED in February — a full month early. Across five years of backtests: "
           "seventy-eight percent of geopolitical shocks caught, with a twelve percent false positive rate."),
    (71.0, "For one two-M-T-P-A cement plant, acting on that signal saves about ten crore rupees."),
    (80.5, "Scaled to a fifteen-plant group, that is five thousand crore of exposure under one view. "
           "CruxIQ. See the shock before the price does."),
]


async def synth(text: str, path: str) -> None:
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)


def main() -> None:
    if not os.path.exists(VIDEO_IN):
        sys.exit(f"video not found: {VIDEO_IN}")
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        sys.exit("ffmpeg not found — install it first (winget install ffmpeg), then reopen the terminal")

    tmp = tempfile.mkdtemp(prefix="cruxiq_vo_")
    clips = []
    for i, (start, text) in enumerate(SEGMENTS):
        path = os.path.join(tmp, f"seg{i}.mp3")
        print(f"synthesizing segment {i + 1}/{len(SEGMENTS)} (t={start}s)...")
        asyncio.run(synth(text, path))
        clips.append((start, path))

    # Build ffmpeg command: delay each clip to its start time, mix, mux with video.
    cmd = ["ffmpeg", "-y", "-i", VIDEO_IN]
    for _, path in clips:
        cmd += ["-i", path]
    delays = "".join(
        f"[{i + 1}:a]adelay={int(start * 1000)}|{int(start * 1000)}[a{i}];"
        for i, (start, _) in enumerate(clips)
    )
    mix_in = "".join(f"[a{i}]" for i in range(len(clips)))
    filtergraph = f"{delays}{mix_in}amix=inputs={len(clips)}:normalize=0[aout]"
    cmd += [
        "-filter_complex", filtergraph,
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        VIDEO_OUT,
    ]
    print("muxing with ffmpeg...")
    subprocess.run(cmd, check=True)
    print(f"\ndone: {VIDEO_OUT}")


if __name__ == "__main__":
    main()
