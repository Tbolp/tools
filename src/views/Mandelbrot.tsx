import { Button, Container, Stack, Typography, Paper, Box, Alert } from "@mui/material";
import { useEffect, useRef } from "react";
import { Render, RenderBuilder } from "../utils/Render";
import _ from "lodash";


export default function Mandelbrot() {
  let canvas_ref = useRef<HTMLCanvasElement | null>(null)
  let render_ref = useRef<Render | null>(null)
  let transform_ref = useRef<DOMMatrix>(new DOMMatrix())
  
  // Throttled render function using lodash
  const throttledRender = useRef(
    _.throttle((render: Render) => {
      render.render()
    }, 16)
  ).current
  
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
    // Use 16:9 aspect ratio
    transfrom.scaleSelf(16 / 9, 1)
    let render = build.build()
    render_ref.current = render
    render.transform = transfrom
    render.render()
    canvas_ref.current!.onwheel = (ev) => {
      let x = ev.offsetX / canvas_ref.current!.clientWidth * 2 - 1
      let y = ev.offsetY / canvas_ref.current!.clientHeight * 2 - 1
      let transfrom = transform_ref.current
      transfrom.translateSelf(x, -y)
      if (ev.deltaY < 0) {
        transfrom.scaleSelf(0.9, 0.9)
      } else {
        transfrom.scaleSelf(1.1, 1.1)
      }
      transfrom.translateSelf(-x, y)
      render.transform = transfrom
      throttledRender(render)
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
          let x = (ev.offsetX - first_pos[0]) / canvas_ref.current!.clientWidth * 2
          let y = (ev.offsetY - first_pos[1]) / canvas_ref.current!.clientHeight * 2
          render.transform = transfrom.translate(-x, y)
          throttledRender(render)
        }
      } else {
        if (first_pos[0] !== -100) {
          let x = (ev.offsetX - first_pos[0]) / canvas_ref.current!.clientWidth * 2
          let y = (ev.offsetY - first_pos[1]) / canvas_ref.current!.clientHeight * 2
          transfrom.translateSelf(-x, y)
          render.transform = transfrom
          render.render()
        }
        first_pos[0] = -100
      }
    }

    // Touch event handlers
    let touch_start_pos = [-100, -1]
    let last_pinch_distance = -1
    
    canvas_ref.current!.ontouchstart = (ev) => {
      ev.preventDefault()
      if (ev.touches.length === 1) {
        // Single touch - prepare for pan
        const rect = canvas_ref.current!.getBoundingClientRect()
        touch_start_pos[0] = ev.touches[0].clientX - rect.left
        touch_start_pos[1] = ev.touches[0].clientY - rect.top
      } else if (ev.touches.length === 2) {
        // Two fingers - prepare for pinch zoom
        const dx = ev.touches[0].clientX - ev.touches[1].clientX
        const dy = ev.touches[0].clientY - ev.touches[1].clientY
        last_pinch_distance = Math.sqrt(dx * dx + dy * dy)
      }
    }

    canvas_ref.current!.ontouchmove = (ev) => {
      ev.preventDefault()
      let transfrom = transform_ref.current
      
      if (ev.touches.length === 1 && touch_start_pos[0] !== -100) {
        // Single touch - pan
        const rect = canvas_ref.current!.getBoundingClientRect()
        const currentX = ev.touches[0].clientX - rect.left
        const currentY = ev.touches[0].clientY - rect.top
        
        let x = (currentX - touch_start_pos[0]) / canvas_ref.current!.clientWidth * 2
        let y = (currentY - touch_start_pos[1]) / canvas_ref.current!.clientHeight * 2
        render.transform = transfrom.translate(-x, y)
        throttledRender(render)
      } else if (ev.touches.length === 2) {
        // Two fingers - pinch zoom
        const dx = ev.touches[0].clientX - ev.touches[1].clientX
        const dy = ev.touches[0].clientY - ev.touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (last_pinch_distance > 0) {
          const rect = canvas_ref.current!.getBoundingClientRect()
          // Calculate center point between two fingers
          const centerX = ((ev.touches[0].clientX + ev.touches[1].clientX) / 2 - rect.left) / canvas_ref.current!.clientWidth * 2 - 1
          const centerY = ((ev.touches[0].clientY + ev.touches[1].clientY) / 2 - rect.top) / canvas_ref.current!.clientHeight * 2 - 1
          
          const scale = distance / last_pinch_distance
          transfrom.translateSelf(centerX, -centerY)
          transfrom.scaleSelf(scale, scale)
          transfrom.translateSelf(-centerX, centerY)
          render.transform = transfrom
          throttledRender(render)
        }
        last_pinch_distance = distance
      }
    }

    canvas_ref.current!.ontouchend = (ev) => {
      ev.preventDefault()
      let transfrom = transform_ref.current
      
      if (ev.touches.length === 0) {
        // All touches ended - finalize pan
        if (touch_start_pos[0] !== -100) {
          const rect = canvas_ref.current!.getBoundingClientRect()
          const currentX = ev.changedTouches[0].clientX - rect.left
          const currentY = ev.changedTouches[0].clientY - rect.top
          
          let x = (currentX - touch_start_pos[0]) / canvas_ref.current!.clientWidth * 2
          let y = (currentY - touch_start_pos[1]) / canvas_ref.current!.clientHeight * 2
          transfrom.translateSelf(-x, y)
          render.transform = transfrom
          render.render()
        }
        touch_start_pos[0] = -100
        last_pinch_distance = -1
      } else if (ev.touches.length === 1) {
        // One finger lifted from pinch - reset for potential pan
        last_pinch_distance = -1
        const rect = canvas_ref.current!.getBoundingClientRect()
        touch_start_pos[0] = ev.touches[0].clientX - rect.left
        touch_start_pos[1] = ev.touches[0].clientY - rect.top
      }
    }
  })

  return (
    <Container maxWidth="lg" sx={{ mb: '2em', mt: '2em' }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Mandelbrot Set Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore the infinite beauty of the Mandelbrot set fractal with interactive zoom and pan controls.
          Discover intricate patterns at every scale.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>How to use:</strong> Scroll to zoom in/out, drag to pan around the fractal, and click Reset to return to the initial view.
        </Alert>
      </Paper>

      {/* Interactive Visualization Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Interactive Fractal Visualization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use your mouse to explore the fractal in real-time
        </Typography>

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          p: 2,
          borderRadius: 1,
          border: '2px solid #e0e0e0',
          mb: 2
        }}>
          <canvas ref={canvas_ref} width={1600} height={900} style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            cursor: 'grab'
          }} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => {
              if (render_ref.current) {
                transform_ref.current = new DOMMatrix().scaleSelf(16 / 9, 1)
                render_ref.current.transform = transform_ref.current
                render_ref.current.render()
              }
            }}
          >
            Reset View
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

