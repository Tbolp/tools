import { Label, Download, RotateLeft } from "@mui/icons-material";
import { Button, Container, Grid, Slider, TextField, Paper, Typography, Box, Alert, IconButton, Tooltip, Stack, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import _ from "lodash";
import { useEffect, useRef, useState, useCallback } from "react";
import Markdown from "react-markdown";

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


let vbo: WebGLBuffer | null = null
let vao: WebGLVertexArrayObject | null = null

// Preset configurations
const presets = [
  { name: "Classic", real: -0.7, imag: 0.27015, iterations: 100 },
  { name: "Dragon", real: -0.8, imag: 0.156, iterations: 128 },
  { name: "Spiral", real: -0.4, imag: 0.6, iterations: 150 },
  { name: "Feather", real: -0.835, imag: -0.2321, iterations: 200 },
  { name: "Galaxy", real: 0.285, imag: 0.01, iterations: 188 },
]

// Create rendering pipeline
function createProgram(gl: WebGL2RenderingContext) {
  let prog = gl.createProgram()!
  // Create and compile Vertex Shader
  let vs = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vs, vs_src)
  gl.compileShader(vs)
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the vertex shader: ' + gl.getShaderInfoLog(vs))
    gl.deleteShader(vs)
    throw new Error('Vertex shader compilation failed')
  }
  gl.attachShader(prog, vs)
  // Create and compile Fragment Shader
  let fs = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fs, fs_src)
  gl.compileShader(fs)
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the fragment shader: ' + gl.getShaderInfoLog(fs))
    gl.deleteShader(fs)
    gl.deleteShader(vs)
    throw new Error('Fragment shader compilation failed')
  }
  gl.attachShader(prog, fs)
  // Link Program
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(prog))
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    throw new Error('Shader program linking failed')
  }
  gl.useProgram(prog)
  return prog
}

