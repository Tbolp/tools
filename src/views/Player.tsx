import { Button, Container, IconButton, MenuItem, Select, duration } from "@mui/material";
import TUpLoad from "../components/TUpload";
import { useEffect, useRef, useState } from "react";
import { PauseCircleFilled, PlayCircleFilled } from "@mui/icons-material";
import TWave from "../components/TWave";
import Grid from "@mui/material/Unstable_Grid2/Grid2";

async function arraybuffer2audiobuffer(ctx: AudioContext, buf: ArrayBuffer, format: number): Promise<AudioBuffer> {
  if (format == 0) {
    let pcm = new Int16Array(buf);
    let audio_buf = ctx.createBuffer(1, pcm.length, 16000);
    let chan = audio_buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) {
      chan[i] = pcm[i] / 32768.0;
    }
    return audio_buf
  } else {
    return await ctx.decodeAudioData(buf);
  }
}
export default function Player() {
  let [playing, set_playing] = useState(false);
  let [wave_data, set_wave_data] = useState<AudioBuffer | null>(null);
  let [progress, set_progress] = useState(0);
  let [format, set_format] = useState(0);
  let context = useRef({
    file_buf: null as ArrayBuffer | null,
    audio_ctx: null as AudioContext | null,
    audio_buf: null as AudioBuffer | null,
    audio_node: null as AudioBufferSourceNode | null,
    start_ts: 0,
    progress_ref: 0,
    is_pause: false,
  });
  useEffect(() => {
    return () => {
      if (context.current.audio_node) {
        context.current.audio_node.stop()
      }
    }
  }, [])
  const progress_cal = () => {
    let ctx = context.current
    if (ctx.audio_ctx && ctx.audio_buf && playing) {
      let cur = (ctx.audio_ctx.currentTime - ctx.start_ts) / ctx.audio_buf.duration;
      set_progress(cur)
      context.current.progress_ref = requestAnimationFrame(progress_cal)
    }
  }
  useEffect(() => {
    if (playing) {
      context.current.progress_ref = requestAnimationFrame(progress_cal)
    } else {
      cancelAnimationFrame(context.current.progress_ref)
    }
  }, [playing]);
  return (
    <Container>
      <Grid sx={{ mb: '1em', mt: '1em' }}>
        <TUpLoad onFile={async (file) => {
          if (playing) {
            return;
          }
          let fmt = 1;
          if (file.type == "") {
            fmt = 0;
          }
          context.current.file_buf = await file.arrayBuffer()
          let ctx = context.current;
          if (!ctx.audio_ctx) {
            ctx.audio_ctx = new AudioContext;
          }
          ctx.audio_buf = await arraybuffer2audiobuffer(ctx.audio_ctx, context.current.file_buf.slice(0), fmt)
          set_format(fmt)
          set_wave_data(ctx.audio_buf);
          set_progress(0)
        }} />
      </Grid>
      <Grid>
        <Select label="" disabled={playing} value={format} onChange={async (e) => {
          let ctx = context.current
          if (ctx.audio_ctx && ctx.file_buf) {
            let fmt = e.target.value as number
            ctx.audio_buf = await arraybuffer2audiobuffer(ctx.audio_ctx, ctx.file_buf.slice(0), fmt)
            set_format(fmt)
            set_wave_data(ctx.audio_buf)
            set_progress(0)
          }
        }}>
          <MenuItem value={0}>pcm_s16le_16000_mono</MenuItem>
          <MenuItem value={1}>audio</MenuItem>
        </Select>
        <h4>Info</h4>
        {context.current.audio_buf ?
          <p> {`Current/Total: ${(progress * context.current.audio_buf.duration).toPrecision(3)} / ${(context.current.audio_buf?.duration).toPrecision(3)}s`} </p> :
          <div />
        }
        <IconButton color="primary" component="label" onClick={async (e) => {
          if (!context.current.audio_buf) {
            console.error('Not Upload File or Parse Failed')
            return;
          }
          if (playing) {
            context.current.is_pause = true;
            context.current.audio_node?.stop();
          } else {
            let ctx = context.current;
            if (!ctx.audio_ctx) {
              return;
            }
            if (ctx.is_pause) {
              ctx.is_pause = false;
            }
            ctx.audio_node = ctx.audio_ctx.createBufferSource();
            if (ctx.audio_node && ctx.audio_buf) {
              ctx.audio_node.buffer = ctx.audio_buf;
              ctx.audio_node?.connect(ctx.audio_ctx.destination);
              let dur = ctx.audio_buf.duration
              ctx.audio_node?.addEventListener("ended", (e) => {
                if (!context.current.is_pause) {
                  set_progress(0)
                }
                set_playing(false);
              })
              ctx.audio_node?.start(0, progress * ctx.audio_buf.duration);
              ctx.start_ts = ctx.audio_ctx.currentTime - progress * ctx.audio_buf.duration;
              set_playing(true)
            } else {
              console.error('Create AudioBufferSourceNode Failed')
            }
          }
        }}>
          {playing ? <PauseCircleFilled /> : <PlayCircleFilled />}
        </IconButton>
        <Grid >
          <TWave data={wave_data} progress={progress} onProgress={(e) => {
            if (!playing) {
              set_progress(e);
            }
          }} />
        </Grid>
      </Grid>
    </Container >)
}
