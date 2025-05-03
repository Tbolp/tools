import { Button, Container } from "@mui/material";
import { useEffect } from "react";
import TSelect, { TSelect2 } from "../components/TSelect";
import Markdown from "react-markdown";

export default function Car() {
  useEffect(() => {

  })
  return (
    <Container>
      <Markdown>{desp}</Markdown>
      <TSelect2 text='mode' values={[

      ]} />
      <canvas id="canvas" width={600} height={600} style={{ width: '100%' }}></canvas>
    </Container>
  )
}

let desp = `
# 汽车模拟器`
