import React from 'react';

const exports = {};

exports.Done = class extends React.Component {
  render() {
    const {decision, outcome} = this.props;
    return (
      <div>
        {decision ? `The fortune of ${outcome} is accepted.\n Thank you for playing.` :
        `The fortune is rejected. Waiting another player to select new fortune...`}
        <br />
      </div>
    );
  }
}

exports.Timeout = class extends React.Component {
  render() {
    return (
      <div>
        There's been a timeout. (Someone took too long.)
      </div>
    );
  }
}

export default exports;