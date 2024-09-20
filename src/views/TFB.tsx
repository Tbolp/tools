import { Container } from "@mui/material";
import { useEffect, useRef } from "react";

export default function TFB() {
  let canvas_ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    let gl = canvas_ref.current!.getContext('webgl2')!
    let prog = gl.createProgram()!
    let vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, `#version 300 es
    precision mediump float;
    in float in_val;
    out float out_val;
    void main() {
      out_val = sqrt(in_val);
    }
    `)
    gl.compileShader(vs)
    gl.attachShader(prog, vs)
    let fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, `#version 300 es
    precision mediump float;
    out vec4 fragColor;
    void main() {
      fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }`)
    gl.compileShader(fs)
    gl.attachShader(prog, fs)
    gl.transformFeedbackVaryings(prog, ['out_val'], gl.INTERLEAVED_ATTRIBS)
    gl.linkProgram(prog)
    gl.useProgram(prog)
    let vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    let vbo = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 4, 9, 16]), gl.STATIC_DRAW)
    let loc = gl.getAttribLocation(prog, 'in_val')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0)
    let tbo = gl.createBuffer()!
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tbo)
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, 4 * 4, gl.DYNAMIC_COPY)
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tbo)
    gl.bindVertexArray(null)
    gl.bindVertexArray(vao)
    gl.beginTransformFeedback(gl.POINTS)
    gl.drawArrays(gl.POINTS, 0, 4)
    gl.endTransformFeedback()
    gl.flush()
    let out = new Float32Array(4)
    gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, out, 0)
    gl.deleteBuffer(vbo)
    gl.deleteBuffer(tbo)
    console.log(out)
  }, [])
  return (
    <Container>
      <canvas ref={canvas_ref} />
    </Container>
  )
}