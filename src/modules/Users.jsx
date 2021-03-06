import React from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField'
import Table, {
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from 'material-ui/Table';
import { FormControlLabel } from 'material-ui/Form';
import Switch from 'material-ui/Switch';
import Input, { InputLabel } from 'material-ui/Input';
import { MenuItem } from 'material-ui/Menu';
import { FormControl, FormHelperText } from 'material-ui/Form';
import Select from 'material-ui/Select';

import { LinearProgress } from 'material-ui/Progress';
import ListIcon from 'material-ui-icons/List';
import DeleteIcon from 'material-ui-icons/Delete';
import WarningIcon from 'material-ui-icons/Warning';

import { DialogContentText } from 'material-ui/Dialog';
import DialogWithButtons from '../components/DialogWithButtons';

import NumberFormat from 'react-number-format';

import rest from '../utils/rest';

// Here we 'connect' the component to the Redux store. This means that the component will receive
// parts of the Redux store as its props. Exactly which parts is chosen by mapStateToProps.

// We should map only necessary values as props, in order to avoid unnecessary re-renders. In this
// case we need the list of users, as returned by the REST API. The component will be able to access
// the users list via `this.props.users`. Additionally, we need details about the selected user,
// which will be available as `this.props.userDetails`.

// The second function (mapDispatchToProps) allows us to 'make changes' to the Redux store, by
// dispatching Redux actions. The functions we define here will be available to the component as
// props, so in our example the component will be able to call `this.props.refresh()` in order to
// refresh the users list, and `this.props.refreshUser(user)` to fetch more info about a specific
// user.

// More details: https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options

// The injectIntl decorator makes this.props.intl.formatMessage available to the component, which
// is used for localization.

const mapStateToProps = state => ({
  users: state.users,
  usersLoading: state.users.loading,
  userDetails: state.userDetails,
});

const mapDispatchToProps = dispatch => ({

  /**
   * Refresh the user list
   *
   * @return {void}
   */
  refresh: () => {
    dispatch(rest.actions.users());
  },

  /**
   * Refresh a spcific user
   *
   * @param  {Object} user The user to be refreshed
   * @return {void}
   */
  refreshUser: user => {
    dispatch(rest.actions.userDetails({ userId: user.id }));
  },

  /**
   * Delete a spcific user
   *
   * @param  {object} user The to be deleted user
   * @return {void}
   */
  deleteUser: (user) => {
      dispatch(rest.actions.userDetails.delete({ userId: user.id }, null, () => {
          dispatch(rest.actions.users());
      }));
  },

  /**
   * Bans the user
   *
   * @param  {object} user    The to be banned user
   * @param  {object} banInfo The information about the ban
   * @return {void}
   */
  banUser: (user, banInfo) => {
    const info = {
      reason: banInfo.reason,
      expire: banInfo.expire.amount === '' || banInfo.expire.indicator === '' ? 'x' : banInfo.expire.amount + ':' + banInfo.expire.indicator
    }

    dispatch(rest.actions.banUser({ userId: user.id }, {
        body: JSON.stringify(info)
      }, () => {
        dispatch(rest.actions.users());
      }))
  },

  /**
   * General method to update the user
   *
   * @param  {object} user   The user to be updated
   * @param  {object} update The fields to be updated
   * @return {void}
   */
  updateUser: (user, update) => {
    dispatch(rest.actions.userDetails.patch({ userId: user.id }, { body: JSON.stringify(update) }, () => {
      dispatch(rest.actions.users());
    }))
  },
});

export class Users extends React.Component {
  // Component initial state.
  // Here we keep track of whether the user details dialog is open.
  state = {
    dialogOpen: false,
    deleteUserDialogOpen: false,
    banUserDialogOpen: false,
    openScopeModal: false,
    tempUserForDialogs: null,
    scope: null,
    banInfo: {
      reason: '',
      expire: {
        amount: '',
        indicator: '',
      },
    }
  };

  // Refresh user list when component is first mounted
  componentDidMount() {
    const { refresh } = this.props;

    refresh();
  }

  renderProgressBar() {
    const { usersLoading } = this.props;
    return usersLoading
      ? <div style={{ marginBottom: '-5px' }}>
          <LinearProgress />
        </div>
      : null;
  }

  /**
   * Open the delete user modal
   *
   * @param  {object} user The to be deleted user
   * @return {void}
   */
  openDeleteModal = (user) => {
    this.setState({
        deleteUserDialogOpen: true,
        tempUserForDialogs: user
    });
  }

  /**
   * Open the ban user modal
   *
   * @param  {object} user the to be banned user
   * @return {void}
   */
  openBanModal = (user) => {
    this.setState({
      banUserDialogOpen: true,
      tempUserForDialogs: user
    })
  }

  openScopeModal = (user, scope) => {
    this.setState({
      scopeDialogOpen: true,
      tempUserForDialogs: user,
      scope: scope
    })
  }

  renderUserDetailsDesc = () =>
    <div>
      <DialogContentText>
        <b>
          {this.props.intl.formatMessage({ id: 'userId' })}
        </b>
        {`: ${this.props.userDetails.data.id}`}
      </DialogContentText>
      <DialogContentText>
        <b>
          {this.props.intl.formatMessage({ id: 'email' })}
        </b>
        {`: ${this.props.userDetails.data.email}`}
      </DialogContentText>
      <DialogContentText>
        <b>
          {this.props.intl.formatMessage({ id: 'description' })}
        </b>
        {`: ${this.props.userDetails.data.description}`}
      </DialogContentText>
    </div>;

  /**
   * Render the user delete dialog description
   *
   * @return {Node}
   */
  renderUserDeleteDesc = () =>
    <div>
        <DialogContentText>
            <strong>
                {this.props.intl.formatMessage({ id: 'deleteUser_description' })}
            </strong>
        </DialogContentText>
    </div>;

  renderUserBanDesc = () =>
    <div style={{display: 'flex'}}>
      <FormControl>
          <InputLabel htmlFor="expire-time">{this.props.intl.formatMessage({ id: 'banUser_amount' })}</InputLabel>
          <Input id="expire-time"
            onChange={(event) => {
              this.setState({ banInfo: {...this.state.banInfo, expire: {...this.state.banInfo.expire, amount: event.target.value}} })}
            }
            inputComponent={NumberFormat}
             />
           <FormHelperText>{this.props.intl.formatMessage({ id: 'banUser_choose'})}</FormHelperText>
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="expire-indicator">{this.props.intl.formatMessage({ id: 'banUser_indicator' })}</InputLabel>
          <Select
            value={this.state.banInfo.expire.indicator}
            onChange={(event) => this.setState({ banInfo: {...this.state.banInfo, expire: {...this.state.banInfo.expire, indicator: event.target.value}} })}
            input={<Input id="expire-indicator" />}
          >
            <MenuItem value="minutes">{this.props.intl.formatMessage({ id: 'banUser_indicator_minutes' })}</MenuItem>
            <MenuItem value="hours">{this.props.intl.formatMessage({ id: 'banUser_indicator_hours' })}</MenuItem>
            <MenuItem value="days">{this.props.intl.formatMessage({ id: 'banUser_indicator_days' })}</MenuItem>
            <MenuItem value="weeks">{this.props.intl.formatMessage({ id: 'banUser_indicator_weeks' })}</MenuItem>
            <MenuItem value="months">{this.props.intl.formatMessage({ id: 'banUser_indicator_months' })}</MenuItem>
            <MenuItem value="years">{this.props.intl.formatMessage({ id: 'banUser_indicator_years' })}</MenuItem>
          </Select>
        </FormControl>
  </div>;

  renderUserScopeDesc = () =>
  <div>
      <DialogContentText>
          <strong>
              {this.props.intl.formatMessage({ id: 'scopeUser_desciption' })}
          </strong>
      </DialogContentText>
  </div>;

  /**
   * Render the user row in the user list
   *
   * @param  {object} user The user that has to be rendered
   * @return {TableRow} The tablerow associated with the user
   */
  renderUserRow = (user) =>
    <TableRow key={user.id}>
      <TableCell>
        {user.id}
      </TableCell>
      <TableCell>
        {user.email}
      </TableCell>
      <TableCell>
        <FormControl>
          <Select
            value={user.scope}
            onChange={(event) => this.openScopeModal(user, event.target.value) }
          >
            <MenuItem value="admin">{this.props.intl.formatMessage({ id: 'scope_admin' })}</MenuItem>
            <MenuItem value="user">{this.props.intl.formatMessage({ id: 'scope_user' })}</MenuItem>

          </Select>
        </FormControl>
      </TableCell>
      <TableCell numeric>
        <FormControlLabel
          control={
            <Switch
              checked={user.active}
              onChange={(event, checked) => this.props.updateUser(user, {active: checked}) }
            />
          }
          label={this.props.intl.formatMessage({ id: 'userDetails_activate' })}
        />
        <Button
          color="primary"
          onClick={() => {
            this.props.refreshUser(user);
            this.setState({ dialogOpen: true });
          }}
        >
          <ListIcon style={{ paddingRight: 10 }} />
          {this.props.intl.formatMessage({ id: 'showUserDetails' })}
        </Button>
        <Button
            color="primary"
            onClick={() => {
                this.openDeleteModal(user)
            }}>
            <DeleteIcon style={{ paddingRight: 10 }} />
            {this.props.intl.formatMessage({ id: 'deleteUser_delete' })}
        </Button>
        <Button color="primary" onClick={() => {
            this.openBanModal(user)
          }}>
          <WarningIcon style={{ paddingRight: 10 }} />
          {this.props.intl.formatMessage({ id: 'banUser_ban' })}
        </Button>
      </TableCell>
    </TableRow>;

  /**
   * Render the dialogs
   * @return {Node} The dialogs
   */
  renderDialogs = () =>
    <div>
      <DialogWithButtons
        title={this.props.intl.formatMessage({ id: 'userDetails' })}
        description={this.renderUserDetailsDesc()}
        submitAction={this.props.intl.formatMessage({ id: 'close' })}
        isOpen={this.state.dialogOpen}
        loading={this.props.userDetails.loading}
        submit={() => this.setState({ dialogOpen: false })}
        close={() => this.setState({ dialogOpen: false })}
      />
      <DialogWithButtons
          title={this.props.intl.formatMessage({ id: 'deleteUser_title' })}
          description={this.renderUserDeleteDesc()}
          submitAction={this.props.intl.formatMessage({ id: 'deleteUser_ok' })}
          cancelAction={this.props.intl.formatMessage({ id: 'deleteUser_cancel' })}
          isOpen={this.state.deleteUserDialogOpen}
          submit={() => {
              this.props.deleteUser(this.state.tempUserForDialogs);
              this.setState({ tempUserForDialogs: null, deleteUserDialogOpen: false})

          }}
          close={() => this.setState({ tempUserForDialogs: null, deleteUserDialogOpen: false})}
          />
        <DialogWithButtons
          textField={{label: this.props.intl.formatMessage({ id: 'banUser_reason' }), fullWidth: true}}
          title={this.props.intl.formatMessage({ id: 'banUser_title' })}
          description={this.renderUserBanDesc()}
          submitAction={this.props.intl.formatMessage({ id: 'banUser_ok' })}
          cancelAction={this.props.intl.formatMessage({ id: 'banUser_cancel' })}
          isOpen={this.state.banUserDialogOpen}
          submit={(data) => {
             this.setState({ banInfo: {...this.state.banInfo, reason: data.value} }, () => {
               this.props.banUser(this.state.tempUserForDialogs, this.state.banInfo);
               this.setState({tempUserForDialogs: null, banInfo: {reason: '',  expire: {amount: '', indicator: ''}}, banUserDialogOpen: false});
             })
          }}
          close={() => {
            this.setState({tempUserForDialogs: null, banInfo: {reason: '',  expire: {amount: '', indicator: ''}}, banUserDialogOpen: false});
          }}
          />
          <DialogWithButtons
            title={this.props.intl.formatMessage({ id: 'scopeUser_title' })}
            description={this.renderUserScopeDesc()}
            submitAction={this.props.intl.formatMessage({ id: 'scopeUser_ok' })}
            cancelAction={this.props.intl.formatMessage({ id: 'scopeUser_cancel' })}
            isOpen={this.state.scopeDialogOpen}
            submit={(data) => {
              this.props.updateUser(this.state.tempUserForDialogs, {scope: this.state.scope})
              this.setState({scope: null, scopeDialogOpen: false, tempUserForDialogs: null})
            }}
            close={() => {
              this.setState({scope: null, scopeDialogOpen: false, tempUserForDialogs: null});
            }}
            />
      </div>;

  /**
   * Render the user list
   *
   * @return {Node}
   */
  render() {

    return (
      <div>
        {this.renderDialogs()}

        {this.renderProgressBar()}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {this.props.intl.formatMessage({ id: 'userId' })}
              </TableCell>
              <TableCell>
                {this.props.intl.formatMessage({ id: 'email' })}
              </TableCell>
              <TableCell>
                {this.props.intl.formatMessage({ id: 'scope' })}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {// Loop over each user and render a <TableRow>
            this.props.users.data.map(user =>
              this.renderUserRow(user)
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Users));
