import { Label } from "@mui/icons-material";
import { Button, Container, Grid, Slider, Stack, TextField } from "@mui/material";
import { useEffect, useRef, } from "react";

let vs_src = `#version 300 es
precision mediump float;
layout(location = 0) in vec2 pos;
void main() {
  gl_Position = vec4(pos, 1.0, 1.0);
}
`

let fs_src = `#version 300 es
precision mediump float;
uniform vec2 c;
uniform int count;
uniform vec2 tran;
out vec4 fragColor;

vec2 multi(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float norm(vec2 a) {
  return a.x * a.x + a.y * a.y;
}

vec3 calc(vec2 z) {
  vec3 color1 = vec3(1.0, 1.0, 0.9);
  vec3 color2 = vec3(0.05, 0.05, 0.0);
  float s = 1.0;
  for (int i = 0; i < count; ++i) {
    // z = multi(multi(z, z), multi(z, z)) + c;
    z = multi(z, z) + c;
    if (norm(z) > 4.0) {
      s = float(i) / float(count);
      break;
    }
  }
  return color1*s+color2*(1.0-s);
}


void main() {
  fragColor = vec4(calc((gl_FragCoord.xy - tran)*1.0/min(tran.x, tran.y)), 1.0);
}
`


let vbo: WebGLBuffer
let vao: WebGLVertexArrayObject

// 创建渲染流水线
function createProgram(gl: WebGLRenderingContext) {
  let prog = gl.createProgram()!
  // 创建并编译Vertex Shader
  let vs = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vs, vs_src)
  gl.compileShader(vs)
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(vs))
    gl.deleteShader(vs)
  }
  gl.attachShader(prog, vs)
  // 创建并编译Fragment Shader
  let fs = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fs, fs_src)
  gl.compileShader(fs)
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(fs))
    gl.deleteShader(fs)
  }
  gl.attachShader(prog, fs)
  // 链接Program
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(prog))
  }
  gl.useProgram(prog)
  return prog
}

function render(gl: WebGL2RenderingContext, prog: WebGLProgram, param: number[]) {
  console.log(param)
  let loc = gl.getUniformLocation(prog, 'c')
  gl.uniform2f(loc, param[0], param[1])
  loc = gl.getUniformLocation(prog, 'count')
  gl.uniform1i(loc, param[2])
  gl.bindVertexArray(vao)
  // 清除背景色
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  // 绘制三角形
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

export default function Julia() {
  let canvas_ref = useRef<HTMLCanvasElement>(null)
  let gl_ref = useRef<WebGL2RenderingContext | null>(null)
  let prog_ref = useRef<WebGLProgram | null>(null)
  let param_ref = useRef([-1.283, 0.057, 188])
  useEffect(() => {
    let elt = canvas_ref.current!
    let gl = elt.getContext('webgl2')!
    let prog = createProgram(gl)
    // 创建Vertex Array Object(VAO)
    vao = gl.createVertexArray()!
    // 创建Vertex Buffer Object(VBO)
    vbo = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW)
    // 绑定VAO记录操作
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    // 设置视窗
    gl.viewport(0, 0, elt.width, elt.height)
    let loc = gl.getUniformLocation(prog, 'tran')
    gl.uniform2f(loc, elt.width * 0.5, elt.height * 0.5)
    gl_ref.current = gl
    prog_ref.current = prog
    render(gl, prog, param_ref.current)
  }, [])
  return (
    <Container sx={{ mb: '1em', mt: '1em' }}>
      <Grid>
        <Grid style={{ textAlign: "center" }}>
          <canvas ref={canvas_ref} width={1920 * 0.5} height={1080 * 0.5} />
        </Grid>
        <Stack>
          <Stack direction={'row'} sx={{ mb: 1 }} alignItems="center">
            <p style={{ whiteSpace: 'nowrap' }}>Real Part</p>
            <Slider min={-2} max={2} step={0.001} defaultValue={param_ref.current[0]} onChange={(_, val) => {
              param_ref.current[0] = val as number
              render(gl_ref.current!, prog_ref.current!, param_ref.current)
            }} />
          </Stack>
          <Stack direction={'row'} sx={{ mb: 1 }} alignItems="center">
            <p style={{ whiteSpace: 'nowrap' }}>Imag Part</p>
            <Slider min={-2} max={2} step={0.001} defaultValue={param_ref.current[1]} onChange={(_, val) => {
              param_ref.current[1] = val as number
              render(gl_ref.current!, prog_ref.current!, param_ref.current)
            }} />
          </Stack>
          <Stack direction={'row'} sx={{ mb: 1 }} alignItems="center">
            <p style={{ whiteSpace: 'nowrap' }}>Iter Count</p>
            <Slider min={0} max={200} defaultValue={param_ref.current[2]} onChange={(_, val) => {
              param_ref.current[2] = val as number
              render(gl_ref.current!, prog_ref.current!, param_ref.current)
            }} />
          </Stack>
        </Stack>
      </Grid>
    </Container >
  )
}
