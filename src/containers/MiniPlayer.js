import React, {Component} from 'react';
import {
  Image,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import Button from 'react-native-button';
import {Actions} from 'react-native-router-flux';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import ActionCreators from '../actions';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Video from 'react-native-video';
import Styles from '../styles';
import * as Utils from '../helpers/utils';
import {ForwardButton, BackwardButton, PlayButton, ShuffleButton, VolumeButton, DownloadButton, SongSlider} from '../components/PlayerButtons';
import MusicControl from 'react-native-music-control';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/Ionicons';
import _ from 'underscore';

let {height, width} = Dimensions.get('window');

class Player extends Component {
  constructor(props){
    super(props);
    this.state = {
      playing: false,
      muted: false,
      shuffle: false
    };
  }

  setPlayingSong(duration) {
    let song = this.props.songs[this.props.songIndex];
    MusicControl.setNowPlaying({
      title: song.title,
      artwork: song.thumb,
      artist: song.artist,
      duration
    });
  }

  togglePlay(status) {
    this.props.setPlaying(status);
    MusicControl.updatePlayback({
      state: status? MusicControl.STATE_PLAYING: MusicControl.STATE_PAUSED,
      elapsedTime: this.state.currentTime
    })
  }

  toggleVolume(){
    this.setState({ muted: !this.state.muted });
  }

  goBackward(){
    if(this.state.currentTime < 3 && this.props.songIndex !== 0 ) {
      this.props.setPlayingSong(this.props.songIndex - 1);
    } else {
      this.refs.audio.seek(0);
      MusicControl.updatePlayback({
        state: MusicControl.STATE_PLAYING,
        elapsedTime: 0
      })
    }
  }

  goForward() {
    let _index = this.props.shuffle? this.randomSongIndex() : null;
    this.refs.audio.seek(0);
    this.setTime(0);
    if(_.isNumber(_index) || this.props.songIndex + 1 != this.props.songs.length) {
      let index = _.isNumber(_index)? _index: this.props.songIndex + 1;
      return this.props.setPlayingSong(index);
    }
    this.props.setPlayingSong(0);
    this.props.setPlaying(false);
    let song = this.props.songs[0];
    MusicControl.updatePlayback({
      title: song.title,
      artwork: song.thumb,
      artist: song.artist,
      state: MusicControl.STATE_PAUSED,
      elapsedTime: 0
    });
  }

  randomSongIndex(){
    let index = Math.floor(Math.random() * 1000000000) % this.props.songs.length;
    if(index == this.props.songIndex && this.props.songs.length !== 1) {
      return this.randomSongIndex();
    }
    return index;
 }

  setTime(params) {
      this.props.setProgress(params.currentTime);
      this.setState({currentTime: params.currentTime});
  }

  onLoad(params) {
    let duration = params.duration / 2; //react-native-video bug
    this.props.setSongDuration(duration);
    this.setPlayingSong(duration);
  }

  onSlidingComplete(time){
    this.refs.audio.seek(time);
  }

  onEnd() {
    this.props.setPlaying(false);
    this.goForward();
  }

  openPlayer() {
    this.togglePlay(true);
    Actions.player({
      togglePlay: this.togglePlay.bind(this),
      goBackward: this.goBackward.bind(this),
      goForward: this.goForward.bind(this)
    });
  }

  renderVideoPlayer() {
    if(this.props.songs[this.props.songIndex]) {
    return (<Video
              source={{uri: this.props.songs[this.props.songIndex].path }}
              volume={this.state.muted ? 0 : 1.0}
              muted={false}
              ref="audio"
              paused={!this.props.playing}
              playInBackground={true}
              onLoad={ this.onLoad.bind(this) }
              onProgress={ this.setTime.bind(this) }
              onEnd={ this.onEnd.bind(this) }
              resizeMode="cover"
              repeat={false}/>);
      }
      return null;
  }

  async componentDidMount() {
    await this.props.getSongs();
    MusicControl.enableControl('play', true);
    MusicControl.enableControl('pause', true);
    MusicControl.enableControl('nextTrack', true);
    MusicControl.enableControl('previousTrack', true);
    MusicControl.enableControl('seekForward', false);
    MusicControl.enableControl('seekBackward', false);
    MusicControl.enableBackgroundMode(true);
    MusicControl.on('play', ()=> {
      this.togglePlay(true);
    });
    MusicControl.on('pause', ()=> {
      this.togglePlay(false);
    });
    MusicControl.on('nextTrack', this.goForward.bind(this));
    MusicControl.on('previousTrack', this.goBackward.bind(this));
  }

  songImage = require('../img/music.jpg');

  render() {
      let song = this.props.songs[this.props.songIndex];
      if(!song) return null;
      let text = `${song.artist} - ${song.title}`;
      return (
        <TouchableOpacity style={[Styles.playerOverlay, {width: this.props.scene.name == 'player'? 0: width}]} onPress={this.openPlayer.bind(this)}>
        {this.renderVideoPlayer()}
          <View style={Styles.minimizedPlayer}>
            {this.props.scene.name == 'player'? null:
            <Image
              style={Styles.songImageSmall}
              source={{uri: (Platform.OS == 'android'?"file://": "") + song.thumb}}/>
            }
              <Text>{text.slice(0, 30)}...</Text>
              <FontAwesome onPress={ () => this.togglePlay(!this.props.playing) } name={this.props.playing?"stop-circle": "play-circle"} size={25} />
              {renderForwardButton.call(this)}
          </View>
        </TouchableOpacity>
      );
  }
}

function renderForwardButton() {
  if(this.props.songIndex + 1 === this.props.songs.length ) {
       return <FontAwesome name="forward" size={25} color="#333" />
  }
  return <FontAwesome onPress={ this.goForward.bind(this)} name="forward" size={25} />
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
}

function mapStateToProps(store) {
    return {
      searchResults: store.searchResults,
      progreses: store.progreses,
      scene: store.scene,
      duration: store.songDuration,
      playing: store.playing,
      songs: store.playlist,
      songIndex: store.songIndex,
      shuffle: store.shuffle
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Player);