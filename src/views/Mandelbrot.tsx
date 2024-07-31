import { Button, Container, Stack } from "@mui/material";
import { useEffect, useRef } from "react";
import { Render, RenderBuilder } from "../utils/Render";


export default function Mandelbrot() {
  let canvas_ref = useRef<HTMLCanvasElement | null>(null)
  let render_ref = useRef<Render | null>(null)
  let transform_ref = useRef<DOMMatrix>(new DOMMatrix())
  useEffect(() => {
    let build = new RenderBuilder()
    build.gl = canvas_ref.current?.getContext('webgl2')!
    build.fs_src = `#version 300 es
    precision mediump float;
    in vec2 _pos;
    out vec4 fragColor;
    uniform mat2x3 tran;
    
    #define complex vec2
    
    complex multi(complex a, complex b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
    }
    
    float norm(complex a) {
      return a.x*a.x+a.y*a.y;
    }
    
    vec3 calc(complex pt) {
      complex z = complex(0.0, 0.0);
      vec3 color1 = vec3(1.0, 1.0, 0.66);
      vec3 color2 = vec3(0.05, 0.05, 0.0);
      int count = 10000;
      for (int i = 0; i < count; ++i) {
        z = multi(z, z) + pt;
        if (norm(z) > 2.0) {
          float s = float(i) / float(count);
          return color1*s+color2*(1.0-s);
        }
      }
      float s = norm(z) / 2.0;
      return color1*(1.0-s)+color2*s;
    }
    
    void main() {
      fragColor = vec4(calc(vec3(_pos, 1.0)*tran), 1.0);
    }
    `
    let transfrom = new DOMMatrix()
    transform_ref.current = transfrom
    transfrom.scaleSelf(canvas_ref.current!.width / canvas_ref.current!.height, 1)
    let render = build.build()
    render_ref.current = render
    render.transform = transfrom
    render.render()
    canvas_ref.current!.onwheel = (ev) => {
      console.log(ev.offsetX, ev.offsetY, ev)
      let x = ev.offsetX / canvas_ref.current!.width * 2 - 1
      let y = ev.offsetY / canvas_ref.current!.height * 2 - 1
      let transfrom = transform_ref.current
      transfrom.translateSelf(x, -y)
      if (ev.deltaY < 0) {
        transfrom.scaleSelf(0.9, 0.9)
      } else {
        transfrom.scaleSelf(1.1, 1.1)
      }
      transfrom.translateSelf(-x, y)
      render.transform = transfrom
      render.render()
      return false
    }
    let first_pos = [-100, -1]
    canvas_ref.current!.onmousemove = (ev) => {
      let transfrom = transform_ref.current
      if (ev.buttons === 1) {
        if (first_pos[0] === -100) {
          first_pos[0] = ev.offsetX
          first_pos[1] = ev.offsetY
        } else {
          let x = (ev.offsetX - first_pos[0]) / canvas_ref.current!.width * 2
          let y = (ev.offsetY - first_pos[1]) / canvas_ref.current!.height * 2
          render.transform = transfrom.translate(-x, y)
          render.render()
        }
      } else {
        if (first_pos[0] !== -100) {
          let x = (ev.offsetX - first_pos[0]) / canvas_ref.current!.width * 2
          let y = (ev.offsetY - first_pos[1]) / canvas_ref.current!.height * 2
          transfrom.translateSelf(-x, y)
          render.transform = transfrom
          render.render()
        }
        first_pos[0] = -100
      }
    }
  })

  return (
    <Stack textAlign='center'>
      <Container>
        <canvas ref={canvas_ref} width={600} height={400} />
      </Container>
      <Button onClick={() => {
        if (render_ref.current) {
          transform_ref.current = new DOMMatrix().scaleSelf(canvas_ref.current!.width / canvas_ref.current!.height, 1)
          render_ref.current.transform = transform_ref.current
          render_ref.current.render()
        }
      }}>Reset</Button>
    </Stack>
  )

}