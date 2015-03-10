/*** @jsx React.DOM */

var Menu = React.createClass({
  getInitialState: function() {
    return {
      activity: false
    };
  },

  render: function() {
    console.log('REACT ENV: ', this.props.env);

    var href = function(loc) {
      // return this.props.tripId ? '/#/' + loc + '/' + this.props.tripId : '';
      return this.props.tripId ? '#/' + loc + '/' + this.props.tripId : '';
    }.bind(this);

    var className = function(loc) {
      var classes = '';
      classes += !this.props.tripId ? ' pure-menu-disabled' : '';
      classes += this.props.loc === loc ? ' pure-menu-selected' : '';
      return classes;
    }.bind(this);

    // FIX BASE URL LINK ON "RECORDS" LINK FIXME

    return (
      <ul className='pure-menu pure-menu-open pure-menu-horizontal'>
        <li>
          <a href='#/'>Recordings</a>
        </li>
        <li className={className('raw')}>
          <a href={href('raw')}>Raw Data</a>
        </li>
        <li className={className('har')}>
          <a href={href('har')}>Activity Recognition</a>
        </li>
        <li>
          <a href={href('privacy')}>Privacy Policy</a>
        </li>
        <li className="floatRight">
          <a href={'logout'}>Logout</a>
        </li>
      </ul>
    );
  }
});
