
import { ArcRotateCamera, AxesViewer, Camera, Color3, Color4, CreateBox, CreateCapsule, CreateCylinder, CreateDisc, DirectionalLight, DynamicTexture, Engine, HemisphericLight, Mesh, Plane, PointerEventTypes, Scene, SceneLoader, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core"
import React, { useRef } from "react"
import '@babylonjs/loaders'
import { AdvancedDynamicTexture, Button, Container, Control, TextBlock } from "@babylonjs/gui"

namespace Inner {

  enum Color {
    RED,
    BLACK
  }

  enum State {
    PREPARE,
    RUNNING,
    ENDED
  }

  class Info {
    public x = 0
    public y = 0
    public color = Color.BLACK
    public alive = true
  }

  class Record {
    public s_id = 0
    public sx = 0
    public sy = 0
    public e_id = 0
  }

  export class Game {

    private data_ = new Map<number, Info>()
    private color_ = Color.RED
    private state_ = State.PREPARE
    private history_: Record[] = []
    private winner_ = Color.BLACK


    constructor() {
      for (let i = 1; i < 17; i++) {
        let info = new Info;
        info.color = Color.BLACK
        this.data_.set(i, info)
      }
      for (let i = 21; i < 37; i++) {
        let info = new Info;
        info.color = Color.RED
        this.data_.set(i, info)
      }
    }

    public start() {
      let info = new Info;
      for (let it of this.data_) {
        it[1].alive = true
      }
      for (let i = 1; i < 10; i++) {
        let info = this.data_.get(i)!
        info.x = i - 1
        info.y = 9
      }
      info = this.data_.get(10)!
      info.x = 1; info.y = 7
      info = this.data_.get(11)!
      info.x = 7; info.y = 7
      for (let i = 12; i < 17; i++) {
        let info = this.data_.get(i)!
        info.x = (i - 12) * 2
        info.y = 6
      }

      for (let i = 21; i < 30; i++) {
        let info = this.data_.get(i)!
        info.x = i - 21
        info.y = 0
      }
      info = this.data_.get(30)!
      info.x = 1; info.y = 2
      info = this.data_.get(31)!
      info.x = 7; info.y = 2
      for (let i = 32; i < 37; i++) {
        let info = this.data_.get(i)!
        info.x = (i - 32) * 2
        info.y = 3
      }
      this.history_ = []
      this.color_ = Color.RED
      this.state_ = State.RUNNING
    }

    public can_move(id: number): boolean {
      if (this.state_ !== State.RUNNING) {
        return false
      }
      let info = this.data_.get(id)
      if (info) {
        if (info.alive && info.color === this.color_) {
          return true
        }
      }
      return false
    }

    /**
     * @note 1-16 21-36 success and remove return value
     * @note 0 success
     * @note -1 unexcept error
     * @note -2 game not start
     * @note -3 item can't move
     * @note -4 move wrong position
     */
    public move(id: number, x: number, y: number): number {
      if (this.state_ !== State.RUNNING) {
        return -2
      }
      if (!this.can_move(id)) {
        return -3
      }
      if (x < 0 || x > 8 || y < 0 || y > 9) {
        return -4
      }
      let info = this.data_.get(id)
      if (!info) {
        return -1
      }
      if (info.x === x && info.y === y) {
        return -4
      }
      let ret = 0
      for (let it of this.data_) {
        let tmp_info = it[1]
        if (tmp_info.alive && tmp_info.color === info.color && tmp_info.x === x && tmp_info.y === y) {
          return -4
        }
      }
      if ((id > 11 && id < 17) || (id > 31 && id < 37)) {
        ret = this.move_helper_pawn_(info, x, y)
      }
      if (id === 30 || id === 31 || id === 10 || id === 11) {
        ret = this.move_helper_cannon_(info, x, y)
      }
      if (id === 1 || id === 9 || id === 21 || id === 29) {
        ret = this.move_helper_rook_(info, x, y)
      }
      if (id === 2 || id === 8 || id === 22 || id === 28) {
        ret = this.move_helper_knight_(info, x, y)
      }
      if (id === 3 || id === 7 || id === 23 || id === 27) {
        ret = this.move_helper_elephant_(info, x, y)
      }
      if (id === 4 || id === 6 || id === 24 || id === 26) {
        ret = this.move_helper_manadrin_(info, x, y)
      }
      if (id === 5 || id === 25) {
        ret = this.move_helper_king_(info, x, y)
      }
      if (ret === -1) {
        return -4
      }
      if (ret > 0) {
        let tmp = this.data_.get(ret)
        if (!tmp) {
          return -1
        }
        tmp.alive = false
      }

      let record = new Record
      record.s_id = id
      record.e_id = ret
      record.sx = info.x
      record.sy = info.y
      this.history_.push(record)
      info.x = x
      info.y = y
      let code = this.is_end_()
      if (code !== 0) {
        this.state_ = State.ENDED
      }
      if (code === 1) {
        this.winner_ = this.color_
      }
      this.color_ = this.color_ === Color.BLACK ? Color.RED : Color.BLACK
      if (code === 2) {
        this.winner_ = this.color_
      }

      return ret
    }

    public revert(): Record | null {
      if (this.history_.length === 0) {
        return null
      }
      let record = this.history_.pop()
      if (record) {
        let s_info = this.data_.get(record.s_id)
        if (!s_info) {
          return null
        }
        s_info.x = record.sx
        s_info.y = record.sy
        let e_info = this.data_.get(record.e_id)
        if (e_info) {
          e_info.alive = true
        }
        this.color_ = this.color_ === Color.BLACK ? Color.RED : Color.BLACK
        this.state_ = State.RUNNING
        return record
      }
      return null
    }

    public getInfo(id: number) {
      return this.data_.get(id)
    }

    /**
     * 
     * @note 0 
     * @note 1 red win
     * @note 2 black win
     */
    public get_winner(): number {
      if (this.state_ === State.ENDED) {
        if (this.winner_ === Color.RED) {
          return 1
        } else {
          return 2
        }
      }
      return 0
    }

    /**
     * 
     * @note 0 success
     * @note -1 can't move
     * @note 1-16 21-36 success
     */
    private move_helper_pawn_(info: Info, x: number, y: number): number {
      if (info.color === Color.RED) {
        if (info.y <= 4) {
          if (info.x !== x || y !== info.y + 1) {
            return -1
          }
        } else {
          if (y < info.y) {
            return -1
          }
          if (Math.abs(info.x - x) + Math.abs(info.y - y) !== 1) {
            return -1
          }
        }
      } else {
        if (info.y > 4) {
          if (info.x !== x || y !== info.y - 1) {
            return -1
          }
        } else {
          if (y > info.y) {
            return -1
          }
          if (Math.abs(info.x - x) + Math.abs(info.y - y) !== 1) {
            return -1
          }
        }
      }

      for (let id of this.data_) {
        if (id[1].alive && id[1].x === x && id[1].y === y) {
          return id[0]
        }
      }
      return 0
    }

    private move_helper_cannon_(info: Info, x: number, y: number): number {
      if (x !== info.x && y !== info.y) {
        return -1
      }
      let number = 0
      let id = 0
      if (x === info.x) {
        let min_y = Math.min(y, info.y)
        let max_y = Math.max(y, info.y)
        for (let it of this.data_) {
          let tmp_info = it[1]
          if (!tmp_info.alive) {
            continue
          }
          if (tmp_info.x === info.x && tmp_info.y > min_y && tmp_info.y < max_y) {
            number++
          }
          if (tmp_info.y === y && tmp_info.x === x && tmp_info.color !== info.color) {
            id = it[0]
          }
        }
      } else {
        let min_x = Math.min(x, info.x)
        let max_x = Math.max(x, info.x)
        for (let it of this.data_) {
          let tmp_info = it[1]
          if (!tmp_info.alive) {
            continue
          }
          if (tmp_info.y === info.y && tmp_info.x > min_x && tmp_info.x < max_x) {
            number++
          }
          if (tmp_info.y === y && tmp_info.x === x && tmp_info.color !== info.color) {
            id = it[0]
          }
        }
      }
      if (number === 0 && id === 0) {
        return 0;
      } else if (number === 1 && id !== 0) {
        return id;
      }
      return -1;
    }

    private move_helper_rook_(info: Info, x: number, y: number): number {
      if (x !== info.x && y !== info.y) {
        return -4
      }
      let number = 0
      let id = 0
      if (x === info.x) {
        let min_y = Math.min(y, info.y)
        let max_y = Math.max(y, info.y)
        for (let it of this.data_) {
          let tmp_info = it[1]
          if (!tmp_info.alive) {
            continue
          }
          if (tmp_info.x === info.x && tmp_info.y > min_y && tmp_info.y < max_y) {
            number++
          }
          if (tmp_info.y === y && tmp_info.x === x && tmp_info.color !== info.color) {
            id = it[0]
          }
        }
      } else {
        let min_x = Math.min(x, info.x)
        let max_x = Math.max(x, info.x)
        for (let it of this.data_) {
          let tmp_info = it[1]
          if (!tmp_info.alive) {
            continue
          }
          if (tmp_info.y === info.y && tmp_info.x > min_x && tmp_info.x < max_x) {
            number++
          }
          if (tmp_info.y === y && tmp_info.x === x && tmp_info.color !== info.color) {
            id = it[0]
          }
        }
      }
      if (number === 0) {
        return id;
      }
      return -1;
    }

    private move_helper_knight_(info: Info, x: number, y: number): number {
      let dx = Math.abs(x - info.x)
      let dy = Math.abs(y - info.y)
      if ((dx === 2 && dy === 1) || (dx === 1 && dy === 2)) {
        let tmp_x = info.x
        let tmp_y = info.y
        if (dx === 2) {
          if (x > info.x) {
            tmp_x = tmp_x + 1
          } else {
            tmp_x = tmp_x - 1
          }
        } else {
          if (y > info.y) {
            tmp_y = tmp_y + 1
          } else {
            tmp_y = tmp_y - 1
          }
        }
        for (let it of this.data_) {
          let info = it[1]
          if (!info.alive) {
            continue
          }
          if (info.x === tmp_x && info.y === tmp_y) {
            return -1
          }
        }
        for (let it of this.data_) {
          let info = it[1]
          if (!info.alive) {
            continue
          }
          if (info.x === x && info.y === y) {
            return it[0]
          }
        }
        return 0;
      }
      return -1
    }

    private move_helper_elephant_(info: Info, x: number, y: number): number {
      if (info.color === Color.BLACK) {
        if (y < 5) {
          return -1
        }
      } else {
        if (y > 4) {
          return -1
        }
      }
      let dx = Math.abs(x - info.x)
      let dy = Math.abs(y - info.y)
      if (dx === 2 && dy === 2) {
        let tmp_x = (x + info.x) / 2
        let tmp_y = (y + info.y) / 2
        for (let it of this.data_) {
          let info = it[1]
          if (!info.alive) {
            continue
          }
          if (info.x === tmp_x && info.y === tmp_y) {
            return -1
          }
        }
        for (let it of this.data_) {
          let info = it[1]
          if (!info.alive) {
            continue
          }
          if (info.x === x && info.y === y) {
            return it[0]
          }
        }
        return 0;
      }
      return -1
    }

    private move_helper_manadrin_(info: Info, x: number, y: number): number {
      if (info.color === Color.BLACK) {
        if (x < 3 || x > 5) {
          return -1
        }
        if (y < 7) {
          return -1
        }
      } else {
        if (x < 3 || x > 5) {
          return -1
        }
        if (y > 2) {
          return -1
        }
      }
      let dx = Math.abs(x - info.x)
      let dy = Math.abs(y - info.y)
      if (dx === 1 && dy === 1) {
        for (let it of this.data_) {
          let info = it[1]
          if (!info.alive) {
            continue
          }
          if (info.x === x && info.y === y) {
            return it[0]
          }
        }
        return 0;
      }
      return -1
    }

    private move_helper_king_(info: Info, x: number, y: number): number {
      if (info.color === Color.BLACK) {
        if (x < 3 || x > 5) {
          return -1
        }
        if (y < 7) {
          return -1
        }
      } else {
        if (x < 3 || x > 5) {
          return -1
        }
        if (y > 2) {
          return -1
        }
      }
      let dx = Math.abs(x - info.x)
      let dy = Math.abs(y - info.y)
      if (dx + dy === 1) {
        for (let it of this.data_) {
          let info = it[1]
          if (!info.alive) {
            continue
          }
          if (info.x === x && info.y === y) {
            return it[0]
          }
        }
        return 0;
      }
      return -1
    }

    /**
     * @note -1 unexcept error
     * @note 0 not end
     * @note 1 eat
     * @note 2 meet
     */
    private is_end_(): number {
      let info1 = this.data_.get(5)
      let info2 = this.data_.get(25)
      if (info1 && info2) {
        if (!info1.alive) {
          return 1
        }
        if (!info2.alive) {
          return 1
        }
        if (info1.x === info2.x) {
          for (let it of this.data_) {
            let info = it[1]
            if (!info.alive || info.x !== info1.x) {
              continue
            }
            if ((info.y - info1.y) * (info.y - info2.y) < 0) {
              return 0
            }
          }
          return 2
        }
        if (info1.y === info2.y) {
          for (let it of this.data_) {
            let info = it[1]
            if (!info.alive || info.y !== info1.y) {
              continue
            }
            if ((info.x - info1.x) * (info.x - info2.x) < 0) {
              return 0
            }
          }
          return 2
        }
      } else {
        console.error('unexcept error')
        return -1
      }
      return 0
    }

  }
}

export default function Cheese() {
  const canvasRef = useRef(null)

  React.useEffect(() => {
    let game = new Inner.Game()
    let engine = new Engine(canvasRef.current);
    let scene = new Scene(engine)
    let advance_tex = AdvancedDynamicTexture.CreateFullscreenUI('ui')
    scene.useRightHandedSystem = true
    let camera = new ArcRotateCamera('', Math.PI * 0.5, Math.PI * 0.5, 27, new Vector3(8, 9, 0), scene)
    let resize_handle = (width: number, height: number) => {
      if (canvasRef.current) {
        let elt = canvasRef.current! as HTMLCanvasElement
        elt.width = width
        elt.height = height
        if (elt.width > elt.height) {
          camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED
        } else {
          camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED
        }
      }
    }
    window.onresize = (ev) => {
      resize_handle(window.innerWidth, window.innerHeight)
    }
    resize_handle(window.innerWidth, window.innerHeight)
    // camera.attachControl()
    new HemisphericLight('', Vector3.Forward(), scene)
    // new AxesViewer(scene, 2)
    engine.runRenderLoop(() => {
      scene.render()
    })
    game.start()
    let state = 1
    let node: TransformNode | null = null
    let id = 0
    let position = Vector3.Zero()
    scene.onPointerObservable.add((pi) => {
      switch (pi.type) {
        case PointerEventTypes.POINTERDOWN:
          // (canvasRef.current! as HTMLCanvasElement).requestFullscreen()
          if (state === 1 &&
            pi.pickInfo?.pickedMesh &&
            pi.pickInfo.pickedMesh.parent) {
            let n = parseInt(pi.pickInfo.pickedMesh.parent.name)
            if ((n > 0 && n < 17) || (n > 20 && n < 37)) {
              if (game.can_move(n)) {
                state = 2
                node = pi.pickInfo.pickedMesh.parent as TransformNode
                id = n
                position = node.position.clone()
                camera.detachControl()
              }
            }
          }
          break;
        case PointerEventTypes.POINTERMOVE:
          if (state === 2) {
            if (node && pi.pickInfo && pi.pickInfo.ray) {
              let r = pi.pickInfo.ray
              let n = r.intersectsPlane(new Plane(0, 0, 1, 0))!
              let p = r.origin.add(r?.direction.normalize().multiplyByFloats(n, n, n))!
              node.position = p
            }
          }
          break;
        case PointerEventTypes.POINTERUP:
          if (node) {
            let x = Math.round(node.position.x / 2)
            let y = Math.round(node.position.y / 2)
            let ret = game.move(id, x, y)
            if (ret >= 0) {
              node.position.x = x * 2
              node.position.y = y * 2
              if (ret > 0) {
                let tmp = scene.getNodeById(ret.toString())
                if (tmp) {
                  for (let n of tmp.getChildMeshes()) {
                    n.visibility = 0
                    n.isPickable = false
                  }
                  scene.render()
                }
              }
            } else {
              node.position = position
            }
          }
          state = 1
          id = 0
          node = null
          let winner = game.get_winner()
          if (winner) {
            let container = new Container
            container.width = "200px"
            container.height = "100px"
            container.background = 'white'
            advance_tex.addControl(container)
            let info = Button.CreateSimpleButton('', winner === 1 ? `红方胜` : `黑方胜`)
            info.height = 0.6
            info.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            info.background = '#cccccc'
            info.isEnabled = false
            container.addControl(info)
            let btn = Button.CreateSimpleButton('', '返回上一步')
            btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
            btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
            btn.background = '#aaaaaa'
            btn.height = 0.4
            btn.width = 0.5
            container.addControl(btn)
            let handle_click = () => {
              for (let i = 1; i < 37; i++) {
                if (i > 16 && i < 21) {
                  continue
                }
                let info = game.getInfo(i)
                if (info) {
                  let node = scene.getNodeByName(i.toString()) as TransformNode
                  if (node) {
                    node.position = new Vector3(info.x * 2, info.y * 2, 0)
                    if (info.alive) {
                      for (let tmp of node.getChildMeshes()) {
                        tmp.visibility = 1
                        tmp.isPickable = true
                      }
                    } else {
                      for (let tmp of node.getChildMeshes()) {
                        tmp.visibility = 0
                        tmp.isPickable = false
                      }
                    }
                  }
                }
              }
            }
            btn.onPointerClickObservable.addOnce(() => {
              game.revert()
              handle_click()
              advance_tex.removeControl(container)
            })
            let btn1 = Button.CreateSimpleButton('', '重新开始')
            btn1.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
            btn1.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
            btn1.background = '#aaaaaa'
            btn1.height = 0.4
            btn1.width = 0.5
            container.addControl(btn1)
            btn1.onPointerClickObservable.addOnce(() => {
              game.start()
              handle_click()
              advance_tex.removeControl(container)
            })
          }
          // camera.attachControl()
          break;
        case PointerEventTypes.POINTERDOUBLETAP:
          let record = game.revert()
          if (record) {
            let tmp = scene.getNodeById(record.s_id.toString()) as TransformNode
            if (tmp) {
              tmp.position = new Vector3(record.sx * 2, record.sy * 2, 0)
            }
            if (record.e_id > 0) {
              let tmp = scene.getNodeById(record.e_id.toString()) as TransformNode
              if (tmp) {
                for (let n of tmp.getChildMeshes()) {
                  n.visibility = 1
                  n.isPickable = true
                }
              }
            }
          }
          break;
      }
    })
    SceneLoader.ImportMesh(null, '/tools/assets/', 'cheese.glb', scene, () => {
      for (let i = 1; i < 17; i++) {
        let node = scene.getNodeById(i.toString()) as TransformNode
        if (node) {
          node.rotate(Vector3.Forward(), Math.PI)
        }
      }
    })


    return () => {
      engine.stopRenderLoop()
      scene.dispose()
      engine.dispose()
    }
  })

  return (
    <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
  )
}
