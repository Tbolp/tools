export class RenderBuilder {

  private vs_src: string = `#version 300 es
  precision mediump float;
  layout(location = 0) in vec2 pos;
  layout(location = 1) in vec2 tex;
  out vec2 _pos;
  out vec2 _tex;
  void main() {
    gl_Position = vec4(pos, 1.0, 1.0);
    _pos = pos;
    _tex = tex;
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1
      , 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0
    ]), gl.STATIC_DRAW)
    let vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 6 * 4 * 2)
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

export class Render {

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

  get program() {
    return this.prog
  }

  get context() {
    return this.gl
  }
}