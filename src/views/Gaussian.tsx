import { Container, Slider, Stack, Typography, Paper, Box, Alert, Grid } from "@mui/material";
import TUpload from "../components/TUpload";
import { useEffect, useRef, useState } from "react";
import { Render, RenderBuilder } from "../utils/Render";
import Markdown from "react-markdown";
import { TSlider } from "../components/TSlider";


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
  const [hasImage, setHasImage] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  
  return (
    <Container maxWidth="lg" sx={{ mb: '2em', mt: '2em' }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Gaussian Blur Filter
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Apply professional Gaussian blur effect to your images with real-time preview. 
          Adjust the blur radius and intensity to achieve the perfect result.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>How to use:</strong> Upload an image below, then adjust the Radius and Sigma sliders to control the blur effect.
        </Alert>
      </Paper>

      {/* Upload Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          1. Upload Image
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select an image file to apply Gaussian blur
        </Typography>
        <TUpload onFile={async (file) => {
          let blob = new Blob([await file.arrayBuffer()], {
            type: file.type
          })
          let img = new Image()
          img.onload = () => {
            if (!canvas_ref.current) {
              console.error('Canvas not available')
              return
            }
            
            // Save original image for comparison
            setOriginalImage(img.src)
            
            // Clear existing render context if it exists
            if (render_ref.current) {
              const gl = render_ref.current.context
              // Clean up old textures and resources
              const numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
              for (let i = 0; i < numTextureUnits; i++) {
                gl.activeTexture(gl.TEXTURE0 + i)
                gl.bindTexture(gl.TEXTURE_2D, null)
              }
            }
            
            let c1 = canvas_ref.current
            c1.width = img.width
            c1.height = img.height
            
            let builder = new RenderBuilder()
            let gl = canvas_ref.current.getContext("webgl2", { preserveDrawingBuffer: true })
            if (!gl) {
              console.error('WebGL2 not supported')
              return
            }
            if (gl.getExtension('OES_texture_float_linear') == null) {
              console.error('OES_texture_float_linear is not supported')
              return
            }
            
            // Clear the canvas
            gl.viewport(0, 0, img.width, img.height)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            
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
            setHasImage(true)
          }
          img.src = URL.createObjectURL(blob)
        }} />
      </Paper>

      {/* Controls Section */}
      {hasImage && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            2. Adjust Blur Parameters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fine-tune the blur effect using the controls below
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Blur Radius (pixels)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
              Controls the size of the blur area. Higher values create stronger blur.
            </Typography>
            <TSlider 
              text="Radius" 
              defaultValue={param_ref.current[0]} 
              min={0} 
              max={20} 
              step={1} 
              onChange={(val) => {
                param_ref.current[0] = val
                if (render_ref.current) {
                  rerender(render_ref.current, param_ref.current[0], param_ref.current[1])
                }
              }} 
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Blur Intensity (Sigma)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
              Controls the intensity of the blur effect. Lower values create sharper falloff.
            </Typography>
            <TSlider 
              text="Sigma" 
              defaultValue={param_ref.current[1]} 
              min={0.1} 
              max={20} 
              step={0.1} 
              onChange={(val) => {
                param_ref.current[1] = val as number
                if (render_ref.current) {
                  rerender(render_ref.current, param_ref.current[0], param_ref.current[1])
                }
              }} 
            />
          </Box>
        </Paper>
      )}

      {/* Preview Section */}
      <Paper elevation={2} sx={{ p: 3, display: hasImage ? 'block' : 'none' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          3. Preview & Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Compare the original image with the blurred result
        </Typography>
        
        <Grid container spacing={3}>
          {/* Original Image */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                Original Image
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                border: '2px solid #e0e0e0'
              }}>
                {originalImage && (
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }} 
                  />
                )}
              </Box>
            </Box>
          </Grid>
          
          {/* Blurred Image */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                Blurred Result
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                border: '2px solid #1976d2'
              }}>
                <canvas ref={canvas_ref} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {!hasImage && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
          <Typography variant="h6" color="text.secondary">
            No image loaded
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please upload an image to get started
          </Typography>
        </Paper>
      )}
    </Container>
  )
}

let desp = `
# Gaussian Blur Filter
- Radius: Blur radius in pixels
- Sigma: Blur intensity factor`