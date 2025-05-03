import { CloudUploadOutlined } from "@mui/icons-material";
import { Button, Typography, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { ChangeEventHandler, InputHTMLAttributes, useState } from "react";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export interface TUploadProp {
  onFile?: (file: File) => Promise<void> | void, accept?: string
}

export default function TUpload(props: TUploadProp) {
  let [name, set_name] = useState('')
  return (
    <Grid container sx={{ width: "100%" }} alignItems={'center'} spacing={2}>
      <Grid xs={12}>
        <Button sx={{
          width: "100%",
          height: '15em'
        }} component="label" variant="contained"
          startIcon={<CloudUploadOutlined />}
          onDragOver={(e) => { e.preventDefault() }}
          onDrop={(e) => {
            if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {
              set_name(e.dataTransfer.files[0].name)
              props.onFile?.(e.dataTransfer.files[0])
            }
            e.preventDefault()
          }}>
          Drag Or Click To Upload file
          <VisuallyHiddenInput type="file" {...props} onChange={(e) => {
            if (e.target.files && e.target.files.length === 1) {
              set_name(e.target.files[0].name)
              props.onFile?.(e.target.files[0])
            }
          }} />
        </Button>
      </Grid>
      <Grid xs={12}>
        <Typography>{name}</Typography>
      </Grid>
    </Grid>
  )
}