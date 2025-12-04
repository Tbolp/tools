import { Box, Container } from "@mui/material";
import _ from "lodash";
import { useEffect, useRef } from "react";
import { TDesp, THeader, TSection } from "../components/THeader";

interface Point {
  x: number;
  y: number;
}

class App {
  private _points: Point[] = []
  private _vec = 1.5
  private _ctx: CanvasRenderingContext2D
  private _start = 0
  private _cur: Point = { x: 0, y: 0 }

  constructor(private points: Point[], private _radius: number, private _elt: HTMLCanvasElement, unit: number, private _angle = 0) {
    this._points = _.cloneDeep(points);
    let ctx = this._elt.getContext('2d')!
    ctx.resetTransform()
    ctx.translate(this._elt.width * 0.5, this._elt.height * 0.5)
    ctx.scale(unit, -unit)
    ctx.lineWidth = 1 / unit
    this._ctx = ctx
    this._cur = _.cloneDeep(points[0])
    for (let i = 0; i < this._points.length; i++) {
      let pt = this._points[i]
      let pt2 = this._points[(i + 1) % this._points.length]
      this._ctx.fillStyle = '#ff0000'
      this._ctx.strokeStyle = '#e45757ff'
      this._ctx.beginPath()
      this._ctx.moveTo(pt.x, pt.y)
      this._ctx.lineTo(pt2.x, pt2.y)
      this._ctx.stroke()
      // this._ctx.ellipse(pt.x, pt.y, 0.05, 0.05, 0, 0, Math.PI * 2)
      // this._ctx.fill()
    }

  }

  private norm2(p1: Point, p2: Point): number {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  }

  run() {
    let pre = _.cloneDeep(this._cur)
    const interval = 30 / 1000
    const next = (this._start + 1) % this._points.length
    let len = interval * this._vec
    let ux = this._points[next].x - this._points[this._start].x
    let uy = this._points[next].y - this._points[this._start].y
    let l = Math.sqrt(ux * ux + uy * uy)
    // let ux = this._points[next].x - this._cur.x
    // let uy = this._points[next].y - this._cur.y
    ux = ux / l
    uy = uy / l
    let nx = this._cur.x + len * ux
    let ny = this._cur.y + len * uy
    const l1 = this.norm2(this._points[this._start], this._points[next])
    const l2 = this.norm2({
      x: nx,
      y: ny
    }, this._points[this._start])
    if (l1 > l2) {
      this._cur.x = nx
      this._cur.y = ny
    } else {
      len = Math.sqrt(
        (this._points[next].x - this._cur.x) * (this._points[next].x - this._cur.x) +
        (this._points[next].y - this._cur.y) * (this._points[next].y - this._cur.y)
      )
      this._cur.x = this._points[next].x
      this._cur.y = this._points[next].y
      this._start = next
    }
    let preAngle = this._angle
    this._angle += len / this._radius

    this._ctx.strokeStyle = '#216cc8ff'
    this._ctx.beginPath()
    this._ctx.moveTo(pre.x + this._radius * Math.cos(preAngle), pre.y + this._radius * Math.sin(preAngle))
    this._ctx.lineTo(this._cur.x + this._radius * Math.cos(this._angle), this._cur.y + this._radius * Math.sin(this._angle))
    // this._ctx.ellipse(this._cur.x, this._cur.y, 0.1, 0.1, 0, 0, Math.PI * 2)
    this._ctx.stroke()
  }

}

export default function Cycloid() {
  let elt = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let needStop = false
    if (elt.current) {
      let pts = []
      for (let i = 0; i < 3; i++) {
        let angle = (i / 3) * Math.PI * 2
        pts.push({ x: Math.cos(angle) * Math.PI, y: Math.sin(angle) * Math.PI })
      }
      let app = new App(pts, 0.3, elt.current, 100)
      // let app = new App([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }], 0.3, elt.current, 100)
      // for (let i = 0; i < 1; i++) {
      //   app.run()
      // }
      let callback = () => {
        if (needStop) {
          return
        }
        app.run()
        requestAnimationFrame(callback)
      }
      requestAnimationFrame(callback)
    }
    return () => {
      needStop = true
    }
  }, [])
  return (
    <Container>
      <THeader title="Cycloid" desp="" tips="" />
      <TSection
        title=""
        desp="">
        <TDesp>
          fdsf
        </TDesp>

        <canvas width={1000} height={1000} style={{
        }} ref={elt}></canvas>


      </TSection>

    </Container>
  )
}