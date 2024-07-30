import { Button, Container, Stack } from "@mui/material";
import { useEffect, useRef } from "react";

class RenderBuilder {

  private vs_src: string = `#version 300 es
  precision mediump float;
  layout(location = 0) in vec2 pos;
  out vec2 _pos;
  void main() {
    gl_Position = vec4(pos, 1.0, 1.0);
    _pos = pos;
  }
  `
  public fs_src: string = `#version 300 es
  precision mediump float;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
  `
  public gl: WebGL2RenderingContext | null = null

  build(): Render {
    let gl = this.gl!
    let prog = this.create_program()
    let vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    let vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return new Render(prog, vao, gl)
  }

  private create_program() {
    let gl = this.gl!
    let prog = gl.createProgram()!
    // 创建并编译Vertex Shader
    let vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, this.vs_src)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(vs))
      gl.deleteShader(vs)
    }
    gl.attachShader(prog, vs)
    // 创建并编译Fragment Shader
    let fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, this.fs_src)
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
}

class Render {

  constructor(private prog: WebGLProgram, private vao: WebGLVertexArrayObject, private gl: WebGL2RenderingContext) {
  }

  render() {
    this.gl.useProgram(this.prog)
    this.gl.bindVertexArray(this.vao)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
  }

  set transform(val: DOMMatrix) {
    let loc = this.gl.getUniformLocation(this.prog, 'tran')!
    this.gl.uniformMatrix2x3fv(loc, false, [
      val.a, val.c, val.e,
      val.b, val.d, val.f
    ])
  }
}

export default function Mandelbrot() {
  let canvas_ref = useRef<HTMLCanvasElement | null>(null)
  let render_ref = useRef<Render | null>(null)
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
    transfrom.scaleSelf(canvas_ref.current!.width / canvas_ref.current!.height, 1)
    let render = build.build()
    render_ref.current = render
    render.transform = transfrom
    render.render()
    canvas_ref.current!.onwheel = (ev) => {
      console.log(ev.offsetX, ev.offsetY, ev)
      let x = ev.offsetX / canvas_ref.current!.width * 2 - 1
      let y = ev.offsetY / canvas_ref.current!.height * 2 - 1
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
          render_ref.current.transform = new DOMMatrix().scaleSelf(canvas_ref.current!.width / canvas_ref.current!.height, 1)
          render_ref.current.render()
        }
      }}>Reset</Button>
    </Stack>
  )

}