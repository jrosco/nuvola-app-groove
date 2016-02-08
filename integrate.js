/*
 * Copyright 2015 Joel Cumberland <joel_c@zoho.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

(function(Nuvola)
{

    // Autoplay Setting
    var AUTO_PLAY = "app.autoplay";

    // Create media player component
    var player = Nuvola.$object(Nuvola.MediaPlayer);

    // Handy aliases
    var PlaybackState = Nuvola.PlaybackState;
    var PlayerAction = Nuvola.PlayerAction;

    // Create new WebApp prototype
    var WebApp = Nuvola.$WebApp();


    WebApp._onInitAppRunner = function(emitter)
    {
        Nuvola.WebApp._onInitAppRunner.call(this, emitter);

        Nuvola.config.setDefault(AUTO_PLAY, false);

        Nuvola.core.connect("PreferencesForm", this);

    }

    WebApp._onPreferencesForm = function(emitter, values, entries)
    {
        this.appendPreferences(values, entries);
    }

    WebApp.appendPreferences = function(values, entries)
    {
        values[AUTO_PLAY] = Nuvola.config.get(AUTO_PLAY);
        
        var _ = Nuvola.Translate.gettext;
        entries.push(["header", _("Groove Settings")]);
        entries.push(["bool", AUTO_PLAY, _("Enable autoplay songs on start-up")]);
    }

    // Initialization routines
    WebApp._onInitWebWorker = function(emitter)
    {
        Nuvola.WebApp._onInitWebWorker.call(this, emitter);

        var state = document.readyState;
        if (state === "interactive" || state === "complete")
            this._onPageReady();
        else
            document.addEventListener("DOMContentLoaded", this._onPageReady.bind(this));
    }

    // Page is ready for magic
    WebApp._onPageReady = function()
    {
        // Connect handler for signal ActionActivated
        Nuvola.actions.connect("ActionActivated", this);

        // Wait for groove player to load
        this.isGroovePlayerReady();
    }

    WebApp.isGroovePlayerReady = function()
    {
        if (playerInterface.getCurrent())
        {
            console.log(Nuvola.format('Groove Player [loaded]'));
            this.clickPlay = document.getElementsByClassName('iconPlayerPlay');
            this.clickPause = document.getElementsByClassName('iconPlayerPause');
            this.clickNext = document.getElementsByClassName('iconPlayerNext');
            this.clickPrevious = document.getElementsByClassName('iconPlayerPrevious');
            var maxVolume = document.getElementsByClassName('sliderButton iconPlayerSecondaryTrackCursor');

            Nuvola.config.get(AUTO_PLAY) ? this.clickPlay.item('click').click() : false;
            
            this.update();
        }
        else
        {
            setTimeout(this.isGroovePlayerReady.bind(this), 100);
        }
    }

    // Extract data from the web page
    WebApp.update = function()
    {
        try
        {

            var imgElement =
                document.getElementsByClassName('playerNowPlayingImg')[1].getElementsByTagName('img')[1];
            this.artistImg = imgElement.getAttribute('src');

            var artistElement =
                document.getElementsByClassName('playerNowPlayingMetadata')[1].getElementsByTagName('a')[1];
            this.artisTitle = artistElement.getAttribute('title');

            var songElement =
                document.getElementsByClassName('playerNowPlayingMetadata')[1].getElementsByTagName('a')[0];
            this.songTitle = songElement.getAttribute('title');

        }
        catch (e)
        {
            console.log(Nuvola.format('Error getting song info : {1}'), e);
        }

        var track = {
            title: this.songTitle,
            artist: this.artisTitle,
            album: null, //TODO : Find a way to get artist ablum info. jrosco/nuvola-app-groove/#2
            artLocation: this.artistImg
        }

        player.setTrack(track);
2
        var playEnabled = (this.clickPlay.length == 1) ? true : false;
        var pauseEnabled = (this.clickPause.length == 1) ? true : false;
        var nextEnabled = (this.clickNext.length == 1) ? true : false;
        var previousEnabled = (this.clickPrevious.length == 1) ? true : false;

        this.state = playEnabled ? PlaybackState.PAUSED :
            (pauseEnabled ? PlaybackState.PLAYING : PlaybackState.UNKNOWN);

        player.setPlaybackState(this.state);

        player.setCanPlay(playEnabled);
        player.setCanPause(pauseEnabled);
        player.setCanGoNext(nextEnabled);
        player.setCanGoPrev(previousEnabled);

        // Schedule the next update
        setTimeout(this.update.bind(this), 500);
    }

    // Handler of playback actions
    WebApp._onActionActivated = function(emitter, name, param)
    {

        try
        {
            switch (name)
            {
                case PlayerAction.PLAY:
                    this.clickPlay.item('click').click();
                    break;
                case PlayerAction.PAUSE:
                    this.clickPause.item('click').click();
                    break;
                case PlayerAction.TOGGLE_PLAY:
                    (this.state == PlaybackState.PLAYING) ? this.clickPause.item('click').click():
                        this.clickPlay.item('click').click();
                    break;
                case PlayerAction.PREV_SONG:
                    this.clickPrevious.item('click').click();
                    break;
                case PlayerAction.NEXT_SONG:
                    this.clickNext.item('click').click();
                    break;
                default:
                    // Other commands are not supported
                    throw {
                        'message': 'Not supported.'
                    };
            }
        }
        catch (e)
        {
            console.log(Nuvola.format('Play back error : {1}'), e);
        }
    }

    WebApp.start();

})(this); // function(Nuvola)
