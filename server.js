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
    var token = "";

    // SET PORT FOR SERVER //
    const PORT = 3000;

    // LOAD CONFIG FILE FOR API CODES //
    require('dotenv').config(); // Load environment variables from .env file
    const config = require('./config');
    const client_id = config.clientId;
    const client_secret = config.clientSecret;
    const redirect_uri = 'http://localhost:3000/search';

    // SET RENDERING ENGINE //
    app.use(express.static(path.join(__dirname, 'public')));
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
            console.log(response.data);
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

    // GET RECOMMENDATIONS (BY ARTISTS) (OBSCURE) //
    async function getRecs(artistIDs){
        const urlEnd = "recommendations?limit=10&seed_artists=" + artistIDs +"&min_popularity=0&max_popularity=25";
        return await spotifyAPI(urlEnd, token);
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

            // MAIN CODE //

            await getRecs("70S4sHnxr55YQxZ53H5guq"); // CHANGE HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

            //-----------//
            res.render('pages/_search');
        } else {
            console.error('Unable to retrieve access token');
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }

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
        console.log("Server is running at http://localhost:" + PORT);
    });
}

server();