import { Button, FormGroup, FormControl, ControlLabel, HelpBlock } from 'react-bootstrap'

const User = props => {
  return <FormControl type="text" placeholder="" value={props.value} readOnly/>
}

const ForgotPassword = props => null

module.exports = { User, ForgotPassword }