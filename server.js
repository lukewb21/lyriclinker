async function server(){

    // LOAD REQUIRED LIBRARIES //
    const express = require('express');
    const ejs = require('ejs');
    const http = require('http');
    const axios = require('axios');
    const path = require('path');
    const app = express();
    const querystring = require('querystring');
    const dotenv = require('dotenv');
    const cookieParser = require('cookie-parser');

    var token = "";

    // SET PORT FOR SERVER //
    const PORT = 3000;

    // LOAD CONFIG FILE FOR API CODES //
    require('dotenv').config(); // Load environment variables from .env file
    const config = require('./config');
    const client_id = config.clientId;
    const client_secret = config.clientSecret;
    const redirect_uri = 'http://192.168.1.149:3000/search';

    // SET RENDERING ENGINE //
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(cookieParser());
    app.set('view engine', 'ejs');

    // RANDOM STRING GENERATOR FOR LOGIN //
    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          result += characters.charAt(randomIndex);
        }
        return result;
    }

    // RANDOM NUMBER GENERATOR FOR RECOMMENDATION //
    function getRandomNumber(max) {
        // Ensure max is a positive integer
        x = Math.floor(max);
      
        if (isNaN(max) || max <= 0) {
          throw new Error("Input must be a positive integer");
        }
      
        // Generate a random number between 1 and max
        const randomNumber = Math.floor(Math.random() * max) + 1;
      
        return randomNumber;
    }

    // GET ACCESS TOKEN //
    async function getToken(code) {
        const clientId = client_id;
        const clientSecret = client_secret;
        const authorizationCode = code;
        const redirectUri = redirect_uri;
    
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenEndpoint = 'https://accounts.spotify.com/api/token';
    
        const requestBody = {
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: redirectUri
        };
    
        const headers = {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
    
        try {
            const response = await axios.post(tokenEndpoint, new URLSearchParams(requestBody), { headers });
            return response.data;
        } catch (error) {
            console.error('Error during token retrieval:', error.response ? error.response.data : error.message);
            throw error; // Re-throw the error to be caught by the calling function
        }
    }

    // SPOTIFY API REQUESTS //
    async function spotifyAPI(urlPath, APItoken) {
        try {
            const url = "https://api.spotify.com/v1/" + urlPath;
    
            const headers = {
                'Authorization': `Bearer ${APItoken}`
            };
    
            const response = await axios.get(url, { headers });

            return(response.data);
        } catch (error) {
            console.error('Error during Spotify API request:', error.response ? error.response.data : error.message);
        }
    }

    // GET ALBUM //
    async function getAlbum(albumID){
        const urlEnd = "albums/" + albumID;
        return await spotifyAPI(urlEnd, token); 
    }

    // GET ALBUM TRACKS //
    async function getAlbumTracks(albumID){
        const urlEnd = "albums/" + albumID +"/tracks";
        return await spotifyAPI(urlEnd, token); 
    }

    // GET ARTIST //
    async function getArtist(artistID){
        const urlEnd = "artists/" + artistID;
        return await spotifyAPI(urlEnd, token); 
    }

    // GET SIMILAR ARTISTS //
    async function getSimilarArtists(artistIDs){
        const urlEnd = "artists/" + artistIDs + "/related";
        return await spotifyAPI(urlEnd, token); 
    }

    // GET TRACK //
    async function getTrack(trackID){
        const urlEnd = "tracks/" + tracksID;
        return await spotifyAPI(urlEnd, token); 
    }

    // GET RECOMMENDATIONS (BY ARTISTS) (OBSCURITY = <25/50) //
    async function getRecs(artistIDs){
        const urlEnd = "recommendations?limit=50&seed_artists=" + artistIDs +"&min_popularity=0&max_popularity=25";
        return await spotifyAPI(urlEnd, token);
    }

    // SEARCH ITEM //
    async function searchAPI(query, type){
        const urlEnd = "search?q=" + query + "&type=" + type;
        return await spotifyAPI(urlEnd, token);
    }

    // GET 1 TRACK REC FROM ARTIST NAME //
    async function getTrackRec(query){
        // get artist ID //
        const searchResult = await searchAPI(query, "artist");
        const artistID = searchResult.artists.items[0].id;

        // get recs based on search //
        const recommendations = await getRecs(artistID); // CHANGE HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // get number of results //
        var maxResults = recommendations.seeds[0].afterFilteringSize;

        if (maxResults > 50){
            maxResults = 50;
        };

        // get random number from 1 to max //
        const trackNum = getRandomNumber(maxResults);
        
        // get song from API result at position x //
        const trackInfo = recommendations.tracks[trackNum];

        // Get track info //
        const trackID = "test";
        const trackName = trackInfo.name;
        const trackCover = trackInfo.album.images[0].url;
        const trackArtist = trackInfo.artists[0].name;
        console.log(trackArtist);

        const trackInfoArr = [trackID, trackName, trackCover, trackArtist];

        return trackInfoArr;
    }

    // HOMEPAGE //
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // SEARCH PAGE //
    app.get('/search', async (req, res) => {
        const code = req.query.code;
        console.log("Code: " + code);

        const state = req.query.state;
        console.log("State: " + state);

        if (req.cookies.LoginSession = undefined){
            res.cookie('LoginSession', code, {
                maxAge: 1000 * 60 * 60, // expires after 1 hour //
                httpOnly: true
            });
        };

        var tokenResponse = {};

        // if code not found in parameters, display homepage //
        if (code != null){
            tokenResponse = await getToken(code);
        } else {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }

        // if accesstoken not found in api response, display homepage //
        if (tokenResponse && tokenResponse.access_token) {
            token = tokenResponse.access_token;
            console.log("Token: " + token);

            res.render('pages/_search');

        } else {
            console.error('Unable to retrieve access token');
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        };

    });

    // RESULT PAGE //
    app.get('/result', async (req, res) => {
        const code = req.cookies.LoginSession;
        const query = req.query.query;

        const songInfo = await getTrackRec(query);

        const id = songInfo[0];
        const title = songInfo[1];
        const cover = songInfo[2];
        const artist = songInfo[3];

        console.log("RECOMMENDATION FOUND!");
        console.log("TITLE: " + title);
        console.log("ARTIST: " + artist);

        res.render('pages/_result',{
            albumCoverUrl: cover,
            songTitle: title,
            artistName: artist
        });

    });

    // SPOTIFY LOGIN //
    app.get('/login', function(req, res) {

        var state = generateRandomString(16);
        var scope = 'user-read-private user-read-email';
      
        new Promise((resolve, reject) => {
            res.redirect('https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: client_id,
                    scope: scope,
                    redirect_uri: redirect_uri,
                    state: state
                }));
            resolve();
        }).then(() => {
            console.log("USER AUTHENTICATED");
        });
    });

    // START LOCAL SERVER //
    app.listen(PORT, () => {
        console.log("Server is running at http://192.168.1.149:" + PORT);
    });
}

server();