import { Container } from "@mui/material";
import { useEffect, useRef } from "react"

export default function TWave(props: { data: AudioBuffer | null, progress?: number, onProgress?: (value: number) => void }) {
  let canvas_ref = useRef<HTMLCanvasElement>(null);
  let canvas1_ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let elt = canvas_ref.current;
    if (elt && props.data) {
      let ctx = elt.getContext('2d');
      if (ctx) {
        let f32_pcm = props.data.getChannelData(0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#00aaff';
        for (let i = 0; i < f32_pcm.length; i++) {
          ctx.fillRect(i / f32_pcm.length * ctx.canvas.width, 100, 1, f32_pcm[i] * 100);
        }
      }
    }
  }, [props.data])
  useEffect(() => {
    let elt = canvas1_ref.current;
    if (elt) {
      let ctx = elt.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (props.progress) {
          ctx.fillStyle = '#332211';
          ctx.fillRect(props.progress * ctx.canvas.width, 0, 1, ctx.canvas.height)
        }
      }
    }
  }, [props.progress])
  return (
    <Container>
      {props.data ?
        <div style={{ position: 'relative', width: '100%', height: 200 }}>
          <canvas ref={canvas_ref} width={1000} height={200} style={{ width: '100%', background: 'gray', position: 'absolute', top: 0, left: 0 }}></canvas>
          <canvas ref={canvas1_ref} width={1000} height={200} style={{ width: '100%', position: 'absolute', top: 0, left: 0 }} onClick={(e) => {
            if (props.onProgress) {
              let elt = e.target as HTMLCanvasElement
              let rect = elt.getBoundingClientRect();
              props.onProgress((e.clientX - rect.left) / (rect.width))
            }
          }}></canvas>
        </div>
        : <div />}
    </Container>
  )
}