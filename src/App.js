import React from 'react';
const locations = require('./photo-db-object.js');
const request = require('request');

// Facebook SDK ========================================================================================================================================
window.fbAsyncInit = function() {
  window.FB.init({
    appId            : '203534870262491',
    autoLogAppEvents : true,
    xfbml            : true,
    version          : 'v3.0'
  });
};

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = 'https://connect.facebook.net/en_US/sdk.js';
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));

// Define helper functions=====================================================================================================================================================================================

var map;
var marker;
function initMap(lat, lng) {
  map = new window.google.maps.Map(document.getElementById('map'), {
    center: {lat: lat, lng: lng},
    zoom: 4,
    mapTypeId: 'hybrid'
  });

  marker = new window.google.maps.Marker({
    position:{lat: lat, lng: lng},
    map: map,
    title: ''
  });
};

function updateMap(lat, lng) {
  var center = new window.google.maps.LatLng(lat, lng);
  map.panTo(center);
  marker.setPosition(center);
}

function urlToClipboard() {
  var copyText = document.createElement('textarea');
  copyText.value = 'http://mjinkens.com/photos';
  document.body.appendChild(copyText);
  copyText.select();
  document.execCommand('copy');
  document.body.removeChild(copyText);
};

function hasClass(element, className) {
  return element.className.split(' ').indexOf(className) !== -1 ? true : false
};


function fireSingleEvent(component, eventType, targetId) {
  var event = new MouseEvent(eventType, {
    view: window,
    bubbles: true,
    cancelable: true
  });
  document.getElementById(targetId).dispatchEvent(event);
};

function fireEventOnInterval(component, eventType, targetId) {
  var event = new MouseEvent(eventType, {
    view: window,
    bubbles: true,
    cancelable: true
  });
  var intervalId = setInterval(() => {
    document.getElementById(targetId).dispatchEvent(event);
  }, component.state.slideDuration * 1000);
  component.setState({intervalId: intervalId});
};

function getLocationData() {
  return new Promise((resolve, reject) => {
    request.post({
      url:'http://localhost:4000/data',
      form: {
      }
    }, function(error, httpResponse, body){
      if(error)
        reject(error);

      if(body)
        body = JSON.parse(body);
        var i;
        var locationData = {locations: [], subLocations: []};
        for(i = 0; i < body.length; ++i) {
          locationData.locations.push(body[i].location.location);
          locationData.subLocations.push(body[i].location.subLocation);
        };
        resolve(locationData);
    });
  });
};

function loadPhotos(location, subLocation) {
  var form = subLocation === 'ALL' ? {'location.location': location.toLowerCase()} : {'location.location': location.toLowerCase(), 'location.subLocation': subLocation.toLowerCase()};
  return new Promise((resolve, reject) => {
    request.post({
      url:'http://localhost:4000/data',
      form: form
    }, function(error, httpResponse, body){
      if(error)
        reject(error);

      if(body)
        body = JSON.parse(body);
        var i;
        var photosArray = [];
        for(i = 0; i < body.length; ++i) {
          photosArray.push(body[i]);
        };
        resolve(photosArray);
    });
  });
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
  };
  return array;
};

function uniqueLocations(locationArray) {
  var i;
  var uniqueLocations = [];
  for(i = 0; i < locationArray.length; ++i) {
      if(uniqueLocations.indexOf(locationArray[i].toUpperCase()) === -1)
        uniqueLocations.push(locationArray[i].toUpperCase());
  };
  return uniqueLocations;
};

function uniqueSubLocations(subLocationArray) {
  var i;
  var uniqueSubLocations = [];
  for(i = 0; i < subLocationArray.length; ++i) {
      if(uniqueSubLocations.indexOf(subLocationArray[i].toUpperCase()) === -1)
        uniqueSubLocations.push(subLocationArray[i].toUpperCase());
  };
  return uniqueSubLocations;
};

