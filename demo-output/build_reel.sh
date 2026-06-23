#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
VOICE="en-ZA-LukeNeural"; RATE="+6%"; FPS=30
mkdir -p audio clips
IDS=(01-hook 02-problem 03-solution 04-dashboard 05-receipt 06-arrears 07-cta)

echo "== TTS =="
for id in "${IDS[@]}"; do
  TXT=$(cat "narration/$id.txt")
  edge-tts --voice "$VOICE" --rate="$RATE" --text "$TXT" --write-media "audio/$id.mp3" >/dev/null 2>&1 \
    || python -m edge_tts --voice "$VOICE" --rate="$RATE" --text "$TXT" --write-media "audio/$id.mp3"
  echo "  voiced $id"
done

echo "== per-scene clips (subtle zoom) =="
PAD=0.55; MIN=2.6
for id in "${IDS[@]}"; do
  AD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "audio/$id.mp3")
  DUR=$(python -c "print(round(max($AD+$PAD,$MIN),2))")
  ffmpeg -y -loop 1 -framerate $FPS -t "$DUR" -i "frames/$id.png" -i "audio/$id.mp3" \
    -filter_complex "[0:v]scale=1188:2112,zoompan=z='min(1.0+0.0008*on,1.06)':d=1:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':s=1080x1920:fps=$FPS,format=yuv420p[v]" \
    -map "[v]" -map 1:a -t "$DUR" -c:v libx264 -preset medium -crf 19 -c:a aac -b:a 192k "clips/$id.mp4" >/dev/null 2>&1
  echo "  clip $id ($DUR s)"
done

echo "== concat =="
: > concat.txt
for id in "${IDS[@]}"; do echo "file 'clips/$id.mp4'" >> concat.txt; done
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy voiced.mp4 >/dev/null 2>&1
TOT=$(ffprobe -v error -show_entries format=duration -of csv=p=0 voiced.mp4)
echo "  total ${TOT}s"

echo "== music bed (soft open-fifth pad) =="
OUTFADE=$(python -c "print(round($TOT-1.8,2))")
ffmpeg -y -f lavfi -i "sine=frequency=110:duration=$TOT" -f lavfi -i "sine=frequency=164.81:duration=$TOT" -f lavfi -i "sine=frequency=220:duration=$TOT" \
  -filter_complex "amix=inputs=3:normalize=0,lowpass=f=650,volume=0.05,afade=t=in:st=0:d=1.5,afade=t=out:st=$OUTFADE:d=1.8[m]" \
  -map "[m]" -t "$TOT" music.wav >/dev/null 2>&1

echo "== mix VO + music -> output.mp4 =="
ffmpeg -y -i voiced.mp4 -i music.wav \
  -filter_complex "[0:a]volume=1.0[vo];[1:a]volume=1.0[mu];[vo][mu]amix=inputs=2:duration=first:dropout_transition=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest output.mp4 >/dev/null 2>&1
echo "DONE -> output.mp4 (${TOT}s)"