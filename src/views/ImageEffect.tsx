import { Button, Container, Grid } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import TUpload from "../components/TUpload";

function getPixel(data: ImageData, r: number, c: number) {
  if (r < 0 || c < 0) {
    return new Uint8ClampedArray(4)
  }
  if (r >= data.height || c >= data.width) {
    return new Uint8ClampedArray(4)
  }
  return data.data.slice(r * data.width * 4 + c * 4, r * data.width * 4 + (c + 1) * 4)
}

function setPixel(data: ImageData, r: number, c: number, v: [number, number, number, number]) {
  if (r < 0 || c < 0) {
    return
  }
  if (r >= data.height || c >= data.width) {
    return
  }
  data.data[r * data.width * 4 + c * 4] = v[0]
  data.data[r * data.width * 4 + c * 4 + 1] = v[1]
  data.data[r * data.width * 4 + c * 4 + 2] = v[2]
  data.data[r * data.width * 4 + c * 4 + 3] = v[3]
}


// 颜色阶梯化
export function convert(c1: HTMLCanvasElement, c2: HTMLCanvasElement) {
  let ctx1 = c1.getContext('2d')
  if (!ctx1) {
    console.error('context error')
    return
  }
  c2.width = c1.width
  c2.height = c1.height
  let image_data = ctx1.getImageData(0, 0, c1.width, c1.height)
  let ctx2 = c2.getContext('2d')
  if (!ctx2) {
    console.error('context error')
    return
  }
  for (let i = 0; i < c1.height; ++i) {
    for (let j = 0; j < c1.width; ++j) {
      let pixel = getPixel(image_data, i, j)
      let r = pixel[0]
      let g = pixel[1]
      let b = pixel[2]
      let a = pixel[3]
      let bit = 8
      let tmp = Math.floor(255 / bit)
      r = Math.floor(r / tmp) * tmp
      g = Math.floor(g / tmp) * tmp
      b = Math.floor(b / tmp) * tmp
      setPixel(image_data, i, j, [r, g, b, a])
    }
  }
  ctx2.putImageData(image_data, 0, 0)
}

function guass_kernel(sigma: number, radius: number) {
  let kernel = []
  let sum = 0
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      let v = 1 / (2 * Math.PI * sigma * sigma) * Math.exp(-(i * i + j * j) / (2 * sigma * sigma))
      kernel.push(v)
      sum += v
    }
  }
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum
  }
  return kernel
}

// 高斯模糊
export function convert2(c1: HTMLCanvasElement, c2: HTMLCanvasElement) {
  let ctx1 = c1.getContext('2d')
  if (!ctx1) {
    console.error('context error')
    return
  }
  c2.width = c1.width
  c2.height = c1.height
  let image_data = ctx1.getImageData(0, 0, c1.width, c1.height)
  let image_data2 = new ImageData(c1.width, c1.height)
  let ctx2 = c2.getContext('2d')
  if (!ctx2) {
    console.error('context error')
    return
  }
  let radius = 3
  let kernel = guass_kernel(20, radius)
  for (let i = 0; i < c1.height; ++i) {
    for (let j = 0; j < c1.width; ++j) {
      let pixels = []

      for (let x = i - radius; x <= i + radius; ++x) {
        for (let y = j - radius; y <= j + radius; ++y) {
          pixels.push(getPixel(image_data, x, y))
        }
      }
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < kernel.length; k++) {
        r = r + kernel[k] * pixels[k][0]
        g = g + kernel[k] * pixels[k][1]
        b = b + kernel[k] * pixels[k][2]
      }
      setPixel(image_data2, i, j, [r, g, b, 255])
    }
  }
  ctx2.putImageData(image_data2, 0, 0)
}

export default function ImageEffect() {
  let canvas_ref = useRef<HTMLCanvasElement>(null)
  let canvas2_ref = useRef<HTMLCanvasElement>(null)
  return (
    <Container>
      <TUpload onFile={async (file) => {
        let blob = new Blob([await file.arrayBuffer()], {
          type: file.type
        })
        let img = new Image()
        img.onload = () => {
          let c1 = canvas_ref.current!
          let ctx1 = c1.getContext('2d')
          if (!ctx1) {
            console.error('context error')
            return
          }
          c1.width = img.width
          c1.height = img.height
          console.log(`upload image size ${img.width}x${img.height}`)
          ctx1.drawImage(img, 0, 0)
        }
        img.src = URL.createObjectURL(blob)

      }} accept="image/*"></TUpload>
      <canvas ref={canvas_ref} style={{
        width: '100%'
      }} />
      <Grid>
        <Button onClick={(e) => {
          convert(canvas_ref.current!, canvas2_ref.current!)
        }}>Convert</Button>
        <Button onClick={(e) => {
          convert2(canvas_ref.current!, canvas2_ref.current!)
        }}>Convert</Button>
      </Grid>
      <canvas ref={canvas2_ref} style={{
        width: '100%'
      }} />
    </Container>
  )
}