function getSidebarItems(component, locations) {
  var i;
  var sidebarItems = [];
  locations = uniqueLocations(locations);
  for(i = 0; i < locations.length; ++i) {
    sidebarItems.push(<SidebarItem
                        key={locations[i]}
                        location={locations[i]}
                        locations={locations}
                        handleClick={component.props.handleClick}
                      />);
  };
  return sidebarItems;
};

function getSidebarSubItems(component, subLocations) {
  var i;
  var sidebarSubItems = [];
  subLocations = uniqueSubLocations(subLocations);
  for(i = 0; i < subLocations.length; ++i) {
    sidebarSubItems.push(<SidebarSubItem
                          location={component.props.location}
                          key={subLocations[i]}
                          subLocation={subLocations[i]}
                          handleClick={component.props.handleClick}
                         />);
  };
  sidebarSubItems.push(<SidebarSubItem
                          location={component.props.location}
                          key={'ALL'}
                          subLocation={'ALL'}
                          handleClick={component.props.handleClick}
                        />)
  return sidebarSubItems;
};

// Define components==================================================================================================================================================================================

class Header extends React.Component {
  render() {
    var hidden = this.props.fullscreen ? ' hidden' : '';
    return (
      <div className={'header ' + hidden}>
        <div className='header-item'>
        <i onClick={this.props.handleClick}>
          <img height='30px' width='35px'className='header-left'src='https://s3.amazonaws.com/mjinkens/MountainAuroraLogo.svg' alt='logo'></img>
        </i>
        </div>
        <div className='header-item header-right'>
          <i id='header-bars' className="fas fa-bars" onClick={this.props.handleClick}></i>
          <div className='tooltip-text end'>{this.props.sidebarTooltip}</div>
        </div>
      </div>
    );
  };
};

// Sidebar========================================================================================================================================================================================================

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarItems: null
    };
    this.componentDidMount = this.componentDidMount.bind(this);
  };

  componentDidMount() {
    getLocationData().then((data) => {
      var sidebarItems = getSidebarItems(this, data.locations);
      this.setState({sidebarItems: sidebarItems});
    });
  };

  render() {
    var hidden = this.props.fullscreen ? ' none' : '';
    return (
      <div className={'sidebar ' + this.props.sidebarTranslate + hidden}>
        <MapEmbed />
        <div className='current-location'>
          <h5>CURRENT LOCATION  <i className="fas fa-location-arrow"></i></h5>
          <h5 className='location-name'>{this.props.currentLocation}</h5>
          <hr />
        </div>
        <div className='sidebar-item-wrapper'>
          {this.state.sidebarItems}
        </div>
        <Social
          handleClick={this.props.handleClick}
        />
      </div>
    );
  };
};

class SidebarItem extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      expanded: {value: false, icon: ' fa-chevron-down'}
    };
    this.handleIconClick = this.handleIconClick.bind(this);
  };

  handleIconClick(event) {
    var expanded = hasClass(event.target, 'fa-chevron-down') ? {value: true, icon: ' fa-chevron-up'} : {value: false, icon: ' fa-chevron-down'};
    this.setState({expanded: expanded})
  };

  render() {
    return (
      <div className='sidebar-item'>
        <div className='sidebar-item-header'>
        <h5>{this.props.location}</h5>
        <i className={'fas' + this.state.expanded.icon} onClick={this.handleIconClick}></i>
        </div>
        <SidebarSubContainer
          expanded={this.state.expanded.value}
          location={this.props.location}
          locations={this.props.locations}
          handleClick={this.props.handleClick}
        />
      </div>
    );
  };
};

class SidebarSubContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarSubItems: null
    };
    this.componentDidMount = this.componentDidMount.bind(this);
  };

  componentDidMount () {
    getLocationData().then((data) => {
      var i;
      var subLocations = [];
      for(i = 0; i < data.locations.length; ++i) {
        if(data.locations[i].toUpperCase() === this.props.location)
          subLocations.push(data.subLocations[i]);
      };
      var sidebarSubItems = getSidebarSubItems(this, subLocations);
      this.setState({sidebarSubItems: sidebarSubItems});
    });
  };

  render() {
    var expand = this.props.expanded ? ' expand' : '';
    return (
      <div className={'sidebar-sub-container' + expand}>
        {this.state.sidebarSubItems}
      </div>
    );
  };
};

