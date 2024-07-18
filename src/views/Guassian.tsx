import { Container } from "@mui/material";
import TUpload from "../components/TUpload";
import { useRef, useState } from "react";

let vs_src = `#version 300 es
precision mediump float;
layout(location = 0) in vec2 pos;
layout(location = 1) in vec2 uv;
out vec2 _uv;
void main() {
  gl_Position = vec4(pos, 1.0, 1.0);
  _uv = uv;
}
`

let fs_src = `#version 300 es
precision mediump float;
in vec2 _uv;
out vec4 fragColor;
uniform sampler2D tex;

void main() {
  ivec2 size = textureSize(tex, 0);
  fragColor = texture(tex, _uv);
}
`

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

function initGL(gl: WebGL2RenderingContext) {
  let prog = createProgram(gl)
  // 创建Vertex Array Object(VAO)
  let vao = gl.createVertexArray()!
  // 创建Vertex Buffer Object(VBO)
  let vbo = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  let vbo2 = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo2)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0]), gl.STATIC_DRAW)
  // 绑定VAO记录操作
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo2)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)
  //
  let tex = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.uniform1i(gl.getUniformLocation(prog, 'tex'), 0)
  return tex;
}

export default function Guassian() {
  let canvas_ref = useRef<HTMLCanvasElement | null>(null)
  let [width, set_width] = useState(0)
  let [height, set_height] = useState(0)
  return (
    <Container>
      <TUpload onChange={async (e) => {
        let file = e.target.files![0]
        let blob = new Blob([await file.arrayBuffer()], {
          type: file.type
        })
        let img = new Image
        img.onload = () => {
          let c1 = canvas_ref.current!
          c1.width = img.width
          c1.height = img.height
          let gl = c1.getContext('webgl2')!
          let tex = initGL(gl)
          gl.clearColor(0, 0, 0, 1)
          // 设置视窗
          gl.viewport(0, 0, img.width, img.height)
          gl.clear(gl.COLOR_BUFFER_BIT)

          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

          gl.drawArrays(gl.TRIANGLES, 0, 6)
        }
        img.src = URL.createObjectURL(blob)
      }} />
      <canvas ref={canvas_ref} style={{
        width: '100%'
      }} width={width} height={height} />
    </Container>
  )
}