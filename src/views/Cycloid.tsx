import { Container } from "@mui/material";
import _ from "lodash";

interface Point {
  x: number;
  y: number;
}

class App {
  private _points: Point[] = []
  private _radius: number = 0

  static create(points: Point[], radius: number): App {
    const app = new App();
    app._points = _.cloneDeep(points);
    return app
  }

}

export default function Cycloid() {
  return (
    <Container>

    </Container>
  )
}