class SidebarSubItem extends React.Component {
  render() {
    return (
      <div className='sidebar-sub-item' data-location={this.props.location} data-sublocation={this.props.subLocation} onClick={this.props.handleClick}>
        {this.props.subLocation}
      </div>
    );
  };
};

class MapEmbed extends React.Component {
  render() {
    return (
      <div id='map' className='map'>
      </div>
    );
  };
};

class Social extends React.Component {
  render() {
    return (
      <div className='social'>
        <div className='social-item'>
          <i className='fab fa-fw fa-facebook-f' title='SHARE ON FACEBOOK' onClick={this.props.handleClick}></i>
        </div>
        <div className='social-item'>
          <i className='fab fa-fw fa-twitter' title='SHARE ON TWITTER' onClick={this.props.handleClick}></i>
        </div>
        <div className='social-item'>
          <i className='fas fa-fw fa-link' title='COPY LINK TO CLIPBOARD' onClick={this.props.handleClick}></i>
        </div>
      </div>
    );
  };
};

// Photo viewer==================================================================================================================================================================================================

class PhotoViewer extends React.Component {
  render () {
    var fullscreen = this.props.fullscreen ? {fullscreen: ' photo-viewer-fullscreen', hidden: ''} : {fullscreen: '', hidden: ' none'};
    return (
      <div className={'photo-viewer' + fullscreen.fullscreen}>
        <PhotoWrapper
          currentPhoto={this.props.currentPhoto}
          photoCaption={this.props.photoCaption}
          fullscreen={this.props.fullscreen}
          slideshowStatus={this.props.slideshowStatus}
          showCaption={this.props.showCaption}
          handleClick={this.props.handleClick}
        />
        <PhotoFooter
          fullscreen={this.props.fullscreen}
          photoCaption={this.props.photoCaption}
          slideshowStatus={this.props.slideshowStatus}
          slideDuration={this.props.slideDuration}
          shuffleStatus={this.props.shuffleStatus}
          handleChange={this.props.handleChange}
          handleClick={this.props.handleClick}
        />
      </div>
    );
  };
};

class PhotoWrapper extends React.Component {
  render () {
    var fullscreen = this.props.fullscreen ? {fullscreen: ' photo-viewer-fullscreen', hidden: ''} : {fullscreen: '', hidden: ' none'};
    var showCaption = this.props.showCaption ? {icon: 'fas ' , indicator: 'HIDE CAPTION', hidden: ''} : {icon: 'far ', indicator: 'SHOW CAPTION', hidden: ' translate-caption'};
    var isCaption = this.props.photoCaption === '' ? ' none' : '';
    return (
      <div className='photo-wrapper'>
        <img className='previous-photo' src={this.props.currentPhoto} alt={this.props.previousPhoto}/>
        <img src={this.props.currentPhoto} alt={this.props.photoCaption}/>
        <div className={'photo-caption photo-caption-fullscreen' + showCaption.hidden + fullscreen.hidden}>
          <p className={isCaption}>
            {this.props.photoCaption}
          </p>
        </div>
        <FullscreenControls
        fullscreen={this.props.fullscreen}
        slideshowStatus={this.props.slideshowStatus}
        showCaption={this.props.showCaption}
        handleClick={this.props.handleClick}
        />
      </div>
    );
  };
};

