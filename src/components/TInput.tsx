import { Grid, TextField } from "@mui/material";

export default function TInput(props: {
  text: string,
  value?: string,
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
}) {
  return (
    <Grid container style={{
      alignItems: 'center'
    }}>
      <Grid item xs={true}>
        <p>{props.text}</p>
      </Grid>
      <Grid item xs={true}>
        <TextField type="" fullWidth variant="standard" value={props.value} onChange={props.onChange} />
      </Grid>
    </Grid>
  );
}