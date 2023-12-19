const express = require('express');
const ejs = require('ejs');
const http = require('http');
const axios = require('axios');
const path = require('path');
const app = express();
const querystring = require('querystring');
const PORT = 3000;
const client_id = config.clientId;
const client_secret = config.clientSecret;
const redirect_uri = 'http://localhost:3000/';    
    
    
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

    var testRequest = spotifyAPI("", "");