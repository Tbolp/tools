import { Container, Slider, Stack } from "@mui/material";
import TUpload from "../components/TUpload";
import { useEffect, useRef, useState } from "react";
import { Render, RenderBuilder } from "../utils/Render";


function create_kernel(radius: number, sigma: number) {
  let sum = 0.0
  let kernel = []
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      let d = x * x + y * y
      let v = Math.exp(-d / (2.0 * sigma * sigma)) / (Math.PI * 2.0 * sigma * sigma)
      kernel.push(v)
      sum += v
    }
  }
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum
  }
  return kernel
}

function rerender(render: Render, radius: number, sigma: number) {
  console.log(radius, sigma)
  let gl = render.context
  let kernel = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, kernel)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, radius * 2 + 1, radius * 2 + 1, 0, gl.RED, gl.FLOAT, new Float32Array(create_kernel(radius, sigma)))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.uniform1i(gl.getUniformLocation(render.program, 'kernel'), 1)
  render.render()
}

export default function Gaussian() {
  let canvas_ref = useRef<HTMLCanvasElement | null>(null)
  let render_ref = useRef<Render | null>(null)
  let param_ref = useRef([10, 4.5])
  return (
    <Container sx={{ mb: '1em', mt: '1em' }}>
      <TUpload onChange={async (e) => {
        let file = e.target.files![0]
        let blob = new Blob([await file.arrayBuffer()], {
          type: file.type
        })
        let img = new Image()
        img.onload = () => {
          let c1 = canvas_ref.current!
          c1.width = img.width
          c1.height = img.height
          let builder = new RenderBuilder()
          let gl = canvas_ref.current!.getContext("webgl2")!
          if (gl.getExtension('OES_texture_float_linear') == null) {
            console.error('OES_texture_float_linear is not supported')
            return
          }
          builder.gl = gl
          builder.fs_src = `#version 300 es
          precision mediump float;
          in vec2 _tex;
          in vec2 _pos;
          out vec4 fragColor;
          uniform sampler2D tex;
          uniform sampler2D kernel;

          void main() {
            vec2 size = vec2(textureSize(tex, 0));
            vec2 kernel_size = vec2(textureSize(kernel, 0));
            vec2 dx = vec2(1.0 / size.x, 0.0);
            vec2 dy = vec2(0.0, 1.0 / size.y);
            vec2 kernel_dx = vec2(1.0 / kernel_size.x, 0.0);
            vec2 kernel_dy = vec2(0.0, 1.0 / kernel_size.y);
            float tmp_dx = kernel_size.x / 2.0;
            float tmp_dy = kernel_size.y / 2.0;
            for (float i = 0.0; i < kernel_size.x; i++) {
              for (float j = 0.0; j < kernel_size.y; j++) {
                vec4 color = texture(tex, _tex + (i-tmp_dx)*dx + (j-tmp_dy)*dy);
                float factor = texture(kernel, i*kernel_dx + j*kernel_dy).r;
                fragColor += color * factor;
              }
            }
            fragColor.a = 1.0;
          }
          `
          let render = builder.build()
          let tex = gl.createTexture()!
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.uniform1i(gl.getUniformLocation(render.program, 'tex'), 0)
          rerender(render, param_ref.current[0], param_ref.current[1])
          render_ref.current = render
        }
        img.src = URL.createObjectURL(blob)
      }} />
      <Stack direction={'row'} sx={{ mb: 1 }} alignItems="center">
        <p style={{ whiteSpace: 'nowrap' }}>Radius</p>
        <Slider min={0} max={20} step={1} defaultValue={param_ref.current[0]} onChange={(_, val) => {
          param_ref.current[0] = val as number
          if (render_ref.current) {
            rerender(render_ref.current, param_ref.current[0], param_ref.current[1])
          }
        }} />
      </Stack>
      <Stack direction={'row'} sx={{ mb: 1 }} alignItems="center">
        <p style={{ whiteSpace: 'nowrap' }}>Sigma</p>
        <Slider min={0.1} max={20} step={0.1} defaultValue={param_ref.current[1]} onChange={(_, val) => {
          param_ref.current[1] = val as number
          if (render_ref.current) {
            rerender(render_ref.current, param_ref.current[0], param_ref.current[1])
          }
        }} />
      </Stack>
      <canvas ref={canvas_ref} />
    </Container>
  )
}