class FullscreenControls extends React.Component {
  render () {
    var fullscreen = this.props.fullscreen ? {fullscreen: ' photo-viewer-fullscreen', hidden: ''} : {fullscreen: '', hidden: ' none'};
    var showCaption = this.props.showCaption ? {icon: 'far fa-check-square' , indicator: 'HIDE CAPTION', hidden: ''} : {icon: 'far fa-square', indicator: 'SHOW CAPTION', hidden: ' translate-caption'};
    var slideshow  = this.props.slideshowStatus ? ' fa-pause' : ' fa-play';
    return (
      <div className={'controls-fullscreen-container' + fullscreen.hidden}>
        <div className='controls-fullscreen'>
          <i className={showCaption.icon} onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>{showCaption.indicator}</div>
        </div>
        <div className='controls-fullscreen'>
          <i className="fas fa-fw fa-arrow-left" onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>PREVIOUS</div>
        </div>
        <div className='controls-fullscreen'>
          <i className="fas fa-fw fa-arrow-right" onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>NEXT</div>
        </div>
        <div className='controls-fullscreen'>
          <i className={'fas ' + slideshow} onClick={this.props.handleClick}></i>
          <div className='tooltip-text end'>SLIDESHOW</div>
        </div>
        <div className='controls-fullscreen'>
          <i className="fas fa-fw fa-compress" onClick={this.props.handleClick}></i>
          <div className='tooltip-text end'>EXIT FULLSCREEN</div>
        </div>
      </div>
    );
  };
};

class PhotoControls extends React.Component {
  render () {
    var slideshow  = this.props.slideshowStatus ? {icon: ' fa-pause', slider: ''} : {icon: ' fa-play', slider: ' hidden'};
    var shuffleStatus = this.props.shuffleStatus ? 'RANDOM: ON' : '';
    return (
      <div className='photo-viewer-controls'>
        <div className='photo-controls-item'>
          <i className="fas fa-arrow-left" onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>PREVIOUS</div>
        </div>
        <div className='photo-controls-item'>
          <i id='next' className="fas fa-arrow-right" onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>NEXT</div>
        </div>
        <div className='photo-controls-item'>
          <i className={'fas ' + slideshow.icon} onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>SLIDESHOW</div>
        </div>
        <div className='photo-controls-item'>
          <i className="fas fa-random" onClick={this.props.handleClick}></i>
          <div className='tooltip-text'>RANDOM</div>
        </div>
        <div className='photo-controls-item'>
          <i className="fas fa-expand" onClick={this.props.handleClick}></i>
          <div className='tooltip-text end'>FULLSCREEN</div>
        </div>
        <input type='range' min='1' max='10' value={this.props.slideDuration} className={'photo-slider ' + slideshow.slider} onChange={this.props.handleChange}/>
        <div className='photo-status'>
          <div className={'slideshow-status ' + slideshow.slider}>SLIDE DURATION: {this.props.slideDuration + 's'}</div>
          <div className={'shuffle-status ' + this.props.shuffleStatus}>{shuffleStatus}</div>
        </div>
      </div>
    );
  };
};

class PhotoFooter extends React.Component {
  render () {
    var hidden = this.props.fullscreen ? ' none' : '';
    return (
      <div className={'photo-footer' + hidden}>
        <div className={'photo-caption ' + hidden}>
          <p>{this.props.photoCaption}</p>
        </div>
        <hr/>
        <PhotoControls
          fullscreen={this.props.fullscreen}
          slideshowStatus={this.props.slideshowStatus}
          slideDuration={this.props.slideDuration}
          shuffleStatus={this.props.shuffleStatus}
          handleClick={this.props.handleClick}
          handleChange={this.props.handleChange}
        />
      </div>
    );
  };
};

