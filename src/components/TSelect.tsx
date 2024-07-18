import { Grid, Select, SelectProps } from "@mui/material";
import { ReactNode } from "react";


export default function TSelect(props: {
  text: string,
  disabled?: boolean,
  select_props: SelectProps,
  children: ReactNode,
}) {
  return (
    <Grid container style={{
      alignItems: 'center'
    }}>
      <Grid item xs={true}>
        <p>{props.text}</p>
      </Grid>
      <Grid item xs={true}>
        <Select disabled={props.disabled} {...props.select_props} >
          {props.children}
        </Select>
      </Grid>
    </Grid>
  );
}