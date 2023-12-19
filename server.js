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

    // SPOTIFY API REQUEST //
    function spotifyAPI(urlPath, code){
        var url = "https://api.spotify.com/v1/" + urlPath;

        const headers = {
            'Authorization': `Bearer ${code}`
        };
        
        axios.get(url, { headers })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error('Error:', error.response ? error.response.data : error.message)
            });
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

        const tokenResponse = await getToken(code);

        if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            console.log("Token: " + token);
        } else {
            console.error('Unable to retrieve access token');
        }

        res.render('pages/_search');
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