// App============================================================================================================================================================================================================

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        sidebarTranslate: false,
        sidebarTooltip: 'HIDE SIDEBAR',
        showCaption: true,
        photoCaption: '',
        slideshowStatus: false,
        slideDuration: 4,
        intervalId: null,
        fullscreen: false,
        shuffleStatus: false,
        unshuffledPhotos: null,
        photosArray: null,
        currentPhoto: 'https://s3.amazonaws.com/mjinkens/choose-location.PNG',
        locations: locations,
        currentLocation: 'CHOOSE LOCATION',
        photoLat: null,
        photoLong: null,
        photoIndex: 0
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  };

  componentDidMount () {
    var width = Math.min(window.innerWidth, window.outerWidth);
    var isSmallScreen = width <= 768 ? true : false;
    if(isSmallScreen) fireSingleEvent(this, 'click', 'header-bars');
  };

  async handleChange(event) {
    if(hasClass(event.target, 'photo-slider')) {
      await this.setState({slideDuration: event.target.value});
      if(this.state.intervalId === null) return;
      clearInterval(this.state.intervalId);
      fireEventOnInterval(this, 'click', 'next');
    };
  };

  async handleClick(event) {
    event.preventDefault();
    switch (true) {

      case hasClass(event.target, 'fa-bars'):
        var sidebarTranslate = this.state.sidebarTranslate ? {sidebarTranslate: '', sidebarTooltip: 'HIDE SIDEBAR'} : {sidebarTranslate: 'sidebar-translate', sidebarTooltip: 'SHOW SIDEBAR'};
          await this.setState({sidebarTranslate: sidebarTranslate.sidebarTranslate});
          setTimeout(() => {
            this.setState({sidebarTooltip: sidebarTranslate.sidebarTooltip});
          }, 300);
        break;

      case hasClass(event.target, 'fa-arrow-left'):
        if(this.state.photosArray === null) return;
        var index = this.state.photoIndex;
        index -= 1;
        if(index < 0) index = this.state.photosArray.length - 1;
        this.setState({currentPhoto: ''});
        await this.setState({photoIndex: index});

        this.setState({currentLocation: this.state.photosArray[this.state.photoIndex].location.subLocation.toUpperCase()});
        this.setState({currentPhoto: this.state.photosArray[this.state.photoIndex].content.url});
        this.setState({photoCaption: this.state.photosArray[this.state.photoIndex].content.captionText});

        if(this.state.photosArray[this.state.photoIndex].location.lat === this.state.photoLat && this.state.photosArray[this.state.photoIndex].location.long === this.state.photoLong) return;
        await this.setState({photoLat: this.state.photosArray[this.state.photoIndex].location.lat});
        await this.setState({photoLong: this.state.photosArray[this.state.photoIndex].location.long});

        updateMap(this.state.photoLat, this.state.photoLong);
        break;

      case hasClass(event.target, 'fa-arrow-right'):
        if(this.state.photosArray === null) return;
        index = this.state.photoIndex;
        index += 1;
        if(index === this.state.photosArray.length) index = 0;
          this.setState({currentPhoto: ''});
          await this.setState({photoIndex: index});

          this.setState({currentLocation: this.state.photosArray[this.state.photoIndex].location.subLocation.toUpperCase()});
          this.setState({currentPhoto: this.state.photosArray[this.state.photoIndex].content.url});
          this.setState({photoCaption: this.state.photosArray[this.state.photoIndex].content.captionText});

          if(this.state.photosArray[this.state.photoIndex].location.lat === this.state.photoLat && this.state.photosArray[this.state.photoIndex].location.long === this.state.photoLong) return;
          await this.setState({photoLat: this.state.photosArray[this.state.photoIndex].location.lat});
          await this.setState({photoLong: this.state.photosArray[this.state.photoIndex].location.long});

          updateMap(this.state.photoLat, this.state.photoLong);
        break;

      case hasClass(event.target, 'fa-play') || hasClass(event.target, 'fa-pause'):
        if(this.state.photosArray === null) return;
        var slideshowStatus = this.state.slideshowStatus ? false : true;
          await this.setState({slideshowStatus: slideshowStatus});
        if(this.state.slideshowStatus) {
          fireEventOnInterval(this, 'click', 'next');
        }
        else {
          clearInterval(this.state.intervalId);
        };
        break;

      case hasClass(event.target, 'fa-random'):
        var shuffleStatus = this.state.shuffleStatus ? false : true;
          this.setState({shuffleStatus: shuffleStatus});
          if(this.state.photosArray === null) return;
          var shuffledPhotos = shuffleArray(this.state.photosArray);
          this.setState({photosArray: shuffledPhotos});
        break;

      case hasClass(event.target, 'fa-expand') || hasClass(event.target, 'fa-compress'):
        var fullscreen = this.state.fullscreen ? false : true;
          this.setState({fullscreen: fullscreen});
        break;

      case hasClass(event.target, 'fa-square') || hasClass(event.target, 'fa-check-square'):
        var showCaption = this.state.showCaption ? false : true;
          this.setState({showCaption: showCaption});
        break;

      case hasClass(event.target, 'sidebar-sub-item'):
        var location = event.target.attributes['data-location'].value;
        var subLocation = event.target.attributes['data-sublocation'].value;

        loadPhotos(location, subLocation).then((photosArray) => {
            var unshuffledPhotos = photosArray;
            if(this.state.shuffleStatus) photosArray = shuffleArray(photosArray);
            console.log(unshuffledPhotos, photosArray);
            return Promise.all([
              this.setState({unshuffledPhotos: unshuffledPhotos}),
              this.setState({photosArray: photosArray}),
              this.setState({photoIndex: 0})
            ]);
          }).then(() => {
            this.setState({currentLocation: this.state.photosArray[this.state.photoIndex].location.subLocation.toUpperCase()});
            this.setState({currentPhoto: this.state.photosArray[this.state.photoIndex].content.url});
            this.setState({photoCaption: this.state.photosArray[this.state.photoIndex].content.captionText});
            subLocation = subLocation === 'ALL' ? this.state.photosArray[this.state.photoIndex].location.subLocation.toUpperCase() : subLocation;
            this.setState({currentLocation: subLocation})
            return Promise.all([
              this.setState({photoLat: this.state.photosArray[this.state.photoIndex].location.lat}),
              this.setState({photoLong: this.state.photosArray[this.state.photoIndex].location.long})
            ]);
          }).then(() => {
            initMap(this.state.photoLat, this.state.photoLong);
          }).catch((error) => {
            console.warn(error);
          });
        break;

      case hasClass(event.target, 'fa-facebook-f'):
        // facebook share dialog
        window.FB.ui({
        method: 'share',
        display: 'popup',
        href: 'http://mjinkens.com/photos/',
      }, function(response){});
      break;

      case hasClass(event.target, 'fa-twitter'):
      var y = window.top.outerHeight / 2 + window.top.screenY - ( 270 / 2)
      var x = window.top.outerWidth / 2 + window.top.screenX - ( 520 / 2)
        window.open(
          'https://twitter.com/intent/tweet?&text=' + encodeURIComponent('http://mjinkens.com/photos'),
          '_blank', 'location=yes, height=270, width=520, status=yes, top='+y+', left='+x
        );
        break;

      case hasClass(event.target, 'fa-link'):
        // copy site url to clipboard
        urlToClipboard();
        break;

      default:
        break;
      };
    };

  render () {
    return (
      <div className='app'>
        <Header
          fullscreen={this.state.fullscreen}
          sidebarTooltip={this.state.sidebarTooltip}
          handleClick={this.handleClick}
        />
        <Sidebar
          fullscreen={this.state.fullscreen}
          locations={this.state.locations}
          currentLocation={this.state.currentLocation}
          sidebarTranslate={this.state.sidebarTranslate}
          handleClick={this.handleClick}
          />
        <PhotoViewer
          fullscreen={this.state.fullscreen}
          currentPhoto={this.state.currentPhoto}
          photoCaption={this.state.photoCaption}
          showCaption={this.state.showCaption}
          slideshowStatus={this.state.slideshowStatus}
          slideDuration={this.state.slideDuration}
          shuffleStatus={this.state.shuffleStatus}
          handleChange={this.handleChange}
          handleClick={this.handleClick}
          getExif={this.getExif}
        />
      </div>
    );
  };
};

export default App;
// https://s3.amazonaws.com/mjinkens/img_0027.jpg
