import { Container, MenuItem } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { useEffect, useRef, useState } from "react";
import TUpload from "../components/TUpload";
import TSelect from "../components/TSelect";
import TInput from "../components/TInput";

function uint16ToFloat16(uint16: number) {
  var sign = (uint16 & 0x8000) >> 15;
  var exponent = (uint16 & 0x7C00) >> 10;
  var fraction = uint16 & 0x03FF;

  if (exponent === 0) {
    if (fraction === 0) {
      return (sign === 0) ? 0 : -0;
    } else {
      // 非规格化数
      return Math.pow(-1, sign) * Math.pow(2, -14) * (fraction / Math.pow(2, 10));
    }
  } else if (exponent === 0x1F) {
    if (fraction === 0) {
      return (sign === 0) ? Infinity : -Infinity;
    } else {
      return NaN;
    }
  } else {
    // 规格化数
    return Math.pow(-1, sign) * Math.pow(2, exponent - 15) * (1 + (fraction / Math.pow(2, 10)));
  }
}

const FORMAT_RGB = 0;
const FORMAT_IMG = 1;
const FORMAT_BGR = 2;
const FORMAT_NV12 = 3;
const FORMAT_NV21 = 4;
const FORMAT_F16 = 5;

async function createBitmap(buf: Uint8ClampedArray, format: number, width: number) {
  try {
    if (Number.isNaN(width) || width === 0) {
      return null;
    }
    if (format === FORMAT_RGB) {
      let height = buf.length / width / 3;
      if (Number.isInteger(height) && height > 0) {
        let size = [width, height];
        let img = new ImageData(size[0], size[1])
        for (let i = 0; i < size[0]; i++) {
          for (let j = 0; j < size[1]; j++) {
            img.data[i * 4 + j * size[0] * 4 + 0] = buf[i * 3 + j * size[0] * 3 + 0];
            img.data[i * 4 + j * size[0] * 4 + 1] = buf[i * 3 + j * size[0] * 3 + 1];
            img.data[i * 4 + j * size[0] * 4 + 2] = buf[i * 3 + j * size[0] * 3 + 2];
            img.data[i * 4 + j * size[0] * 4 + 3] = 255;
          }
        }
        let bitmap = await createImageBitmap(img)
        return bitmap
      }
    } else if (format === FORMAT_IMG) {
      let bitmap = await createImageBitmap(new Blob([buf]))
      return bitmap
    } else if (format === FORMAT_BGR) {
      let height = buf.length / width / 3;
      if (Number.isInteger(height) && height > 0) {
        let size = [width, height];
        let img = new ImageData(size[0], size[1])
        for (let i = 0; i < size[0]; i++) {
          for (let j = 0; j < size[1]; j++) {
            img.data[i * 4 + j * size[0] * 4 + 0] = buf[i * 3 + j * size[0] * 3 + 2];
            img.data[i * 4 + j * size[0] * 4 + 1] = buf[i * 3 + j * size[0] * 3 + 1];
            img.data[i * 4 + j * size[0] * 4 + 2] = buf[i * 3 + j * size[0] * 3 + 0];
            img.data[i * 4 + j * size[0] * 4 + 3] = 255;
          }
        }
        let bitmap = await createImageBitmap(img)
        return bitmap
      }
    } else if (format === FORMAT_NV12) {
      let height = buf.length / width / 1.5;
      if (Number.isInteger(height) && height > 0) {
        let size = [width, height];
        let img = new ImageData(size[0], size[1])
        for (let i = 0; i < size[0]; i++) {
          for (let j = 0; j < size[1]; j++) {
            let y = buf[i + j * size[0]];
            let u = buf[size[0] * size[1] + Math.floor(j / 2) * size[0] + Math.floor(i / 2) * 2];
            let v = buf[size[0] * size[1] + Math.floor(j / 2) * size[0] + Math.floor(i / 2) * 2 + 1];
            img.data[i * 4 + j * size[0] * 4 + 0] = y + 1.402 * (v - 128);
            img.data[i * 4 + j * size[0] * 4 + 1] = y - 0.344 * (u - 128) - 0.714 * (v - 128);
            img.data[i * 4 + j * size[0] * 4 + 2] = y + 1.771 * (u - 128);
            img.data[i * 4 + j * size[0] * 4 + 3] = 255;
          }
        }
        let bitmap = await createImageBitmap(img)
        return bitmap
      }
    } else if (format === FORMAT_NV21) {
      let height = buf.length / width / 1.5;
      if (Number.isInteger(height) && height > 0) {
        let size = [width, height];
        let img = new ImageData(size[0], size[1])
        for (let i = 0; i < size[0]; i++) {
          for (let j = 0; j < size[1]; j++) {
            let y = buf[i + j * size[0]];
            let u = buf[size[0] * size[1] + Math.floor(j / 2) * size[0] + Math.floor(i / 2) * 2 + 1];
            let v = buf[size[0] * size[1] + Math.floor(j / 2) * size[0] + Math.floor(i / 2) * 2];
            img.data[i * 4 + j * size[0] * 4 + 0] = y + 1.402 * (v - 128);
            img.data[i * 4 + j * size[0] * 4 + 1] = y - 0.344 * (u - 128) - 0.714 * (v - 128);
            img.data[i * 4 + j * size[0] * 4 + 2] = y + 1.771 * (u - 128);
            img.data[i * 4 + j * size[0] * 4 + 3] = 255;
          }
        }
        let bitmap = await createImageBitmap(img)
        return bitmap
      }
    } else if (format === FORMAT_F16) {
      let height = buf.length / width / 2;
      if (Number.isInteger(height) && height > 0) {
        let size = [width, height];
        let img = new ImageData(size[0], size[1])
        let u16s = new Uint16Array(buf.buffer)
        let f32s = new Float32Array(buf.length)
        for (let i = 0; i < u16s.length; i++) {
          let tmp = uint16ToFloat16(u16s[i])
          f32s[i] = Number.isNaN(tmp) ? 1000 : 1 / tmp
        }
        for (let i = 0; i < size[0]; i++) {
          for (let j = 0; j < size[1]; j++) {
            let tmp = f32s[i + j * size[0]]
            if (tmp < 0.5) {
              tmp = tmp / 0.5 * 150
            } else if (tmp < 1.5) {
              tmp = (tmp - 0.5) * 50 + 150
            } else {
              tmp = (tmp - 1.5) * 55 + 200
            }
            img.data[i * 4 + j * size[0] * 4 + 0] = tmp;
            img.data[i * 4 + j * size[0] * 4 + 1] = tmp;
            img.data[i * 4 + j * size[0] * 4 + 2] = tmp;
            img.data[i * 4 + j * size[0] * 4 + 3] = 255;
          }
        }
        let bitmap = await createImageBitmap(img)
        return bitmap
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function redraw(canvas: HTMLCanvasElement, bitmap: ImageBitmap | null) {
  if (bitmap) {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    let ctx = canvas.getContext('2d')
    ctx?.drawImage(bitmap, 0, 0)
  } else {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export default function Viewer() {
  let [format, set_format] = useState(0)
  let [width, set_width] = useState(480)
  let [buf, set_buf] = useState(new ArrayBuffer(0))
  let canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    createBitmap(new Uint8ClampedArray(buf), format, width).then((bitmap) => {
      if (canvas.current) {
        redraw(canvas.current, bitmap)
      }
    })
  }, [format, width, buf])
  return (
    <Container sx={{ mb: '1em', mt: '1em' }} >
      <TUpload onChange={async (e) => {
        if (e.target.files![0].type !== "") {
          set_format(FORMAT_IMG)
        } else {
          let name = e.target.files![0].name
          if (name.endsWith('rgb')) {
            set_format(FORMAT_RGB)
          } else if (name.endsWith('bgr')) {
            set_format(FORMAT_BGR)
          } else if (name.endsWith('nv21')) {
            set_format(FORMAT_NV21)
          } else if (name.endsWith('nv12')) {
            set_format(FORMAT_NV12)
          } else if (name.endsWith('f16')) {
            set_format(FORMAT_F16)
          } else {
            set_format(FORMAT_RGB)
          }
        }
        set_buf(await e.target.files![0].arrayBuffer())
      }} />
      <TSelect text="Format" select_props={{
        value: format,
        onChange: (e) => {
          set_format(e.target.value as number)
        }
      }}>
        <MenuItem value={FORMAT_RGB}>R8G8B8</MenuItem>
        <MenuItem value={FORMAT_BGR}>B8G8R8</MenuItem>
        <MenuItem value={FORMAT_NV12}>NV12</MenuItem>
        <MenuItem value={FORMAT_NV21}>NV21</MenuItem>
        <MenuItem value={FORMAT_F16}>F16</MenuItem>
        <MenuItem value={FORMAT_IMG}>IMG</MenuItem>
      </TSelect>
      <Container sx={{ display: format !== 1 ? 'block' : 'none' }}>
        <TInput text="Width" value={width.toString(10)} onChange={async (e) => {
          let w = parseInt(e.target.value)
          if (Number.isNaN(w)) {
            set_width(0)
          } else {
            set_width(w)
          }
        }} />
      </Container>
      <canvas ref={canvas} style={{
      }} width={0} height={0} />
    </Container>
  )
}