function render(gl: WebGL2RenderingContext, prog: WebGLProgram, param: number[]) {
  let loc = gl.getUniformLocation(prog, 'c')
  gl.uniform2f(loc, param[0], param[1])
  loc = gl.getUniformLocation(prog, 'count')
  gl.uniform1i(loc, param[2])
  if (vao) {
    gl.bindVertexArray(vao)
  }
  // Clear background color
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  // Draw triangles
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

export default function Julia() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const progRef = useRef<WebGLProgram | null>(null)
  const [realPart, setRealPart] = useState(-1.283)
  const [imagPart, setImagPart] = useState(0.057)
  const [iterCount, setIterCount] = useState(188)
  const [isWebGLSupported, setIsWebGLSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 540 })

  // Responsive canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const containerWidth = window.innerWidth > 1200 ? window.innerWidth * 0.6 : window.innerWidth * 0.9
      const containerHeight = containerWidth * 0.5625 // 16:9 aspect ratio
      setCanvasSize({
        width: Math.min(containerWidth, 960),
        height: Math.min(containerHeight, 540)
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  useEffect(() => {
    const elt = canvasRef.current
    if (!elt || glRef.current) return // Don't reinitialize if WebGL context already exists

    try {
      const gl = elt.getContext('webgl2')
      if (!gl) {
        console.error('WebGL2 not supported')
        setIsWebGLSupported(false)
        setIsLoading(false)
        return
      }

      console.log('Initializing WebGL context...')
      const prog = createProgram(gl)

      // Create Vertex Array Object(VAO)
      vao = gl.createVertexArray()
      if (!vao) {
        throw new Error('Failed to create VAO')
      }
      // Create Vertex Buffer Object(VBO)
      vbo = gl.createBuffer()
      if (!vbo) {
        throw new Error('Failed to create VBO')
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW)
      // Bind VAO to record operations
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.bindVertexArray(null)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)

      // Set viewport
      gl.viewport(0, 0, elt.width, elt.height)
      const loc = gl.getUniformLocation(prog, 'tran')
      gl.uniform2f(loc, elt.width * 0.5, elt.height * 0.5)

      glRef.current = gl
      progRef.current = prog

      console.log('WebGL initialized successfully')

      // Initial render
      _.debounce(render, 16)(gl, prog, [realPart, imagPart, iterCount])

      // Set loading to false only after successful initialization
      setIsLoading(false)
    } catch (error) {
      console.error('WebGL initialization error:', error)
      setIsWebGLSupported(false)
      setIsLoading(false)
    }
  }, []) // Remove canvasSize dependency to prevent re-initialization

  // Update viewport when canvas size changes
  useEffect(() => {
    if (glRef.current && progRef.current && canvasRef.current) {
      const gl = glRef.current
      gl.viewport(0, 0, canvasSize.width, canvasSize.height)
      const loc = gl.getUniformLocation(progRef.current, 'tran')
      gl.uniform2f(loc, canvasSize.width * 0.5, canvasSize.height * 0.5)
      _.debounce(render, 16)(gl, progRef.current, [realPart, imagPart, iterCount])
    }
  }, [canvasSize, realPart, imagPart, iterCount])

  // Cleanup resources
  useEffect(() => {
    return () => {
      if (glRef.current && vbo) {
        glRef.current.deleteBuffer(vbo)
      }
      if (glRef.current && vao) {
        glRef.current.deleteVertexArray(vao)
      }
      if (glRef.current && progRef.current) {
        glRef.current.deleteProgram(progRef.current)
      }
      glRef.current = null
    }
  }, [])

  const handlePresetChange = (presetIndex: number) => {
    const preset = presets[presetIndex]
    setRealPart(preset.real)
    setImagPart(preset.imag)
    setIterCount(preset.iterations)
  }


  return (
    <Container maxWidth="lg" sx={{ mb: '2em', mt: '2em' }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Julia Set Fractal Generator
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>How to use:</strong> Adjust the Real and Imaginary parts of the complex number c, or choose from presets. Increase iterations for more detail.
        </Alert>
      </Paper>

      {!isWebGLSupported ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
          <Typography variant="h6" color="error" gutterBottom>
            WebGL Not Supported
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your browser doesn't support WebGL2. Please try a modern browser to use this fractal generator.
          </Typography>
        </Paper>
      ) : (
        <Stack>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
                1. Julia Set Parameters
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fine-tune fractal appearance using the controls below and view the generated Julia set in real-time
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Real Part: {realPart.toFixed(3)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                      Controls horizontal displacement of the fractal. Values range from -2 to 2.
                    </Typography>
                    <Stack alignItems={'center'} justifyContent={'space-between'} direction={'row'}>
                      <Slider
                        min={-2}
                        max={2}
                        step={0.001}
                        value={realPart}
                        onChange={(_, val) => {
                          setRealPart(val as number)
                        }}
                        valueLabelDisplay="auto"
                        sx={{ minWidth: 200 }}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Imaginary Part: {imagPart.toFixed(3)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                      Controls vertical displacement of the fractal. Values range from -2 to 2.
                    </Typography>
                    <Stack alignItems={'center'} justifyContent={'space-between'} direction={'row'}>
                      <Slider
                        min={-2}
                        max={2}
                        step={0.001}
                        value={imagPart}
                        onChange={(_, val) => {
                          console.log(val)
                          setImagPart(val as number)
                        }}
                        valueLabelDisplay="auto"
                        sx={{ minWidth: 200 }}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Iteration Count: {iterCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                      Controls level of detail. Higher values create more intricate patterns.
                    </Typography>
                    <Stack alignItems={'center'} justifyContent={'space-between'} direction={'row'}>
                      <Slider
                        min={0}
                        max={200}
                        step={1}
                        value={iterCount}
                        onChange={(_, val) => {
                          setIterCount(val as number)
                        }}
                        valueLabelDisplay="auto"
                        sx={{ minWidth: 200 }}
                      />
                    </Stack>
                  </Box>
                </Stack>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                    Presets
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose from pre-configured interesting fractals
                  </Typography>

                  <FormControl fullWidth>
                    <InputLabel id="preset-select-label">Select Preset</InputLabel>
                    <Select
                      labelId="preset-select-label"
                      onChange={(e) => handlePresetChange(e.target.value as number)}
                      label="Select Preset"
                    >
                      {presets.map((preset, index) => (
                        <MenuItem key={index} value={index}>
                          {preset.name} (Real: {preset.real}, Imag: {preset.imag})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
                  2. Fractal Visualization
                </Typography>
              </Box>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                border: '2px solid #e0e0e0'
              }}>
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            </Grid>
          </Paper>
        </Stack>
      )}
    </Container >
  )
}
