import * as types from './types';
import * as Utils from '../helpers/utils';
import {setSongs} from './music.actions';

export function setPlaying(status) {
  return {
    type: types.SET_PLAYING,
    status
  }
}

export function setSongDuration(duration) {
  return {
    type: types.SET_DURATION,
    duration
  }
}

export function setProgress(time) {
  return {
    type: types.SET_PROGRESS,
    time
  }
}

export function setSongIndex(index) {
  return {
    type: types.SET_SONG_INDEX,
    index
  }
}

export function setShuffle(status) {
  return {
    type: types.SET_SHUFFLE,
    status
  }
}

export function setPlaylist(songs) {
  return {
    type: types.SET_PLAYLIST,
    songs
  }
}

export function setPlayingSong(index, playlist) {
  return dispatch => {
    if(playlist) dispatch(setPlaylist(playlist));
    dispatch(setSongIndex(index))
    dispatch(setPlaying(true))
  }
}

export function getSongs() {
    return async (dispatch) => {
      let songs = await Utils.getSongsFromStorage();
      dispatch(setPlaylist(songs));
      return dispatch(setSongs(songs));
    }
}